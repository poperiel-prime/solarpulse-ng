import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Shared server-side store for the curator notebook.
 *
 * Driver order:
 *  1. Netlify Blobs  — used once deployed to Netlify (survives serverless).
 *  2. File under /data — used in this preview and on any normal Node host.
 *  3. Memory          — last resort on a read-only filesystem; NOT shared
 *                       between instances, and reported honestly to the UI.
 *
 * Only API routes touch this module. The browser never imports it.
 */

export type StoreMode = "netlify-blobs" | "file" | "memory";
export type Collection = "published" | "inbox" | "sources";

const DATA_DIR = path.join(process.cwd(), "data");
const BLOB_STORE = "solarpulse";

interface Driver {
  mode: StoreMode;
  read<T>(key: Collection): Promise<T[] | null>;
  write<T>(key: Collection, value: T[]): Promise<void>;
}

const memoryData = new Map<Collection, unknown[]>();

const memoryDriver: Driver = {
  mode: "memory",
  async read<T>(key: Collection) {
    return (memoryData.get(key) as T[] | undefined) ?? null;
  },
  async write<T>(key: Collection, value: T[]) {
    memoryData.set(key, value);
  },
};

const fileDriver: Driver = {
  mode: "file",
  async read<T>(key: Collection) {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, `${key}.json`), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : null;
    } catch {
      return null;
    }
  },
  async write<T>(key: Collection, value: T[]) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const target = path.join(DATA_DIR, `${key}.json`);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(tmp, target); // atomic swap, never a half-written file
  },
};

function blobsEnabled(): boolean {
  return Boolean(
    process.env.NETLIFY ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY_SITE_ID,
  );
}

async function makeBlobsDriver(): Promise<Driver | null> {
  if (!blobsEnabled()) return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    // Probe once so a misconfigured environment falls back immediately.
    await store.get("__probe", { type: "text" });
    return {
      mode: "netlify-blobs",
      async read<T>(key: Collection) {
        const value = await store.get(key, { type: "json" });
        return Array.isArray(value) ? (value as T[]) : null;
      },
      async write<T>(key: Collection, value: T[]) {
        await store.setJSON(key, value);
      },
    };
  } catch {
    return null;
  }
}

let driverPromise: Promise<Driver> | null = null;

async function pickDriver(): Promise<Driver> {
  const blobs = await makeBlobsDriver();
  if (blobs) return blobs;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_DIR);
    return fileDriver;
  } catch {
    return memoryDriver;
  }
}

function driver(): Promise<Driver> {
  driverPromise ??= pickDriver();
  return driverPromise;
}

/** Serialize read-modify-write per collection so concurrent saves cannot clobber. */
const locks = new Map<Collection, Promise<unknown>>();

function withLock<T>(key: Collection, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

export async function readCollection<T>(key: Collection): Promise<T[]> {
  const d = await driver();
  try {
    return (await d.read<T>(key)) ?? [];
  } catch {
    return [];
  }
}

export async function writeCollection<T>(key: Collection, value: T[]): Promise<void> {
  const d = await driver();
  await d.write(key, value);
}

/** Atomic read → transform → write. Returns whatever the mutator returns. */
export async function mutateCollection<T, R>(
  key: Collection,
  mutator: (current: T[]) => { next: T[]; result: R } | Promise<{ next: T[]; result: R }>,
): Promise<R> {
  return withLock(key, async () => {
    const current = await readCollection<T>(key);
    const { next, result } = await mutator(current);
    await writeCollection(key, next);
    return result;
  });
}

export interface StoreInfo {
  mode: StoreMode;
  /** True when every visitor reads the same data. */
  shared: boolean;
  label: string;
}

export async function storeInfo(): Promise<StoreInfo> {
  const d = await driver();
  if (d.mode === "netlify-blobs") {
    return { mode: d.mode, shared: true, label: "Storage: shared (Netlify Blobs)" };
  }
  if (d.mode === "file") {
    return { mode: d.mode, shared: true, label: "Storage: shared (server file)" };
  }
  return { mode: d.mode, shared: false, label: "Storage: local preview only" };
}

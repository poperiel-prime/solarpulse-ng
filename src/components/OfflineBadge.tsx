"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function OfflineBadge() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[76px] z-50 flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-card px-4 py-2.5 text-[13px] font-semibold text-gold shadow-2xl md:inset-x-auto md:bottom-6 md:right-6"
    >
      <WifiOff size={15} aria-hidden="true" />
      Offline — dates may be stale
    </div>
  );
}

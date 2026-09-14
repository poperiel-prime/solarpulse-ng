import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import OfflineBadge from "@/components/OfflineBadge";
import SiteHeader from "@/components/SiteHeader";
import SwRegister from "@/components/SwRegister";
import ThisWeekBar from "@/components/ThisWeekBar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://solarpulse.ng"),
  title: {
    default: "SolarPulse NG — Nigerian solar events calendar",
    template: "%s — SolarPulse NG",
  },
  description:
    "Expos, tenders, trainings and industry meetings for solar in Nigeria. Times in WAT.",
  applicationName: "SolarPulse NG",
  keywords: [
    "solar events Nigeria",
    "Nigerian solar calendar",
    "solar expo Lagos",
    "solar tenders Nigeria",
    "REAN",
    "renewable energy Nigeria",
  ],
  openGraph: {
    title: "SolarPulse NG — Nigerian solar events calendar",
    description:
      "Expos, tenders, trainings and industry meetings for solar in Nigeria. Times in WAT.",
    siteName: "SolarPulse NG",
    locale: "en_NG",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SolarPulse NG" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SolarPulse NG",
    description: "What is happening in Nigerian solar this month.",
    images: ["/og.jpg"],
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "SolarPulse NG",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B1220",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-ink text-cream">
        <div className="sticky top-0 z-50">
          <SiteHeader />
          <ThisWeekBar />
        </div>
        <main id="main" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <OfflineBadge />
        <SwRegister />
      </body>
    </html>
  );
}

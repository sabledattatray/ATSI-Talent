import { StructuredData } from "@/components/common/StructuredData";
import { organizationGraph } from "@/lib/structured-data";
import { staticMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/seo";
import { SkipToContent } from "@/components/common/SkipToContent";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/components/recruitment/portal.css";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  ...staticMetadata("/"),
  metadataBase: new URL(SITE_URL),
  title: { default: "Recruitment Agency for Analytics, MIS, IT & Finance | ATSAI", template: "%s | ATSAI" },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "any" }], apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <StructuredData data={organizationGraph()} />
        <SkipToContent />
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><SiteChrome>{children}</SiteChrome></Suspense>
      </body>
    </html>
  );
}

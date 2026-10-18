import { PUBLIC_INDEXING, SITE_URL } from "@/lib/seo";
import { SkipToContent } from "@/components/common/SkipToContent";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ATSAI Talent Solutions | Connecting Talent. Empowering Careers.",
    template: "%s | ATSAI Talent Solutions",
  },
  description:
    "Credible recruitment consultancy, verified jobs directory, and talent solutions in India. Specialized in Analytics, MIS, Power BI, SQL, BFSI, and IT hiring.",
  keywords: [
    "recruitment agency",
    "verified jobs India",
    "data analytics jobs",
    "MIS specialist jobs",
    "Power BI consultant hiring",
    "BFSI talent solutions",
    "ATSAI",
  ],
  authors: [{ name: "ATSAI Talent Solutions" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "ATSAI Talent Solutions",
    title: "ATSAI Talent Solutions | Connecting Talent. Empowering Careers.",
    description: "Verified recruitment consultancy and transparent jobs marketplace.",
  },
  robots: {
    index: PUBLIC_INDEXING,
    follow: PUBLIC_INDEXING,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
        <SkipToContent />
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><SiteChrome>{children}</SiteChrome></Suspense>
      </body>
    </html>
  );
}

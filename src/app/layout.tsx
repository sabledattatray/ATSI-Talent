import { StructuredData } from "@/components/common/StructuredData";
import { organizationGraph } from "@/lib/structured-data";
import { staticMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/seo";
import { SkipToContent } from "@/components/common/SkipToContent";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/components/recruitment/portal-base.css";
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
});

export const metadata: Metadata = {
  ...staticMetadata("/"),
  metadataBase: new URL(SITE_URL),
  title: { default: "ATSAI Talent Solutions | Recruitment Software & HR Technology Solutions", template: "%s | ATSAI" },
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
      <head>
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MH333M4J');` }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MH333M4J"
            height="0"
            width="0"
            title="Google Tag Manager"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <StructuredData data={organizationGraph()} />
        <SkipToContent />
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><SiteChrome>{children}</SiteChrome></Suspense>
      </body>
    </html>
  );
}

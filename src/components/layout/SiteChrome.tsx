"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DEMO_MODE } from "@/lib/runtime";
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/admin" || path.startsWith("/admin/")) return <main id="main-content" tabIndex={-1}>{children}</main>;
  return <><aside className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-950 text-center">{DEMO_MODE ? "Development preview — sample recruitment workflows are illustrative. Admin-published jobs and articles are stored on this server. Candidate demo records remain in this tab; resumes are not uploaded and no messages are sent." : "Pre-launch preview — business details and legal content await verification. Recruitment submissions remain unavailable. Published editorial content is managed by the ATS AI team."}</aside><Suspense fallback={<div className="h-18 bg-white border-b border-slate-200" />}><Header /></Suspense><main id="main-content" tabIndex={-1} className="flex-1">{children}</main><Footer /></>;
}

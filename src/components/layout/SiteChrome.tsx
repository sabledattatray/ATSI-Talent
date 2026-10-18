"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DEMO_MODE } from "@/lib/runtime";
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/admin" || path.startsWith("/admin/")) return <main id="main-content" tabIndex={-1}>{children}</main>;
  return <>{DEMO_MODE && <aside className="bg-amber-50 px-4 py-2 text-sm text-center">Local development includes sample jobs. Registered accounts and submitted forms use the configured database.</aside>}<Suspense fallback={<div className="h-18 bg-white border-b border-slate-200" />}><Header /></Suspense><main id="main-content" tabIndex={-1} className="flex-1">{children}</main><Footer /></>;
}

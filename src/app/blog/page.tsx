import { Suspense } from "react";
import { PublicBlog } from "@/components/admin/PublicBlog";
export const metadata = { title: "Journal | Careers, Hiring & Insights", description: "Career guidance, recruitment perspectives, and hiring insights from ATS AI Talent Solutions." };
export default function Page() { return <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading our journal…</div>}><PublicBlog /></Suspense>; }

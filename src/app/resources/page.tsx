import { Suspense } from "react";
import { PublicBlog } from "@/components/admin/PublicBlog";
export const metadata = { title: "Career and hiring resources", description: "Career guides, hiring advice, and editorial insights from ATS AI." };
export default function Page() { return <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading resources…</div>}><PublicBlog /></Suspense>; }

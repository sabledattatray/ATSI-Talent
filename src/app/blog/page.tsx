import { staticMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { PublicBlog } from "@/components/admin/PublicBlog";
export const metadata = staticMetadata("/blog");
export default function Page() { return <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading our journal…</div>}><PublicBlog /></Suspense>; }

import { Suspense } from "react";
import { connection } from "next/server";
import { publicJobs } from "@/lib/admin/public";
import { staticMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";
export const metadata = staticMetadata("/");
async function HomeContent() { await connection(); return <HomeClient initialJobs={await publicJobs()} />; }
export default function Page() { return <Suspense fallback={<div className="p-16 text-center">Loading recruitment and career opportunities…</div>}><HomeContent /></Suspense>; }

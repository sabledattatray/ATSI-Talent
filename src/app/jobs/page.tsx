import { Suspense } from "react";
import { connection } from "next/server";
import { publicJobs } from "@/lib/admin/public";
import { staticMetadata } from "@/lib/seo";
import JobsClient from "./JobsClient";
export const metadata = staticMetadata("/jobs");
async function Directory() { await connection(); return <JobsClient initialJobs={await publicJobs()} />; }
export default function Page() { return <Suspense fallback={<div className="p-16 text-center">Loading current job openings…</div>}><Directory /></Suspense>; }

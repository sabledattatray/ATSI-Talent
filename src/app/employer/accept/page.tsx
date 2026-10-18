import { Suspense } from "react";
import { EmployerAuth } from "@/components/ats/EmployerAuth";
async function Accept({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <EmployerAuth mode="accept" token={params.token || ""} />; }
export default function Page(props: { searchParams: Promise<{ token?: string }> }) { return <Suspense fallback={<p>Opening invitation…</p>}><Accept {...props} /></Suspense>; }

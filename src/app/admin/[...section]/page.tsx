import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminRoute } from "@/components/admin/AdminRoute";
async function Content({ params }: { params: Promise<{ section: string[] }> }) { const { section } = await params; if (section.length !== 1 || !["login", "signup", "jobs", "blog", "media", "team", "settings", "activity"].includes(section[0])) notFound(); return <AdminRoute section={section[0]} />; }
export default function Page({ params }: { params: Promise<{ section: string[] }> }) { return <Suspense fallback={<div className="cms-boot">Opening your workspace…</div>}><Content params={params} /></Suspense>; }

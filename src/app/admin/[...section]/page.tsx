import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminRoute } from "@/components/admin/AdminRoute";
async function Content({ params }: { params: Promise<{ section: string[] }> }) { const { section } = await params; if (section.length !== 1 || !["inbox", "users", "login", "signup", "jobs", "blog", "media", "team", "settings", "activity", "job-intelligence"].includes(section[0])) notFound(); return <AdminRoute section={section[0]} />; }
export default function Page({ params }: { params: Promise<{ section: string[] }> }) { return <Suspense fallback={<PageSkeleton title="Administration" />}><Content params={params} /></Suspense>; }

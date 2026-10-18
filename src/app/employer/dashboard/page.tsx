import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { employerUser, employerWorkspace } from "@/lib/ats";
import { EmployerWorkspace } from "@/components/ats/EmployerWorkspace";
export const metadata = { title: "Hiring workspace | ATSAI Talent Solutions" };
async function Dashboard() { await connection(); const user = await employerUser(); if (!user) redirect("/employer/login"); return <EmployerWorkspace initial={await employerWorkspace(user)} />; }
export default function Page() { return <Suspense fallback={<div className="talent-container">Opening your hiring workspace…</div>}><Dashboard /></Suspense>; }

import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { candidateUser, candidateDashboard } from "@/lib/recruitment";
import { CandidatePortal } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Your candidate workspace" };
async function Dashboard() { await connection(); const user = await candidateUser(); if (!user) redirect("/candidate/login"); return <CandidatePortal initial={await candidateDashboard(user)} />; }
export default function Page() { return <Suspense fallback={<div className="talent-container">Opening your workspace…</div>}><Dashboard /></Suspense>; }

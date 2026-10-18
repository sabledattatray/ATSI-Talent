import { Suspense } from "react";
import { CandidateAuth } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Candidate sign up" };
export default function Page() { return <Suspense fallback={<div className="talent-container">Loading your account…</div>}><CandidateAuth signup={true} /></Suspense>; }

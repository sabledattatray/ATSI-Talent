import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { CandidateAuth } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Candidate sign up" };
export default function Page() { return <Suspense fallback={<PageSkeleton title="Create your candidate account" />}><CandidateAuth signup={true} /></Suspense>; }

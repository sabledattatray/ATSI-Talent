import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { CandidateAuth } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Candidate sign in" };
export default function Page() { return <Suspense fallback={<PageSkeleton title="Sign in to your candidate account" />}><CandidateAuth signup={false} /></Suspense>; }

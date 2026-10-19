import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { candidateUser } from "@/lib/recruitment";
import { records } from "@/lib/admin/db";
import { CandidateApply } from "@/components/recruitment/RecruitmentClient";
type Props = { params: Promise<{ slug: string }> };
export const metadata = { title: "Apply for an opportunity" };
async function Application({ params }: Props) { await connection(); const { slug } = await params; const user = await candidateUser(); if (!user) redirect(`/candidate/login?next=${encodeURIComponent(`/candidate/apply/${slug}`)}`); const job = (await records("job",true)).find(job => job.slug === slug); if (!job) notFound(); if (job.applicationUrl) redirect(`/jobs/${job.slug}`); return <CandidateApply job={{ id: job.id, title: job.title, company: job.company }} user={user} />; }
export default function Page(props: Props) { return <Suspense fallback={<PageSkeleton title="Your application" />}><Application {...props} /></Suspense>; }

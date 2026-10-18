import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { candidateUser, candidateDashboard } from "@/lib/recruitment";
import { CandidatePortal } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Your candidate workspace" };
type PageProps = { searchParams?: Promise<{ tab?: string }> };
async function Dashboard({ searchParams }: PageProps) {
  await connection();
  const user = await candidateUser();
  if (!user) redirect("/candidate/login");
  const params = searchParams ? await searchParams : {};
  return <CandidatePortal initial={await candidateDashboard(user)} defaultTab={params?.tab} />;
}
export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<div className="talent-container">Opening your workspace…</div>}>
      <Dashboard {...props} />
    </Suspense>
  );
}

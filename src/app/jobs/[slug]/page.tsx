import { PageSkeleton } from "@/components/common/PageSkeleton";
import { pageMetadata } from "@/lib/seo";
import { connection } from "next/server";
import { records } from "@/lib/admin/db";
import { toJobListing } from "@/lib/admin/public";
import { ManagedJob } from "@/components/admin/ManagedJob";
import { INITIAL_JOBS } from "@/lib/store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JobDetailClient } from "./JobDetailClient";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const managed = (await records("job", true)).find(j => j.slug === slug || j.id === slug);
  const job = managed ? toJobListing(managed) : INITIAL_JOBS.find((j) => j.slug === slug || j.id === slug);

  if (!job) notFound();

  const employerDisplay = job.isEmployerConfidential ? "Confidential Employer" : job.employerName;
  const title = managed?.seoTitle || `${job.title} at ${employerDisplay}`;
  const description = managed?.seoDescription || job.summary.slice(0, 160);
  return pageMetadata(`/jobs/${job.slug}`, title, description, managed?.cover || undefined);
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PageSkeleton title="Career opportunity" />
      }
    >
      <JobDetailContent params={params} />
    </Suspense>
  );
}

async function JobDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const managed = (await records("job", true)).find(j => j.slug === slug || j.id === slug);
  const job = managed ? toJobListing(managed) : INITIAL_JOBS.find((j) => j.slug === slug || j.id === slug);

  if (!job) notFound();
  if (managed) return <ManagedJob job={managed} />;

  return (
    <>

      <JobDetailClient slug={slug} />
    </>
  );
}

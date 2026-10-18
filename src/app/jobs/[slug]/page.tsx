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
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading verified requisition details...</p>
        </div>
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

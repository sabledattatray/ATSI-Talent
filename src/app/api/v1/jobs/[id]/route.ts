import { publicJobs } from "@/lib/admin/public";
import { isJobOpen } from "@/lib/jobs";
import { INITIAL_JOBS } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = [...publicJobs(), ...INITIAL_JOBS].find(
    (j) => j.id === id || j.slug === id || j.referenceId.toLowerCase() === id.toLowerCase()
  );

  if (!job || !isJobOpen(job, Date.now())) {
    return NextResponse.json(
      { error: "Job not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: { ...job, employerName: job.isEmployerConfidential ? "Confidential Employer" : job.employerName } });
}

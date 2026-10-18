import { publicJobs } from "@/lib/admin/public";
import { isJobOpen, matchesKeyword } from "@/lib/jobs";
import { DEMO_MODE } from "@/lib/runtime";
import { INITIAL_JOBS } from "@/lib/store";
import { NextResponse } from "next/server";
import { z } from "zod";
const integer = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(80)).optional();
const filters = z.object({
  q: z.string().max(200).optional(), location: z.string().max(100).optional(),
  workMode: z.enum(["All", "Remote", "Hybrid", "On-site"]).optional(),
  expMin: integer, expMax: integer,
  sort: z.enum(["latest", "salary"]).default("latest"),
}).refine(value => value.expMin === undefined || value.expMax === undefined || value.expMin <= value.expMax, { message: "Experience minimum must not exceed maximum" });
export async function GET(request: Request) {
  const result = filters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!result.success) return NextResponse.json({ error: "Invalid search filters", code: "VALIDATION_ERROR" }, { status: 400 });
  const f = result.data;
  const now = Date.now();
  const jobs = [...publicJobs(), ...INITIAL_JOBS].filter(job => isJobOpen(job, now)
    && (!f.q || matchesKeyword(job, f.q))
    && (!f.location || `${job.location.city} ${job.location.state} ${job.location.country}`.toLowerCase().includes(f.location.toLowerCase()))
    && (!f.workMode || f.workMode === "All" || job.workMode === f.workMode)
    && (f.expMin === undefined || job.experienceMaxYears >= f.expMin)
    && (f.expMax === undefined || job.experienceMinYears <= f.expMax));
  jobs.sort(f.sort === "salary" ? (a,b) => (b.isSalaryDisclosed ? b.salaryMax || 0 : 0) - (a.isSalaryDisclosed ? a.salaryMax || 0 : 0) : (a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return NextResponse.json({ data: jobs.map(job => ({ ...job, employerName: job.isEmployerConfidential ? "Confidential Employer" : job.employerName })), meta: { total: jobs.length, demo: DEMO_MODE } });
}

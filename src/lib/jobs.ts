import type { JobListing } from "./types";
export function isJobOpen(job: JobListing, now: number): boolean {
  return job.status === "Published" && job.employerVerified && Date.parse(job.publishedAt) <= now && Date.parse(job.expiresAt) > now;
}
export function matchesKeyword(job: JobListing, term: string): boolean {
  const q = term.trim().toLowerCase();
  return [job.title, job.department, job.summary, ...job.skills, ...(job.isEmployerConfidential ? [] : [job.employerName])].some(value => value.toLowerCase().includes(q));
}

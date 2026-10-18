import type { ContentRecord } from "@/lib/admin/types";
import type { CandidateProfile } from "@/lib/recruitment";
export const STAGES = ["submitted", "review", "shortlisted", "interview", "interviewed", "selected", "offer", "hired", "rejected", "withdrawn"] as const;
export type Stage = typeof STAGES[number];
export const STAGE_LABELS: Record<Stage,string> = { submitted:"Applied",review:"In review",shortlisted:"Shortlisted",interview:"Interview scheduled",interviewed:"Interview completed",selected:"Selected",offer:"Offer",hired:"Hired",rejected:"Not selected",withdrawn:"Withdrawn" };
export type Employer = { id:string; organizationId:string; name:string; email:string; role:"owner"|"recruiter"; company:string; country:string; website:string };
export type TrackingEvent = { id:string; applicationId:string; kind:string; stage:string; message:string; createdAt:string };
export type Interview = { id:string; applicationId:string; title:string; startsAt:string; timeZone:string; location:string; status:string; createdAt:string };
export type Applicant = { id:string; candidateId:string; jobId:string; jobTitle:string; company:string; status:Stage; document:string; createdAt:string; updatedAt:string; name:string; email:string; version?:string };
export type ApplicantDocument = { profile:CandidateProfile; name:string; email:string; coverLetter:string };
export type EmployerWorkspace = { user:Employer; jobs:ContentRecord[]; applications:Applicant[]; events:TrackingEvent[]; interviews:Interview[]; team:{id:string;name:string;email:string;role:string}[] };
export const INDUSTRIES = ["Technology", "Healthcare", "Finance & Insurance", "Education", "Engineering & Manufacturing", "Sales & Marketing", "Retail & Hospitality", "Logistics & Supply Chain", "Construction & Real Estate", "Legal & Professional Services", "Energy & Environment", "Public Sector & Nonprofit", "Human Resources", "Creative & Media", "Other"];
export const CURRENCIES = Intl.supportedValuesOf("currency");
export function compensation(min:number|undefined,max:number|undefined,currency="INR",period="YEAR") {
  if (!max) return "Compensation not disclosed";
  const fmt=(value:number)=>new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:0}).format(value);
  return `${min ? `${fmt(min)} – ` : "Up to "}${fmt(max)} / ${period.toLowerCase()}`;
}

// Group original compensation by currency and pay period; no exchange-rate assumptions.
export function compareCompensation(a:{salaryCurrency:string;salaryPeriod?:string;salaryMax?:number},b:{salaryCurrency:string;salaryPeriod?:string;salaryMax?:number}) {
  return a.salaryCurrency.localeCompare(b.salaryCurrency) || (a.salaryPeriod || "YEAR").localeCompare(b.salaryPeriod || "YEAR") || (b.salaryMax || 0) - (a.salaryMax || 0);
}

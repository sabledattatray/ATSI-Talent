"use client";

import {
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INTERVIEWS,
  INITIAL_JOBS,
  INITIAL_LEADS,
  INITIAL_MANDATES,
  INITIAL_PLACEMENTS,
  INITIAL_RECRUITERS
} from "./store";
import {
  AbuseReport,
  AuditEvent,
  EmployerLead,
  HiringMandate,
  InterviewSchedule,
  JobApplication,
  JobListing,
  PlacementRecord,
  PrivacyRequest,
  VerifiedRecruiter
} from "./types";

import { z } from "zod";
import { isJobOpen } from "./jobs";
import { DEMO_MODE } from "./runtime";

const STORAGE_KEYS = {
  JOBS: "atsai_demo_jobs_v2",
  APPLICATIONS: "atsai_demo_applications_v2",
  LEADS: "atsai_demo_leads_v2",
  MANDATES: "atsai_demo_mandates_v2",
  INTERVIEWS: "atsai_demo_interviews_v2",
  PLACEMENTS: "atsai_demo_placements_v2",
  AUDIT_LOGS: "atsai_demo_audit_v2",
  ABUSE_REPORTS: "atsai_demo_abuse_reports_v2",
  PRIVACY_REQUESTS: "atsai_demo_privacy_v2",
  SAVED_JOBS: "atsai_demo_saved_jobs_v2",
};

const text = z.string();
const strings = z.array(text);
const storedJob = z.object({
  id: text, referenceId: text, slug: text, title: text, department: text, employerName: text,
  isEmployerConfidential: z.boolean(), employerVerified: z.boolean(),
  location: z.object({ city: text, state: text, country: text, isRemoteFriendly: z.boolean() }),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]), employmentType: text,
  experienceMinYears: z.number(), experienceMaxYears: z.number(),
  salaryMin: z.number().optional(), salaryMax: z.number().optional(), salaryCurrency: text, isSalaryDisclosed: z.boolean(),
  summary: text, responsibilities: strings, requirements: strings, skills: strings, selectionStages: strings,
  questions: z.array(z.object({ id: text, question: text, type: z.enum(["text", "choice", "boolean"]), options: strings.optional(), required: z.boolean() })),
  status: text, publishedAt: text, expiresAt: text, recruiterContactChannel: text, applicationsCount: z.number(),
});
const storageSchemas: Record<string, z.ZodType> = {
  [STORAGE_KEYS.JOBS]: z.array(storedJob),
  [STORAGE_KEYS.SAVED_JOBS]: strings,
  [STORAGE_KEYS.APPLICATIONS]: z.array(z.object({ id: text, referenceId: text, jobId: text, jobTitle: text, employerName: text, candidateName: text, candidateEmail: text, candidatePhone: text, currentLocation: text, experienceYears: z.number(), noticePeriodDays: z.number(), resumeFileName: text, resumeFileSize: text, answers: z.record(text,text), roleSpecificConsentGiven: z.boolean(), consentTimestamp: text, status: text, appliedAt: text, updatedAt: text, timeline: z.array(z.object({ id: text, timestamp: text, status: text, actor: text, note: text.optional() })) })),
  [STORAGE_KEYS.LEADS]: z.array(z.object({ id: text, leadId: text, companyName: text, contactPerson: text, businessEmail: text, phone: text, hiringVolume: text, rolesNeeded: text, locations: text, timeline: text, status: text, createdAt: text })),
  [STORAGE_KEYS.MANDATES]: z.array(z.object({ id: text, mandateId: text, employerName: text, roleTitle: text, department: text, openingsCount: z.number(), experienceRange: text, budgetMaxLPA: z.number(), location: text, workMode: text, assignedRecruiterId: text, assignedRecruiterName: text, status: text, createdAt: text })),
  [STORAGE_KEYS.AUDIT_LOGS]: z.array(z.object({ id: text, timestamp: text, actor: text, actorRole: text, action: text, resourceType: text, resourceId: text, details: text })),
  [STORAGE_KEYS.ABUSE_REPORTS]: z.array(z.object({ id: text, reportId: text, type: text, reportedEntity: text, reporterEmail: text, description: text, status: text, createdAt: text })),
  [STORAGE_KEYS.PRIVACY_REQUESTS]: z.array(z.object({ id: text, requestId: text, requesterEmail: text, requesterName: text, type: text, status: text, createdAt: text })),
};

function getFromStorage<T>(key: string, fallback: T): T {
  if (!DEMO_MODE || typeof window === "undefined") return structuredClone(fallback);
  try {
    const item = sessionStorage.getItem(key);
    const parsed: unknown = item ? JSON.parse(item) : null;
    const schema = storageSchemas[key];
    return Array.isArray(parsed) && (!schema || schema.safeParse(parsed).success) ? parsed as T : structuredClone(fallback);
  } catch {
    // Embedded browsers may block storage. Reads still show fixtures; writes fail explicitly.
    return structuredClone(fallback);
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!DEMO_MODE || typeof window === "undefined") throw new Error("Demo storage is unavailable.");
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("atsai-demo-change"));
  } catch (e) {
    throw new Error("Could not save demo data. Browser storage may be blocked or full.", { cause: e });
  }
}

export const DataService = {
  // Jobs
  getJobs(): JobListing[] {
    return getFromStorage<JobListing[]>(STORAGE_KEYS.JOBS, INITIAL_JOBS);
  },

  getJobBySlug(slug: string): JobListing | undefined {
    const jobs = this.getJobs();
    return jobs.find((j) => j.slug === slug);
  },

  getJobById(id: string): JobListing | undefined {
    const jobs = this.getJobs();
    return jobs.find((j) => j.id === id);
  },

  saveJob(job: JobListing): void {
    const jobs = this.getJobs();
    const existingIndex = jobs.findIndex((j) => j.id === job.id);
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.unshift(job);
    }
    saveToStorage(STORAGE_KEYS.JOBS, jobs);
  },

  // Applications
  getApplications(): JobApplication[] {
    return getFromStorage<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  getApplicationById(id: string): JobApplication | undefined {
    return this.getApplications().find((a) => a.id === id || a.referenceId === id);
  },

  submitApplication(
    applicationData: Omit<JobApplication, "id" | "referenceId" | "appliedAt" | "updatedAt" | "timeline" | "status">
  ): JobApplication {
    const jobForApplication = this.getJobById(applicationData.jobId);
    if (!jobForApplication || !isJobOpen(jobForApplication, Date.now())) throw new Error("This job is not accepting applications.");
    if (applicationData.roleSpecificConsentGiven !== true) throw new Error("Explicit consent is required.");
    const apps = this.getApplications();
    if (apps.some(app => app.jobId === applicationData.jobId && app.candidateEmail.toLowerCase() === applicationData.candidateEmail.toLowerCase() && app.status !== "Withdrawn")) throw new Error("An active demo application already exists for this email and role.");
    const now = new Date().toISOString();

    const newApp: JobApplication = {
      ...applicationData,
      id: `app-${crypto.randomUUID()}`,
      referenceId: `APP-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      appliedAt: now,
      updatedAt: now,
      status: "Submitted",
      timeline: [
        {
          id: `evt-${crypto.randomUUID()}`,
          timestamp: now,
          status: "Submitted",
          note: "Application submitted with verified candidate consent.",
          actor: "Candidate",
        },
      ],
    };

    apps.unshift(newApp);
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);

    // Increment applications count on job
    const job = this.getJobById(applicationData.jobId);
    if (job) {
      job.applicationsCount = (job.applicationsCount || 0) + 1;
      this.saveJob(job);
    }

    // Record audit event
    this.addAuditEvent({
      actor: applicationData.candidateName,
      actorRole: "candidate",
      action: "APPLICATION_SUBMITTED",
      resourceType: "JobApplication",
      resourceId: newApp.id,
      details: `Application ${newApp.referenceId} submitted for ${applicationData.jobTitle}. Explicit consent documented.`,
    });

    return newApp;
  },

  withdrawApplication(appId: string, reason: string): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId || a.referenceId === appId);
    if (!app || app.status === "Withdrawn") return false;

    const now = new Date().toISOString();
    app.status = "Withdrawn";
    app.roleSpecificConsentGiven = false;
    app.updatedAt = now;
    app.timeline.push({
      id: `evt-${crypto.randomUUID()}`,
      timestamp: now,
      status: "Withdrawn",
      note: `Application withdrawn by candidate. Reason: ${reason || "No reason specified"}`,
      actor: "Candidate",
    });

    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);

    this.addAuditEvent({
      actor: app.candidateName,
      actorRole: "candidate",
      action: "APPLICATION_WITHDRAWN",
      resourceType: "JobApplication",
      resourceId: app.id,
      details: `Candidate withdrew application ${app.referenceId}. Consent revoked for this requisition.`,
    });

    return true;
  },

  updateApplicationStatus(
    appId: string,
    newStatus: JobApplication["status"],
    note: string,
    actor: "Recruiter" | "Employer" | "System"
  ): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === "Withdrawn" || !app.roleSpecificConsentGiven) return false;

    const now = new Date().toISOString();
    app.status = newStatus;
    app.updatedAt = now;
    app.timeline.push({
      id: `evt-${crypto.randomUUID()}`,
      timestamp: now,
      status: newStatus,
      note,
      actor,
    });

    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);

    this.addAuditEvent({
      actor: `${actor}`,
      actorRole: actor === "System" ? "System" : actor === "Employer" ? "employer" : "recruiter",
      action: `APPLICATION_STATUS_UPDATED_${newStatus.toUpperCase()}`,
      resourceType: "JobApplication",
      resourceId: app.id,
      details: `Status progressed to ${newStatus}. Note: ${note}`,
    });

    return true;
  },

  // Saved Jobs
  getSavedJobIds(): string[] {
    return getFromStorage<string[]>(STORAGE_KEYS.SAVED_JOBS, []);
  },

  toggleSaveJob(jobId: string): boolean {
    const saved = this.getSavedJobIds();
    const exists = saved.includes(jobId);
    let updated: string[];
    if (exists) {
      updated = saved.filter((id) => id !== jobId);
    } else {
      updated = [...saved, jobId];
    }
    saveToStorage(STORAGE_KEYS.SAVED_JOBS, updated);
    return !exists;
  },

  // Employer Leads
  getEmployerLeads(): EmployerLead[] {
    return getFromStorage<EmployerLead[]>(STORAGE_KEYS.LEADS, INITIAL_LEADS);
  },

  submitEmployerLead(
    leadData: Omit<EmployerLead, "id" | "leadId" | "createdAt" | "status">
  ): EmployerLead {
    const leads = this.getEmployerLeads();
    const newLead: EmployerLead = {
      ...leadData,
      id: `lead-${crypto.randomUUID()}`,
      leadId: `LEAD-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: "New",
    };
    leads.unshift(newLead);
    saveToStorage(STORAGE_KEYS.LEADS, leads);

    this.addAuditEvent({
      actor: leadData.contactPerson,
      actorRole: "employer",
      action: "EMPLOYER_INQUIRY_CREATED",
      resourceType: "EmployerLead",
      resourceId: newLead.id,
      details: `Lead ${newLead.leadId} created for company ${leadData.companyName}.`,
    });

    return newLead;
  },

  // Hiring Mandates
  getMandates(): HiringMandate[] {
    return getFromStorage<HiringMandate[]>(STORAGE_KEYS.MANDATES, INITIAL_MANDATES);
  },

  createMandate(
    mandateData: Omit<HiringMandate, "id" | "mandateId" | "createdAt" | "status" | "assignedRecruiterId" | "assignedRecruiterName">
  ): HiringMandate {
    const mandates = this.getMandates();
    const newMandate: HiringMandate = {
      ...mandateData,
      id: `mand-${crypto.randomUUID()}`,
      mandateId: `MAND-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      status: "Brief Received",
      assignedRecruiterId: "rec-1",
      assignedRecruiterName: "Ananya Sen",
      createdAt: new Date().toISOString(),
    };
    mandates.unshift(newMandate);
    saveToStorage(STORAGE_KEYS.MANDATES, mandates);

    this.addAuditEvent({
      actor: mandateData.employerName,
      actorRole: "employer",
      action: "HIRING_MANDATE_SUBMITTED",
      resourceType: "HiringMandate",
      resourceId: newMandate.id,
      details: `Mandate ${newMandate.mandateId} submitted for ${mandateData.roleTitle}.`,
    });

    return newMandate;
  },

  // Interviews
  getInterviews(): InterviewSchedule[] {
    return getFromStorage<InterviewSchedule[]>(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
  },

  // Placements
  getPlacements(): PlacementRecord[] {
    return getFromStorage<PlacementRecord[]>(STORAGE_KEYS.PLACEMENTS, INITIAL_PLACEMENTS);
  },

  // Audit Logs
  getAuditLogs(): AuditEvent[] {
    return getFromStorage<AuditEvent[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditEvent(
    event: Omit<AuditEvent, "id" | "timestamp">
  ): void {
    const logs = this.getAuditLogs();
    const newEvent: AuditEvent = {
      ...event,
      id: `aud-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEvent);
    // Keep last 100 logs
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100));
  },

  // Recruiter Verification
  verifyRecruiter(query: string): VerifiedRecruiter | undefined {
    const q = query.toLowerCase().trim();
    return INITIAL_RECRUITERS.find(
      (r) =>
        r.officialEmail.toLowerCase() === q ||
        r.recruiterId.toLowerCase() === q ||
        r.name.toLowerCase() === q
    );
  },

  getAllVerifiedRecruiters(): VerifiedRecruiter[] {
    return INITIAL_RECRUITERS;
  },

  // Abuse / Scam Reporting
  getAbuseReports(): AbuseReport[] {
    return getFromStorage<AbuseReport[]>(STORAGE_KEYS.ABUSE_REPORTS, []);
  },

  submitAbuseReport(
    report: Omit<AbuseReport, "id" | "reportId" | "createdAt" | "status">
  ): AbuseReport {
    const reports = this.getAbuseReports();
    const newReport: AbuseReport = {
      ...report,
      id: `rep-${crypto.randomUUID()}`,
      reportId: `FRAUD-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      status: "Under Investigation",
      createdAt: new Date().toISOString(),
    };
    reports.unshift(newReport);
    saveToStorage(STORAGE_KEYS.ABUSE_REPORTS, reports);

    this.addAuditEvent({
      actor: report.reporterEmail || "Anonymous",
      actorRole: "System",
      action: "FRAUD_INCIDENT_REPORTED",
      resourceType: "AbuseReport",
      resourceId: newReport.id,
      details: `Report ${newReport.reportId} submitted regarding ${report.reportedEntity}. Triage priority initiated.`,
    });

    return newReport;
  },

  // Privacy / DPDP Requests
  getPrivacyRequests(): PrivacyRequest[] {
    return getFromStorage<PrivacyRequest[]>(STORAGE_KEYS.PRIVACY_REQUESTS, []);
  },

  submitPrivacyRequest(
    request: Omit<PrivacyRequest, "id" | "requestId" | "createdAt" | "status">
  ): PrivacyRequest {
    const reqs = this.getPrivacyRequests();
    const newReq: PrivacyRequest = {
      ...request,
      id: `priv-${crypto.randomUUID()}`,
      requestId: `DPDP-${new Date().getFullYear()}-${crypto.randomUUID()}`,
      status: "Pending Verification",
      createdAt: new Date().toISOString(),
    };
    reqs.unshift(newReq);
    saveToStorage(STORAGE_KEYS.PRIVACY_REQUESTS, reqs);

    this.addAuditEvent({
      actor: request.requesterName,
      actorRole: "candidate",
      action: "PRIVACY_REQUEST_LOGGED",
      resourceType: "PrivacyRequest",
      resourceId: newReq.id,
      details: `DPDP request ${newReq.requestId} (${request.type}) received from ${request.requesterEmail}. Demo only; no verification email sent.`,
    });

    return newReq;
  },
};

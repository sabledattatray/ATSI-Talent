export type UserRole = "candidate" | "employer" | "recruiter" | "admin";

export type JobWorkMode = "Remote" | "Hybrid" | "On-site";
export type JobEmploymentType = "Full-time" | "Contract" | "Part-time" | "Executive";
export type JobStatus = "Draft" | "Review" | "Approved" | "Published" | "Paused" | "Closed" | "Expired";

export interface JobQuestion {
  id: string;
  question: string;
  type: "text" | "choice" | "boolean";
  options?: string[];
  required: boolean;
}

export interface JobLocation {
  city: string;
  state: string;
  country: string;
  isRemoteFriendly: boolean;
}

export interface JobListing {
  id: string;
  referenceId: string; // e.g. "ATS-2026-IT01"
  slug: string;
  title: string;
  department: string;
  employerName: string;
  isEmployerConfidential: boolean;
  employerVerified: boolean;
  location: JobLocation;
  workMode: JobWorkMode;
  employmentType: JobEmploymentType;
  experienceMinYears: number;
  experienceMaxYears: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  isSalaryDisclosed: boolean;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  selectionStages: string[];
  questions: JobQuestion[];
  status: JobStatus;
  publishedAt: string;
  expiresAt: string;
  recruiterContactChannel: string;
  applicationsCount: number;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Shortlisted"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected"
  | "Withdrawn";

export interface ApplicationEvent {
  id: string;
  timestamp: string;
  status: ApplicationStatus;
  note?: string;
  actor: "System" | "Candidate" | "Recruiter" | "Employer";
}

export interface JobApplication {
  id: string;
  referenceId: string; // e.g. "APP-2026-98124"
  jobId: string;
  jobTitle: string;
  employerName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  currentLocation: string;
  experienceYears: number;
  currentCompany?: string;
  currentDesignation?: string;
  noticePeriodDays: number;
  resumeFileName: string;
  resumeFileSize: string;
  answers: Record<string, string>;
  roleSpecificConsentGiven: boolean;
  consentTimestamp: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  timeline: ApplicationEvent[];
}

export interface EmployerLead {
  id: string;
  leadId: string; // e.g. "LEAD-2026-4091"
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  hiringVolume: string;
  rolesNeeded: string;
  locations: string;
  timeline: string;
  message?: string;
  status: "New" | "Contacted" | "Qualified" | "Mandate Signed" | "Closed";
  createdAt: string;
}

export interface HiringMandate {
  id: string;
  mandateId: string; // e.g. "MAND-2026-102"
  employerName: string;
  roleTitle: string;
  department: string;
  openingsCount: number;
  experienceRange: string;
  budgetMaxLPA: number;
  location: string;
  workMode: JobWorkMode;
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  status: "Brief Received" | "Review" | "Approved" | "Active Search" | "Shortlist Delivered" | "Fulfilled";
  createdAt: string;
}

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  employerName: string;
  stageName: string; // e.g. "Technical Screen", "Case Study", "Leadership Round"
  scheduledDateTime: string;
  timezone: string;
  mode: "Google Meet" | "Microsoft Teams" | "Office In-Person";
  locationOrUrl: string;
  status: "Scheduled" | "Completed" | "Rescheduled" | "Cancelled";
  feedback?: {
    technicalRating: number;
    communicationRating: number;
    recommendation: "Strong Yes" | "Yes" | "Neutral" | "No";
    notes: string;
  };
}

export interface PlacementRecord {
  id: string;
  placementId: string; // e.g. "PLC-2026-042"
  jobTitle: string;
  employerName: string;
  candidateName: string;
  offeredCTC: number; // in INR
  agencyFeePercentage: number;
  feeAmount: number;
  joiningDate: string;
  status: "Offer Accepted" | "Joined" | "Invoice Issued" | "Paid";
  invoiceNumber: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole | "System";
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress?: string;
}

export interface AbuseReport {
  id: string;
  reportId: string;
  type: "Job Scam" | "Impersonation" | "Payment Demand" | "Harassment" | "Misleading Info";
  reportedEntity: string;
  reporterEmail: string;
  reporterName?: string;
  description: string;
  evidenceNotes?: string;
  status: "Under Investigation" | "Verified Malicious" | "Resolved" | "Dismissed";
  createdAt: string;
}

export interface PrivacyRequest {
  id: string;
  requestId: string;
  requesterEmail: string;
  requesterName: string;
  type: "Data Export" | "Consent Withdrawal" | "Data Deletion / Erasure" | "Data Correction";
  status: "Pending Verification" | "Under Review" | "Completed" | "Rejected";
  createdAt: string;
  completedAt?: string;
}

export interface VerifiedRecruiter {
  id: string;
  recruiterId: string; // e.g. "REC-ATS-104"
  name: string;
  officialEmail: string;
  specialization: string;
  verifiedSince: string;
  status: "Active ATSAI Recruiter" | "Inactive";
}

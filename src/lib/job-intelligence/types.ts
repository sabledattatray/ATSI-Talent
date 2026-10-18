export type SourceType = "api" | "feed" | "manual_assist" | "careers_page";
export type AuthBasis = "direct_owner" | "written_permission" | "license" | "published_api_terms" | "manual_reference_only";
export type SourceStatus = "active" | "paused" | "revoked";

export type AuthenticityStatus = "Verified" | "Unverified";
export type PublicationRights = "Authorized" | "Review" | "Blocked";

export interface CompletenessCheck {
  code: string;
  field: string;
  label: string;
  present: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

export interface CompletenessResult {
  score: number; // 0–100%
  isComplete: boolean; // meets threshold for useful publishing
  missingFields: string[];
  warnings: string[];
  checks: CompletenessCheck[];
}

export interface JobSource {
  id: string;
  name: string;
  ownerOrg: string;
  homepage: string;
  domainAllowlist: string[];
  sourceType: SourceType;
  authBasis: AuthBasis;
  evidenceRef: string;
  reviewer: string;
  approvedAt: string;
  renewalDate: string;
  status: SourceStatus;
  autoPublish: boolean;
  rateBudget: number;
  createdAt: string;
  updatedAt: string;
}

export type ImportStage =
  | "queued"
  | "validating"
  | "fetching"
  | "parsing"
  | "normalizing"
  | "deduplicating"
  | "verifying"
  | "draft_ready"
  | "review_required"
  | "published"
  | "duplicate"
  | "failed"
  | "cancelled";

export interface ExtractedJobFacts {
  externalJobId?: string;
  title: string;
  company: string;
  companyCareersUrl?: string;
  department?: string;
  category: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  workMode: "On-site" | "Hybrid" | "Remote" | "Unknown";
  employmentType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Temporary";
  salaryDisclosed: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "YEAR" | "MONTH" | "WEEK" | "DAY" | "HOUR";
  experienceMin?: number;
  experienceMax?: number;
  experienceStated?: string;
  experience?: string;
  education?: string;
  skills: string[];
  descriptionSummary: string;
  summary?: string;
  fullDescriptionHtml?: string;
  responsibilities: string[];
  qualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  applicationInstructions?: string;
  datePosted?: string; // employer's original publication date
  updatedAt?: string; // employer's last updated date
  validThrough?: string; // application deadline
  officialApplyUrl: string;
  sourceUrl: string;
  sourceAttribution: string;
  authBasis?: AuthBasis;
  isIndependentCurated?: boolean;
  legalDisclaimer?: string;
  importedAt?: string;
  lastVerifiedAt?: string;
  rawSourcePayload?: string;
  atsProvider?: "greenhouse" | "lever" | "ashby" | "workday" | "smartrecruiters" | "generic";
}

export interface VerificationCheck {
  code: string;
  label: string;
  passed: boolean;
  score: number;
  weight: number;
  severity: "hard_block" | "warning" | "info";
  message: string;
  evidenceSnippet?: string;
}

export interface VerificationResult {
  score: number;
  isPublishable: boolean;
  // Three independent scores per PRD
  authenticityStatus: AuthenticityStatus;
  completeness: CompletenessResult;
  publicationRights: PublicationRights;
  checks: VerificationCheck[];
  hardBlocks: string[];
  warnings: string[];
}

export interface FieldEvidenceItem {
  id: string;
  itemId: string;
  field: string;
  extractedValue: string;
  sourceSnippet: string;
  extractionMethod: "json_ld" | "meta" | "parser" | "ai_grounded" | "fixture";
  confidence: number;
  createdAt: string;
}

export interface ImportItem {
  id: string;
  batchId: string;
  sourceId: string;
  sourceUrl: string;
  stage: ImportStage;
  jobId?: string;
  externalJobId?: string;
  extractedData?: ExtractedJobFacts;
  verificationScore?: number;
  verificationDetails?: VerificationResult;
  error?: string;
  retryCount: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  initiator: string;
  sourceId?: string;
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  status: "queued" | "processing" | "completed" | "cancelled" | "failed";
  createdAt: string;
  updatedAt: string;
  items?: ImportItem[];
}

export interface DuplicateCandidate {
  id: string;
  candidateItemId: string;
  existingJobId: string;
  existingJobTitle: string;
  existingJobCompany: string;
  existingJobSlug: string;
  similarityScore: number;
  matchReason: "exact_external_id" | "canonical_url" | "title_company_location" | "near_text";
  decision: "pending" | "merged" | "distinct" | "rejected";
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobIntelligenceOverview {
  discoveredCount: number;
  importedCount: number;
  reviewQueueCount: number;
  publishedCount: number;
  duplicatesPreventedCount: number;
  activeSourcesCount: number;
  averageQualityScore: number;
  recentActivity: Array<{
    id: string;
    actor: string;
    action: string;
    targetId: string;
    detail: string;
    createdAt: string;
  }>;
}

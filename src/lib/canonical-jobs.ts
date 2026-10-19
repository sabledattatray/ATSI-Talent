import "server-only";
import { db, transaction, audit } from "@/lib/admin/db";
import { slugify, type ContentRecord } from "@/lib/admin/types";
import { randomUUID, createHash } from "node:crypto";

export interface CanonicalJob {
  id: string;
  slug: string;
  hiringCompanyName: string;
  hiringCompanyNormalized: string;
  requisitionId: string;
  jobTitle: string;
  jobTitleNormalized: string;
  category: string;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  workMode: "On-site" | "Hybrid" | "Remote";
  experienceMin: number;
  experienceMax: number;
  fingerprintHash: string;
  status: "draft" | "published" | "archived" | "merged";
  primaryPostingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerJobPosting {
  id: string;
  canonicalJobId: string;
  contentId: string;
  organizationId: string;
  postingRole: "direct_employer" | "authorized_agency" | "independent_curated";
  authorizationStatus: "verified" | "pending_review" | "rejected" | "revoked";
  mandateReference: string;
  mandateProofMediaId?: string;
  isPrimary: boolean;
  displayAgencyBrand: boolean;
  recruiterNotes: string;
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  organizationCountry?: string;
  organizationWebsite?: string;
  jobTitle?: string;
  hiringCompany?: string;
}

export interface DuplicateAuditRecord {
  id: string;
  incomingJobId: string;
  canonicalJobId: string;
  matchMethod: string;
  confidenceScore: number;
  featuresJson: string;
  status: "auto_linked" | "held_for_review" | "dismissed" | "merged";
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CanonicalJobSummary {
  canonicalJob: CanonicalJob;
  primaryPosting: EmployerJobPosting;
  authorizedPostings: EmployerJobPosting[];
  allPostingsCount: number;
}

/**
 * Normalizes company name by stripping legal entities (Inc, Ltd, Pvt, LLC, etc.)
 * and handling common enterprise abbreviations (e.g. TCS -> Tata Consultancy Services).
 */
export function normalizeCompanyName(company: string): string {
  if (!company) return "";
  let clean = company.toLowerCase().trim();

  // Known enterprise abbreviations
  if (clean === "tcs") clean = "tata consultancy services";
  if (clean === "infy") clean = "infosys";
  if (clean === "cts") clean = "cognizant";

  clean = clean
    .replace(/\b(private|pvt|limited|ltd|inc|incorporated|corp|corporation|llc|llp|gmbh|solutions|technologies|services)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean || company.toLowerCase().trim();
}

/**
 * Normalizes job titles by expanding abbreviations (Sr -> Senior, Dev -> Developer).
 */
export function normalizeJobTitleText(title: string): string {
  if (!title) return "";
  let clean = title.toLowerCase().trim();

  clean = clean
    .replace(/\bsr\.?\b/g, "senior")
    .replace(/\bjr\.?\b/g, "junior")
    .replace(/\bdev\b/g, "developer")
    .replace(/\bengr?\.?\b/g, "engineer")
    .replace(/\bmgr\.?\b/g, "manager")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean || title.toLowerCase().trim();
}

/**
 * Normalizes city/location names.
 */
export function normalizeCityName(location: string): string {
  if (!location) return "";
  const firstPart = location.split(",")[0].trim();
  return firstPart
    .toLowerCase()
    .replace(/\b(bengaluru|bangalore)\b/g, "bengaluru")
    .replace(/\b(mumbai|bombay)\b/g, "mumbai")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes a deterministic fingerprint for canonical vacancy grouping.
 */
export function computeCanonicalFingerprint(
  company: string,
  title: string,
  location: string,
  requisitionId?: string
): string {
  const normCo = normalizeCompanyName(company);
  const normTitle = normalizeJobTitleText(title);
  const normCity = normalizeCityName(location);
  const cleanReq = (requisitionId || "").trim().toUpperCase();

  // If requisition ID is present, it anchors the vacancy
  const baseKey = cleanReq ? `${normCo}::REQ:${cleanReq}` : `${normCo}::TITLE:${normTitle}::CITY:${normCity}`;
  return createHash("sha256").update(baseKey).digest("hex").slice(0, 32);
}

/**
 * Resolves or registers the canonical job representation for a given content record.
 * Guarantees zero disruption to existing records while mapping postings relationally.
 */
export async function syncContentToCanonical(
  record: ContentRecord,
  organizationId?: string,
  postingRole: "direct_employer" | "authorized_agency" | "independent_curated" = "direct_employer"
): Promise<{ canonicalJob: CanonicalJob; posting: EmployerJobPosting; isNewCanonical: boolean }> {
  const normCo = normalizeCompanyName(record.company);
  const normTitle = normalizeJobTitleText(record.title);
  const normCity = normalizeCityName(record.jobCity || record.location);
  const cleanReq = (record.requisitionId || "").trim().toUpperCase();
  const fingerprint = computeCanonicalFingerprint(record.company, record.title, record.jobCity || record.location, cleanReq);

  const now = new Date().toISOString();

  // 1. Look for existing canonical job by requisition ID or fingerprint
  let existingCanonical: CanonicalJob | undefined;

  if (cleanReq) {
    existingCanonical = (await db()
      .prepare("SELECT * FROM canonical_jobs WHERE hiringCompanyNormalized = ? AND requisitionId = ?")
      .get(normCo, cleanReq)) as CanonicalJob | undefined;
  }

  if (!existingCanonical) {
    existingCanonical = (await db()
      .prepare("SELECT * FROM canonical_jobs WHERE fingerprintHash = ?")
      .get(fingerprint)) as CanonicalJob | undefined;
  }

  let canonicalJob: CanonicalJob;
  let isNewCanonical = false;

  if (existingCanonical) {
    canonicalJob = existingCanonical;
  } else {
    // Create new canonical job entry
    isNewCanonical = true;
    const canonicalId = randomUUID();
    const canonicalSlug = `${slugify(record.title) || "vacancy"}-${canonicalId.slice(0, 8)}`;

    canonicalJob = {
      id: canonicalId,
      slug: canonicalSlug,
      hiringCompanyName: record.company,
      hiringCompanyNormalized: normCo,
      requisitionId: cleanReq,
      jobTitle: record.title,
      jobTitleNormalized: normTitle,
      category: record.category || "Technology",
      locationCity: record.jobCity || (record.location ? record.location.split(",")[0].trim() : ""),
      locationRegion: record.jobRegion || "",
      locationCountry: record.jobCountry || "IN",
      workMode: (["On-site", "Hybrid", "Remote"].includes(record.workMode) ? record.workMode : "Hybrid") as CanonicalJob["workMode"],
      experienceMin: record.experienceMin || 0,
      experienceMax: record.experienceMax || 0,
      fingerprintHash: fingerprint,
      status: record.status === "archived" ? "archived" : "published",
      primaryPostingId: null,
      createdAt: now,
      updatedAt: now
    };

    await db().prepare(
      `INSERT INTO canonical_jobs (id, slug, hiringCompanyName, hiringCompanyNormalized, requisitionId, jobTitle, jobTitleNormalized, category, locationCity, locationRegion, locationCountry, workMode, experienceMin, experienceMax, fingerprintHash, status, primaryPostingId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      canonicalJob.id,
      canonicalJob.slug,
      canonicalJob.hiringCompanyName,
      canonicalJob.hiringCompanyNormalized,
      canonicalJob.requisitionId,
      canonicalJob.jobTitle,
      canonicalJob.jobTitleNormalized,
      canonicalJob.category,
      canonicalJob.locationCity,
      canonicalJob.locationRegion,
      canonicalJob.locationCountry,
      canonicalJob.workMode,
      canonicalJob.experienceMin,
      canonicalJob.experienceMax,
      canonicalJob.fingerprintHash,
      canonicalJob.status,
      canonicalJob.primaryPostingId ?? null,
      canonicalJob.createdAt,
      canonicalJob.updatedAt
    );
  }

  // 2. Resolve organization ID (guaranteeing valid Foreign Key in ats_organizations)
  let orgId: string | undefined;
  if (organizationId) {
    const existingOrg = (await db().prepare("SELECT id FROM ats_organizations WHERE id = ?").get(organizationId)) as { id: string } | undefined;
    if (existingOrg) orgId = existingOrg.id;
  }
  if (!orgId) {
    const atsJobRow = (await db().prepare("SELECT organizationId FROM ats_jobs WHERE jobId = ?").get(record.id)) as { organizationId: string } | undefined;
    if (atsJobRow) {
      const existingOrg = (await db().prepare("SELECT id FROM ats_organizations WHERE id = ?").get(atsJobRow.organizationId)) as { id: string } | undefined;
      if (existingOrg) orgId = existingOrg.id;
    }
  }
  if (!orgId) {
    // Check if an organization exists with the hiring company name
    const orgRow = (await db().prepare("SELECT id FROM ats_organizations WHERE LOWER(name) = ?").get(record.company.toLowerCase().trim())) as { id: string } | undefined;
    if (orgRow) {
      orgId = orgRow.id;
    } else {
      // Create a default verified direct organization for this employer
      orgId = randomUUID();
      await db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
        orgId,
        record.company,
        record.jobCountry || "IN",
        record.applicationUrl || "",
        now
      );
    }
  }

  // 3. Upsert employer_job_postings representation
  const existingPosting = (await db()
    .prepare("SELECT * FROM employer_job_postings WHERE contentId = ?")
    .get(record.id)) as EmployerJobPosting | undefined;

  let posting: EmployerJobPosting;
  const isDirect = postingRole === "direct_employer" || record.company.toLowerCase().includes("direct");

  if (existingPosting) {
    posting = {
      ...existingPosting,
      canonicalJobId: canonicalJob.id,
      organizationId: orgId,
      postingRole: isDirect ? "direct_employer" : existingPosting.postingRole,
      isPrimary: isDirect || existingPosting.isPrimary,
      updatedAt: now
    };

    await db().prepare(
      `UPDATE employer_job_postings
       SET canonicalJobId = ?, organizationId = ?, postingRole = ?, isPrimary = ?, updatedAt = ?
       WHERE id = ?`
    ).run(posting.canonicalJobId, posting.organizationId, posting.postingRole, posting.isPrimary ? 1 : 0, now, posting.id);
  } else {
    posting = {
      id: randomUUID(),
      canonicalJobId: canonicalJob.id,
      contentId: record.id,
      organizationId: orgId,
      postingRole,
      authorizationStatus: "verified",
      mandateReference: cleanReq || `MND-${record.id.slice(0, 6).toUpperCase()}`,
      mandateProofMediaId: "",
      isPrimary: isDirect || isNewCanonical,
      displayAgencyBrand: !isDirect,
      recruiterNotes: "",
      createdAt: now,
      updatedAt: now
    };

    await db().prepare(
      `INSERT INTO employer_job_postings (id, canonicalJobId, contentId, organizationId, postingRole, authorizationStatus, mandateReference, mandateProofMediaId, isPrimary, displayAgencyBrand, recruiterNotes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      posting.id,
      posting.canonicalJobId,
      posting.contentId,
      posting.organizationId,
      posting.postingRole,
      posting.authorizationStatus,
      posting.mandateReference,
      posting.mandateProofMediaId ?? null,
      posting.isPrimary ? 1 : 0,
      posting.displayAgencyBrand ? 1 : 0,
      posting.recruiterNotes,
      posting.createdAt,
      posting.updatedAt
    );
  }

  // 4. Update canonical job primary posting pointer if this is primary
  if (posting.isPrimary || !canonicalJob.primaryPostingId) {
    await db().prepare("UPDATE canonical_jobs SET primaryPostingId = ?, updatedAt = ? WHERE id = ?").run(posting.id, now, canonicalJob.id);
    canonicalJob.primaryPostingId = posting.id;
  }

  return { canonicalJob, posting, isNewCanonical };
}

/**
 * Retrieves a canonical job summary with all authorized recruiter postings.
 */
export async function getCanonicalJobSummary(canonicalIdOrSlug: string): Promise<CanonicalJobSummary | null> {
  let canonicalJob = (await db().prepare(
    "SELECT * FROM canonical_jobs WHERE id = ? OR slug = ?"
  ).get(canonicalIdOrSlug, canonicalIdOrSlug)) as CanonicalJob | undefined;

  if (!canonicalJob) {
    canonicalJob = (await db().prepare(
      `SELECT cj.* FROM canonical_jobs cj
       JOIN employer_job_postings p ON p.canonicalJobId = cj.id
       JOIN content c ON c.id = p.contentId
       WHERE c.id = ? OR c.slug = ?`
    ).get(canonicalIdOrSlug, canonicalIdOrSlug)) as CanonicalJob | undefined;
  }

  if (!canonicalJob) return null;

  const postings = (await db().prepare(
    `SELECT p.*, o.name as organizationName, o.country as organizationCountry, o.website as organizationWebsite,
            c.document as jobDoc
     FROM employer_job_postings p
     JOIN ats_organizations o ON o.id = p.organizationId
     JOIN content c ON c.id = p.contentId
     WHERE p.canonicalJobId = ? AND p.authorizationStatus = 'verified' AND c.status = 'published'
     ORDER BY p.isPrimary DESC, p.createdAt ASC`
  ).all(canonicalJob.id)) as (EmployerJobPosting & { jobDoc?: string; isPrimary: number | boolean; displayAgencyBrand: number | boolean })[];

  const normalizedPostings: EmployerJobPosting[] = postings.filter(p => {
    try {
      const doc = JSON.parse(p.jobDoc || "{}");
      const now = Date.now();
      return !doc.isExpired && (!doc.expiresAt || Date.parse(doc.expiresAt) > now)
        && (!doc.publishedAt || Date.parse(doc.publishedAt) <= now);
    } catch {
      return false;
    }
  }).map(p => {
    let docTitle = "";
    let docCompany = "";
    try {
      const parsed = JSON.parse(p.jobDoc || "{}");
      docTitle = parsed.title || "";
      docCompany = parsed.company || "";
    } catch {}
    return {
      ...p,
      jobTitle: docTitle,
      hiringCompany: docCompany,
      isPrimary: Boolean(p.isPrimary),
      displayAgencyBrand: Boolean(p.displayAgencyBrand)
    };
  });

  if (!normalizedPostings.length) return null;

  const primaryPosting = normalizedPostings.find(p => p.isPrimary) || normalizedPostings[0];
  const authorizedPostings = normalizedPostings.filter(p => p.id !== primaryPosting?.id);

  return {
    canonicalJob,
    primaryPosting,
    authorizedPostings,
    allPostingsCount: normalizedPostings.length
  };
}

/**
 * Checks whether a candidate has previously applied for the same underlying vacancy,
 * even if advertised by a different agency or recruiter partner.
 * Strictly preserves multi-tenant privacy: Never leaks candidate notes or stages across agencies.
 */
export async function checkCandidatePriorCanonicalApplication(
  candidateId: string,
  targetJobContentId: string
): Promise<{
  hasPrior: boolean;
  priorAgencyName?: string;
  priorApplicationDate?: string;
  canonicalJobId?: string;
  isSameRecruiter?: boolean;
}> {
  if (!candidateId || !targetJobContentId) return { hasPrior: false };

  // Find target posting and canonical job
  const targetPosting = (await db().prepare(
    "SELECT p.*, o.name as orgName FROM employer_job_postings p JOIN ats_organizations o ON o.id = p.organizationId WHERE p.contentId = ?"
  ).get(targetJobContentId)) as (EmployerJobPosting & { orgName: string }) | undefined;

  if (!targetPosting) {
    // Fallback: check standard candidate_applications by direct jobId
    const existingDirect = (await db().prepare(
      "SELECT id, createdAt, company FROM candidate_applications WHERE candidateId = ? AND jobId = ?"
    ).get(candidateId, targetJobContentId)) as { id: string; createdAt: string; company: string } | undefined;

    if (existingDirect) {
      return {
        hasPrior: true,
        priorAgencyName: existingDirect.company,
        priorApplicationDate: existingDirect.createdAt,
        isSameRecruiter: true
      };
    }
    return { hasPrior: false };
  }

  // Check all applications by this candidate linked to the same canonicalJobId
  const priorApps = (await db().prepare(
    `SELECT a.id, a.createdAt, a.jobId, p.organizationId, o.name as orgName
     FROM candidate_applications a
     LEFT JOIN employer_job_postings p ON p.contentId = a.jobId
     LEFT JOIN ats_organizations o ON o.id = p.organizationId
     WHERE a.candidateId = ? AND (p.canonicalJobId = ? OR a.canonicalJobId = ?)`
  ).all(candidateId, targetPosting.canonicalJobId, targetPosting.canonicalJobId)) as {
    id: string;
    createdAt: string;
    jobId: string;
    organizationId?: string;
    orgName?: string;
  }[];

  if (priorApps.length === 0) {
    return { hasPrior: false, canonicalJobId: targetPosting.canonicalJobId };
  }

  const prior = priorApps[0];
  const isSameRecruiter = prior.organizationId === targetPosting.organizationId || prior.jobId === targetJobContentId;

  return {
    hasPrior: true,
    priorAgencyName: prior.orgName || "another authorized recruiter",
    priorApplicationDate: prior.createdAt,
    canonicalJobId: targetPosting.canonicalJobId,
    isSameRecruiter
  };
}

/**
 * Returns pending duplicate audits for administrator resolution.
 */
export async function getPendingDuplicateAudits(): Promise<DuplicateAuditRecord[]> {
  const rows = (await db().prepare(
    "SELECT * FROM job_duplicate_audits WHERE status = 'held_for_review' ORDER BY createdAt DESC"
  ).all()) as DuplicateAuditRecord[];
  return rows;
}

/**
 * Resolves an administrative duplicate vacancy audit.
 */
export async function resolveDuplicateAudit(
  auditId: string,
  decision: "link_authorized" | "declare_separate" | "dismiss",
  actorEmail: string
): Promise<{ ok: boolean; status: "auto_linked" | "dismissed" }> {
  const auditRow = (await db().prepare("SELECT * FROM job_duplicate_audits WHERE id = ?").get(auditId)) as DuplicateAuditRecord | undefined;
  if (!auditRow) throw new Error("Duplicate audit not found.");

  const now = new Date().toISOString();

  await transaction(async () => {
    if (decision === "link_authorized") {
      await db().prepare(
        "UPDATE employer_job_postings SET canonicalJobId = ?, authorizationStatus = 'verified', updatedAt = ? WHERE contentId = ?"
      ).run(auditRow.canonicalJobId, now, auditRow.incomingJobId);

      await db().prepare(
        "UPDATE job_duplicate_audits SET status = 'auto_linked', resolvedBy = ?, resolvedAt = ? WHERE id = ?"
      ).run(actorEmail, now, auditId);

      await audit(actorEmail, "Duplicate vacancy linked as authorized partner", `${auditRow.incomingJobId} -> ${auditRow.canonicalJobId}`);
    } else if (decision === "declare_separate") {
      // Fetch incoming job to create new independent canonical vacancy
      const incJob = (await db().prepare("SELECT * FROM content WHERE id = ?").get(auditRow.incomingJobId)) as { id: string; document: string } | undefined;
      if (incJob) {
        const record = JSON.parse(incJob.document) as ContentRecord;
        const newCanonicalId = randomUUID();
        const newSlug = `${slugify(record.title) || "vacancy"}-${newCanonicalId.slice(0, 8)}`;
        const normCo = normalizeCompanyName(record.company);
        const normTitle = normalizeJobTitleText(record.title);
        const normCity = normalizeCityName(record.jobCity || record.location);
        const fingerprint = computeCanonicalFingerprint(record.company, record.title, record.jobCity || record.location, record.requisitionId);

        await db().prepare(
          `INSERT INTO canonical_jobs (id, slug, hiringCompanyName, hiringCompanyNormalized, requisitionId, jobTitle, jobTitleNormalized, category, locationCity, locationRegion, locationCountry, workMode, experienceMin, experienceMax, fingerprintHash, status, primaryPostingId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          newCanonicalId,
          newSlug,
          record.company,
          normCo,
          record.requisitionId || "",
          record.title,
          normTitle,
          record.category || "Technology",
          record.jobCity || "",
          record.jobRegion || "",
          record.jobCountry || "IN",
          record.workMode || "Hybrid",
          record.experienceMin || 0,
          record.experienceMax || 0,
          fingerprint,
          "published",
          auditRow.incomingJobId,
          now,
          now
        );

        await db().prepare(
          "UPDATE employer_job_postings SET canonicalJobId = ?, authorizationStatus = 'verified', isPrimary = 1, updatedAt = ? WHERE contentId = ?"
        ).run(newCanonicalId, now, auditRow.incomingJobId);
      }

      await db().prepare(
        "UPDATE job_duplicate_audits SET status = 'dismissed', resolvedBy = ?, resolvedAt = ? WHERE id = ?"
      ).run(actorEmail, now, auditId);

      await audit(actorEmail, "Declared as separate distinct vacancy", `${auditRow.incomingJobId}`);
    } else {
      await db().prepare(
        "UPDATE job_duplicate_audits SET status = 'dismissed', resolvedBy = ?, resolvedAt = ? WHERE id = ?"
      ).run(actorEmail, now, auditId);
    }
  });

  return { ok: true, status: decision === "link_authorized" ? "auto_linked" : "dismissed" };
}

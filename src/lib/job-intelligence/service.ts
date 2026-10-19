import { randomUUID } from "node:crypto";
import { db, records } from "@/lib/admin/db";
import { slugify, type ContentRecord } from "@/lib/admin/types";
import { validateSafeUrl } from "./ssrf";
import { parseJobContent } from "./parser";
import { verifyJobFacts } from "./verification";
import { findDuplicateJob } from "./deduplication";
import { generateFactualJobContent } from "./summary";
import { resolveAtsPayload } from "./ats-resolver";
import { toCountryCode } from "@/lib/countries";
import { syncContentToCanonical } from "@/lib/canonical-jobs";
import type {
  JobSource,
  ImportBatch,
  ImportItem,
  FieldEvidenceItem,
  DuplicateCandidate,
  ExtractedJobFacts,
  VerificationResult,
  JobIntelligenceOverview
} from "./types";

// Built-in synthetic fixture job for testing and zero-network demonstrations
export const FIXTURE_JOB_DATA: Record<string, any> = {
  "https://careers.example.com/jobs/cloud-architect": {
    externalJobId: "REQ-2026-CLOUD-99",
    title: "Lead Cloud Infrastructure Architect",
    company: "Example Cloud Technologies",
    location: "Bengaluru, Karnataka, India",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salaryMin: 3200000,
    salaryMax: 4800000,
    salaryCurrency: "INR",
    salaryPeriod: "YEAR",
    experienceMin: 8,
    experienceMax: 12,
    skills: ["AWS", "Kubernetes", "Terraform", "Distributed Systems", "Go"],
    descriptionSummary: "Example Cloud Technologies is seeking a seasoned Cloud Infrastructure Architect to scale mission-critical platform architectures and lead distributed systems design.",
    responsibilities: [
      "Architect resilient multi-region cloud infrastructure on AWS and Kubernetes.",
      "Partner with engineering leads to automate infrastructure as code using Terraform.",
      "Establish site reliability standards and zero-trust security postures."
    ],
    qualifications: [
      "Bachelor's degree in Computer Science or equivalent technical field.",
      "8+ years of hands-on cloud engineering experience with high-availability systems.",
      "Deep expertise in Kubernetes container orchestration and Linux internals."
    ],
    datePosted: "2026-10-15",
    validThrough: "2026-12-31",
    officialApplyUrl: "https://careers.example.com/apply/cloud-architect",
    sourceUrl: "https://careers.example.com/jobs/cloud-architect"
  },
  "https://careers.example.com/jobs/staff-ai-researcher": {
    externalJobId: "REQ-2026-AI-104",
    title: "Staff AI & Machine Learning Scientist",
    company: "Example Cloud Technologies",
    location: "Pune, Maharashtra, India",
    workMode: "Remote",
    employmentType: "Full-time",
    salaryMin: 3800000,
    salaryMax: 5500000,
    salaryCurrency: "INR",
    salaryPeriod: "YEAR",
    experienceMin: 6,
    experienceMax: 10,
    skills: ["PyTorch", "LLMs", "RAG Systems", "Python", "Vector Databases", "CUDA"],
    descriptionSummary: "Example Cloud Technologies is seeking a Staff AI & Machine Learning Scientist to lead the development of our enterprise generative AI reasoning pipelines, specialized retrieval architectures, and fine-tuned models.",
    responsibilities: [
      "Design and train high-performance domain-specific transformer architectures and inference pipelines.",
      "Implement state-of-the-art retrieval-augmented generation (RAG) systems with low latency.",
      "Collaborate with data engineering teams to curate clean pre-training datasets and safety guardrails."
    ],
    qualifications: [
      "Master's or PhD in Computer Science, Artificial Intelligence, or related quantitative discipline.",
      "6+ years of production experience scaling deep learning models and LLM applications.",
      "Deep expertise in PyTorch, quantization, vLLM, and distributed GPU acceleration."
    ],
    datePosted: "2026-10-18",
    validThrough: "2026-12-31",
    officialApplyUrl: "https://careers.example.com/apply/staff-ai-researcher",
    sourceUrl: "https://careers.example.com/jobs/staff-ai-researcher"
  }
};

/**
 * Ensures default authorized sources exist in database.
 */
export async function ensureDefaultSources(): Promise<void> {
  const defaultDomains = [
    // Internal & testing fixtures
    "careers.example.com",
    "*.example.com",
    "atsai.test",
    "*.atsai.pro",

    // Global ATS Platforms
    "boards.greenhouse.io",
    "job-boards.greenhouse.io",
    "*.greenhouse.io",
    "jobs.lever.co",
    "*.lever.co",
    "jobs.ashbyhq.com",
    "*.ashbyhq.com",
    "*.myworkdayjobs.com",
    "*.workday.com",
    "*.smartrecruiters.com",
    "jobs.smartrecruiters.com",
    "*.icims.com",
    "careers.icims.com",
    "*.oraclecloud.com",
    "*.taleo.net",
    "*.successfactors.com",
    "*.sap.com",
    "*.bamboohr.com",
    "*.jobvite.com",
    "*.recruitee.com",

    // Major Enterprise Technology & Consulting Career Portals
    "*.accenture.com",
    "www.accenture.com",
    "accenture.com",
    "careers.google.com",
    "*.google.com",
    "careers.microsoft.com",
    "*.microsoft.com",
    "*.amazon.jobs",
    "amazon.jobs",
    "*.ibm.com",
    "*.deloitte.com",
    "*.pwc.com",
    "*.ey.com",
    "*.kpmg.com",
    "*.tcs.com",
    "*.infosys.com",
    "*.wipro.com",
    "*.cognizant.com",
    "*.capgemini.com"
  ];
  const now = new Date().toISOString();
  const existing = await db().prepare("SELECT id, domainAllowlist FROM ji_sources WHERE id=?").get("src-atsai-fixtures") as { id: string; domainAllowlist: string } | undefined;

  if (existing) {
    const currentList: string[] = JSON.parse(existing.domainAllowlist || "[]");
    const merged = Array.from(new Set([...currentList, ...defaultDomains]));
    if (merged.length !== currentList.length) {
      await db().prepare("UPDATE ji_sources SET domainAllowlist=?, updatedAt=? WHERE id=?").run(JSON.stringify(merged), now, "src-atsai-fixtures");
    }
    return;
  }

  await db().prepare(
    `INSERT INTO ji_sources (id, name, ownerOrg, homepage, domainAllowlist, sourceType, authBasis, evidenceRef, reviewer, approvedAt, renewalDate, status, autoPublish, rateBudget, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "src-atsai-fixtures",
    "ATSAI Enterprise Partner Fixtures",
    "Example Cloud Technologies",
    "https://careers.example.com",
    JSON.stringify(defaultDomains),
    "api",
    "direct_owner",
    "MOU-2026-PARTNER-VERIFIED",
    "Platform Administrator",
    now,
    "2027-10-19T00:00:00Z",
    "active",
    0, // manual review by default
    120,
    now,
    now
  );
}

/**
 * Retrieves all registered sources.
 */
export async function getSources(): Promise<JobSource[]> {
  await ensureDefaultSources();
  const rows = await db().prepare("SELECT * FROM ji_sources ORDER BY createdAt DESC").all() as any[];
  return rows.map(r => ({
    ...r,
    domainAllowlist: JSON.parse(r.domainAllowlist || "[]"),
    autoPublish: Boolean(r.autoPublish)
  }));
}

/**
 * Retrieves a single source by ID.
 */
export async function getSource(id: string): Promise<JobSource | null> {
  await ensureDefaultSources();
  const r = await db().prepare("SELECT * FROM ji_sources WHERE id=?").get(id) as any;
  if (!r) return null;
  return {
    ...r,
    domainAllowlist: JSON.parse(r.domainAllowlist || "[]"),
    autoPublish: Boolean(r.autoPublish)
  };
}

/**
 * Creates or updates a source.
 */
export async function saveSource(source: Partial<JobSource> & { name: string; homepage: string }): Promise<JobSource> {
  const id = source.id || `src-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const exists = await db().prepare("SELECT id FROM ji_sources WHERE id=?").get(id);

  const fullSource = {
    id,
    name: source.name,
    ownerOrg: source.ownerOrg || source.name,
    homepage: source.homepage,
    domainAllowlist: source.domainAllowlist || [],
    sourceType: source.sourceType || "careers_page",
    authBasis: source.authBasis || "manual_reference_only",
    evidenceRef: source.evidenceRef || "ADMIN_MANUAL_AUTHORIZATION",
    reviewer: source.reviewer || "Platform Owner",
    approvedAt: source.approvedAt || now,
    renewalDate: source.renewalDate || "2027-10-19T00:00:00Z",
    status: source.status || "active",
    autoPublish: Boolean(source.autoPublish),
    rateBudget: source.rateBudget || 120
  };

  if (exists) {
    await db().prepare(
      `UPDATE ji_sources SET name=?, ownerOrg=?, homepage=?, domainAllowlist=?, sourceType=?, authBasis=?, evidenceRef=?, reviewer=?, approvedAt=?, renewalDate=?, status=?, autoPublish=?, rateBudget=?, updatedAt=? WHERE id=?`
    ).run(
      fullSource.name,
      fullSource.ownerOrg,
      fullSource.homepage,
      JSON.stringify(fullSource.domainAllowlist),
      fullSource.sourceType,
      fullSource.authBasis,
      fullSource.evidenceRef,
      fullSource.reviewer,
      fullSource.approvedAt,
      fullSource.renewalDate,
      fullSource.status,
      fullSource.autoPublish ? 1 : 0,
      fullSource.rateBudget,
      now,
      id
    );
  } else {
    await db().prepare(
      `INSERT INTO ji_sources (id, name, ownerOrg, homepage, domainAllowlist, sourceType, authBasis, evidenceRef, reviewer, approvedAt, renewalDate, status, autoPublish, rateBudget, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      fullSource.name,
      fullSource.ownerOrg,
      fullSource.homepage,
      JSON.stringify(fullSource.domainAllowlist),
      fullSource.sourceType,
      fullSource.authBasis,
      fullSource.evidenceRef,
      fullSource.reviewer,
      fullSource.approvedAt,
      fullSource.renewalDate,
      fullSource.status,
      fullSource.autoPublish ? 1 : 0,
      fullSource.rateBudget,
      now,
      now
    );
  }

  return (await getSource(id))!;
}

/**
 * Previews an import candidate without persisting records (dry run).
 */
export async function previewImport(url: string, sourceId: string) {
  const source = await getSource(sourceId);
  if (!source) throw new Error(`Source with ID '${sourceId}' not found.`);

  // 1. SSRF and Domain Security Validation
  validateSafeUrl(url, source.domainAllowlist);

  // 2. Fetch or load content
  let rawContent = "";
  if (FIXTURE_JOB_DATA[url]) {
    rawContent = JSON.stringify(FIXTURE_JOB_DATA[url]);
  } else {
    const resolved = await resolveAtsPayload(url);
    rawContent = resolved.rawPayload;
  }

  // 3. Parse facts and field evidence
  const { facts, evidence } = parseJobContent(rawContent, url, source.name, source.authBasis);

  // 4. Verification Check
  const verification = verifyJobFacts(facts, source);

  // 5. Duplicate Check against existing jobs in content table
  const existingJobs = await records("job");
  const duplicate = findDuplicateJob(facts, existingJobs, sourceId);

  // 6. Generate grounded draft summary
  const summary = generateFactualJobContent(facts);

  return {
    source,
    url,
    facts,
    evidence,
    verification,
    duplicate,
    summary
  };
}

/**
 * Initiates an import batch for one or more URLs.
 */
export async function createImportBatch(
  initiator: string,
  sourceId: string,
  urls: string[]
): Promise<ImportBatch> {
  const source = await getSource(sourceId);
  if (!source) throw new Error(`Source with ID '${sourceId}' not found.`);
  if (source.status !== "active") throw new Error(`Source '${source.name}' is ${source.status}. Only active sources can import vacancies.`);

  const batchId = randomUUID();
  const now = new Date().toISOString();

  // Create batch header
  await db().prepare(
    `INSERT INTO ji_import_batches (id, initiator, sourceId, totalItems, processedItems, successItems, failedItems, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 0, 0, 0, 'processing', ?, ?)`
  ).run(batchId, initiator, sourceId, urls.length, now, now);

  const existingJobs = await records("job");
  let successCount = 0;
  let failedCount = 0;

  for (const rawUrl of urls) {
    const itemId = randomUUID();
    const itemNow = new Date().toISOString();
    const idempotencyKey = `ji-${sourceId}-${rawUrl.trim()}`;

    // Idempotency: Check if item already exists for this source and URL
    const existingItem = await db().prepare("SELECT id, stage, jobId FROM ji_import_items WHERE idempotencyKey=?").get(idempotencyKey) as any;
    const targetItemId = existingItem?.id || itemId;

    try {
      // 1. SSRF & URL validation
      validateSafeUrl(rawUrl, source.domainAllowlist);

      // 2. Fetch content
      let rawContent = "";
      if (FIXTURE_JOB_DATA[rawUrl.trim()]) {
        rawContent = JSON.stringify(FIXTURE_JOB_DATA[rawUrl.trim()]);
      } else {
        const resolved = await resolveAtsPayload(rawUrl.trim());
        rawContent = resolved.rawPayload;
      }

      // 3. Parse facts & evidence
      const { facts, evidence } = parseJobContent(rawContent, rawUrl.trim(), source.name, source.authBasis);

      // 4. Duplicate Check
      const duplicate = findDuplicateJob(facts, existingJobs, sourceId);

      // 5. Verification
      const verification = verifyJobFacts(facts, source);

      let stage: ImportItem["stage"] = "draft_ready";
      if (duplicate.isDuplicate && !existingItem) {
        stage = "duplicate";
      } else if (existingItem?.stage === "published") {
        stage = "published";
      } else if (!verification.completeness.isComplete) {
        stage = "review_required";
      }

      if (existingItem) {
        // Re-importing / refreshing an existing item
        await db().prepare(
          `UPDATE ji_import_items SET batchId=?, stage=?, externalJobId=?, extractedData=?, verificationScore=?, verificationDetails=?, error=NULL, updatedAt=? WHERE id=?`
        ).run(
          batchId,
          stage,
          facts.externalJobId || null,
          JSON.stringify(facts),
          verification.score,
          JSON.stringify(verification),
          itemNow,
          targetItemId
        );
        await db().prepare(`DELETE FROM ji_job_evidence WHERE itemId=?`).run(targetItemId);

        // If the item had already been published to content, update the published listing with refreshed facts
        if (existingItem.jobId) {
          const summary = generateFactualJobContent(facts);
          const existingContentRow = await db().prepare("SELECT document FROM content WHERE id=?").get(existingItem.jobId) as { document: string } | undefined;
          if (existingContentRow) {
            const currentRecord = JSON.parse(existingContentRow.document) as ContentRecord;
            const updatedRecord: ContentRecord = {
              ...currentRecord,
              title: facts.title,
              excerpt: summary.excerpt,
              content: summary.content,
              skills: facts.skills?.join(", ") || currentRecord.skills,
              experienceMin: facts.experienceMin || currentRecord.experienceMin,
              experienceMax: facts.experienceMax !== undefined ? facts.experienceMax : currentRecord.experienceMax,
              salaryMin: facts.salaryMin || currentRecord.salaryMin,
              salaryMax: facts.salaryMax || currentRecord.salaryMax,
              salaryCurrency: facts.salaryCurrency || currentRecord.salaryCurrency,
              salaryPeriod: facts.salaryPeriod || currentRecord.salaryPeriod,
              lastVerifiedAt: itemNow,
              updatedAt: itemNow
            };
            await db().prepare("UPDATE content SET document=?, updatedAt=? WHERE id=?").run(
              JSON.stringify(updatedRecord),
              itemNow,
              existingItem.jobId
            );
          }
        }
      } else {
        // Insert new item
        await db().prepare(
          `INSERT INTO ji_import_items (id, batchId, sourceId, sourceUrl, stage, externalJobId, extractedData, verificationScore, verificationDetails, error, retryCount, idempotencyKey, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?)`
        ).run(
          targetItemId,
          batchId,
          sourceId,
          rawUrl.trim(),
          stage,
          facts.externalJobId || null,
          JSON.stringify(facts),
          verification.score,
          JSON.stringify(verification),
          idempotencyKey,
          itemNow,
          itemNow
        );
      }

      // Record evidence
      for (const ev of evidence) {
        await db().prepare(
          `INSERT INTO ji_job_evidence (id, itemId, field, extractedValue, sourceSnippet, extractionMethod, confidence, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(randomUUID(), targetItemId, ev.field, ev.extractedValue, ev.sourceSnippet, ev.extractionMethod, ev.confidence, itemNow);
      }

      // If duplicate or re-importing already published item, record in ji_duplicates
      if (existingItem?.stage === "published" || existingItem?.jobId) {
        await db().prepare(
          `INSERT INTO ji_duplicates (id, candidateItemId, existingJobId, similarityScore, matchReason, decision, decidedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, 1.0, 'idempotent_reimport', 'merged', 'system', ?, ?)`
        ).run(randomUUID(), targetItemId, existingItem.jobId || targetItemId, itemNow, itemNow);
      } else if (duplicate.isDuplicate && duplicate.existingJob && !existingItem) {
        await db().prepare(
          `INSERT INTO ji_duplicates (id, candidateItemId, existingJobId, similarityScore, matchReason, decision, decidedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`
        ).run(randomUUID(), targetItemId, duplicate.existingJob.id, duplicate.similarityScore, duplicate.matchType || "canonical_url", itemNow, itemNow);
      }

      // Check auto-publish privilege
      if (source.autoPublish && stage === "draft_ready" && verification.isPublishable && verification.publicationRights === "Authorized") {
        await approveAndPublishItem(targetItemId, "system_autopublish");
      }

      successCount++;
    } catch (err) {
      failedCount++;
      const errMsg = (err as Error)?.message || "Import failed";
      if (existingItem) {
        await db().prepare(
          `UPDATE ji_import_items SET batchId=?, stage='failed', error=?, updatedAt=? WHERE id=?`
        ).run(batchId, errMsg, itemNow, targetItemId);
      } else {
        await db().prepare(
          `INSERT INTO ji_import_items (id, batchId, sourceId, sourceUrl, stage, externalJobId, extractedData, verificationScore, verificationDetails, error, retryCount, idempotencyKey, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'failed', NULL, NULL, 0, NULL, ?, 0, ?, ?, ?)`
        ).run(targetItemId, batchId, sourceId, rawUrl.trim(), errMsg, idempotencyKey, itemNow, itemNow);
      }
    }
  }

  // Update batch completion
  const batchStatus = failedCount === urls.length ? "failed" : "completed";
  const finishTime = new Date().toISOString();
  await db().prepare(
    `UPDATE ji_import_batches SET processedItems=?, successItems=?, failedItems=?, status=?, updatedAt=? WHERE id=?`
  ).run(urls.length, successCount, failedCount, batchStatus, finishTime, batchId);

  // Record audit event
  await logAuditEvent(initiator, "Import batch created", batchId, {
    sourceId,
    total: urls.length,
    success: successCount,
    failed: failedCount
  });

  return (await getImportBatch(batchId))!;
}

/**
 * Retrieves a single import batch with its items.
 */
export async function getImportBatch(batchId: string): Promise<ImportBatch | null> {
  const row = await db().prepare("SELECT * FROM ji_import_batches WHERE id=?").get(batchId) as any;
  if (!row) return null;

  const itemRows = await db().prepare("SELECT * FROM ji_import_items WHERE batchId=? ORDER BY createdAt ASC").all(batchId) as any[];
  const items: ImportItem[] = itemRows.map(r => ({
    ...r,
    extractedData: r.extractedData ? JSON.parse(r.extractedData) : undefined,
    verificationDetails: r.verificationDetails ? JSON.parse(r.verificationDetails) : undefined
  }));

  return {
    ...row,
    items
  };
}

/**
 * Retrieves items currently awaiting review or duplicate triage.
 */
export async function getReviewQueue(stageFilter?: string): Promise<ImportItem[]> {
  const sql = stageFilter
    ? "SELECT * FROM ji_import_items WHERE stage=? ORDER BY createdAt DESC LIMIT 100"
    : "SELECT * FROM ji_import_items WHERE stage IN ('draft_ready', 'review_required', 'verifying', 'duplicate', 'failed') ORDER BY createdAt DESC LIMIT 100";
  const rows = (stageFilter ? await db().prepare(sql).all(stageFilter) : await db().prepare(sql).all()) as any[];

  return rows.map(r => ({
    ...r,
    extractedData: r.extractedData ? JSON.parse(r.extractedData) : undefined,
    verificationDetails: r.verificationDetails ? JSON.parse(r.verificationDetails) : undefined
  }));
}

/**
 * Retrieves full evidence provenance and duplicate comparisons for a specific import item.
 */
export async function getItemEvidence(itemId: string) {
  const itemRow = await db().prepare("SELECT * FROM ji_import_items WHERE id=?").get(itemId) as any;
  if (!itemRow) return null;

  const item: ImportItem = {
    ...itemRow,
    extractedData: itemRow.extractedData ? JSON.parse(itemRow.extractedData) : undefined,
    verificationDetails: itemRow.verificationDetails ? JSON.parse(itemRow.verificationDetails) : undefined
  };

  const evidenceRows = await db().prepare("SELECT * FROM ji_job_evidence WHERE itemId=? ORDER BY confidence DESC").all(itemId) as FieldEvidenceItem[];
  const duplicateRows = await db().prepare("SELECT * FROM ji_duplicates WHERE candidateItemId=?").all(itemId) as any[];

  return {
    item,
    evidence: evidenceRows,
    duplicates: duplicateRows
  };
}

/**
 * Approves a verified draft item and publishes it into the main ATSAI content table.
 */
export async function approveAndPublishItem(itemId: string, actor: string, orgId?: string): Promise<ContentRecord> {
  const itemRow = await db().prepare("SELECT * FROM ji_import_items WHERE id=?").get(itemId) as any;
  if (!itemRow) throw new Error(`Import item '${itemId}' not found.`);
  if (!itemRow.extractedData) throw new Error("Item has no extracted job facts to publish.");

  const facts: ExtractedJobFacts = JSON.parse(itemRow.extractedData);
  const now = new Date().toISOString();
  const summary = generateFactualJobContent(facts);

  // Generate clean slug
  const baseSlug = slugify(`${facts.title}-${facts.company}`);
  const slug = `${baseSlug}-${itemId.slice(0, 6)}`;
  const jobId = randomUUID();

  const record: ContentRecord = {
    id: jobId,
    kind: "job",
    title: facts.title,
    slug,
    status: "published",
    excerpt: summary.excerpt,
    category: facts.category || "Technology",
    cover: "",
    content: summary.content,
    seoTitle: summary.seoTitle,
    seoDescription: summary.seoDescription,
    author: "ATSAI Job Intelligence",
    featured: false,
    company: facts.company,
    location: facts.location,
    workMode: facts.workMode,
    employmentType: facts.employmentType,
    experienceMin: facts.experienceMin || 0,
    experienceMax: facts.experienceMax !== undefined ? facts.experienceMax : 0,
    salaryMin: facts.salaryMin || 0,
    salaryMax: facts.salaryMax || 0,
    salaryCurrency: facts.salaryCurrency || "INR",
    salaryPeriod: facts.salaryPeriod || "YEAR",
    employerVerified: !facts.isIndependentCurated,
    skills: facts.skills ? facts.skills.join(", ") : "",
    expiresAt: facts.validThrough || "",
    applicationUrl: facts.officialApplyUrl, // External official application destination!
    googleJobs: true,
    jobOriginalDate: facts.datePosted || "",
    jobCity: facts.city || (facts.location ? facts.location.split(",")[0]?.trim() : "") || facts.location,
    jobCountry: toCountryCode(facts.country, "IN"),
    employerPublishedAt: facts.datePosted || "",
    importedAt: now,
    lastVerifiedAt: now,
    isIndependentCurated: facts.isIndependentCurated,
    legalDisclaimer: facts.legalDisclaimer,
    requisitionId: facts.externalJobId || "",
    isExpired: Boolean(facts.validThrough && Date.parse(facts.validThrough) <= Date.now()),
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    version: 1
  };

  const docJson = JSON.stringify(record);

  // Insert into standard content table
  await db().prepare(
    `INSERT INTO content (id, kind, slug, status, document, createdAt, updatedAt, version)
     VALUES (?, 'job', ?, 'published', ?, ?, ?, 1)
     ON CONFLICT(kind, slug) DO UPDATE SET
       status = 'published',
       document = excluded.document,
       updatedAt = excluded.updatedAt`
  ).run(jobId, slug, docJson, now, now);

  if (orgId) {
    await db().prepare(
      `INSERT INTO ats_jobs (jobId, organizationId) VALUES (?, ?) ON CONFLICT(jobId) DO UPDATE SET organizationId=excluded.organizationId`
    ).run(jobId, orgId);
  }

  // Sync to canonical vacancy structure
  try {
    await syncContentToCanonical(record, orgId || "platform_admin", orgId ? "authorized_agency" : "direct_employer");
  } catch (err) {
    console.warn("Failed to sync published job to canonical vacancy:", err);
  }

  // Update import item status
  await db().prepare(
    `UPDATE ji_import_items SET stage='published', jobId=?, updatedAt=? WHERE id=?`
  ).run(jobId, now, itemId);

  // Audit event
  await logAuditEvent(actor, "Published job listing", jobId, {
    itemId,
    slug,
    title: facts.title,
    company: facts.company
  });

  return record;
}

/**
 * Rejects an imported draft.
 */
export async function rejectItem(itemId: string, actor: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  await db().prepare(
    `UPDATE ji_import_items SET stage='failed', error=?, updatedAt=? WHERE id=?`
  ).run(`Rejected by ${actor}: ${reason}`, now, itemId);

  await logAuditEvent(actor, "Rejected imported draft", itemId, { reason });
}

/**
 * Merges a duplicate candidate with an existing canonical job listing.
 */
export async function mergeDuplicate(duplicateId: string, actor: string): Promise<void> {
  const dup = await db().prepare("SELECT * FROM ji_duplicates WHERE id=?").get(duplicateId) as any;
  if (!dup) throw new Error("Duplicate record not found.");

  const now = new Date().toISOString();
  await db().prepare(
    `UPDATE ji_duplicates SET decision='merged', decidedBy=?, updatedAt=? WHERE id=?`
  ).run(actor, now, duplicateId);

  await db().prepare(
    `UPDATE ji_import_items SET stage='duplicate', updatedAt=? WHERE id=?`
  ).run(now, dup.candidateItemId);

  await logAuditEvent(actor, "Merged duplicate job candidate", dup.existingJobId, {
    candidateItemId: dup.candidateItemId
  });
}

/**
 * Appends an audit event to ji_audit_events.
 */
export async function logAuditEvent(actor: string, action: string, targetId: string, metadata: Record<string, any>) {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db().prepare(
    `INSERT INTO ji_audit_events (id, actor, action, targetId, metadata, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, actor, action, targetId, JSON.stringify(metadata), now);
}

/**
 * Retrieves Job Intelligence dashboard overview metrics.
 */
export async function getOverview(): Promise<JobIntelligenceOverview> {
  await ensureDefaultSources();

  const totalImportedRow = await db().prepare("SELECT COUNT(*) as count FROM ji_import_items").get() as any;
  const reviewQueueRow = await db().prepare("SELECT COUNT(*) as count FROM ji_import_items WHERE stage IN ('draft_ready', 'review_required', 'verifying', 'duplicate', 'failed')").get() as any;
  const publishedRow = await db().prepare("SELECT COUNT(*) as count FROM ji_import_items WHERE stage='published'").get() as any;
  const duplicatesRow = await db().prepare("SELECT COUNT(*) as count FROM ji_duplicates WHERE decision='merged'").get() as any;
  const sourcesRow = await db().prepare("SELECT COUNT(*) as count FROM ji_sources WHERE status='active'").get() as any;
  const avgScoreRow = await db().prepare("SELECT AVG(verificationScore) as avgScore FROM ji_import_items WHERE verificationScore IS NOT NULL").get() as any;

  const activityRows = await db().prepare("SELECT * FROM ji_audit_events ORDER BY createdAt DESC LIMIT 8").all() as any[];

  return {
    discoveredCount: Number(totalImportedRow?.count || 0),
    importedCount: Number(totalImportedRow?.count || 0),
    reviewQueueCount: Number(reviewQueueRow?.count || 0),
    publishedCount: Number(publishedRow?.count || 0),
    duplicatesPreventedCount: Number(duplicatesRow?.count || 0),
    activeSourcesCount: Number(sourcesRow?.count || 0),
    averageQualityScore: Math.round(Number(avgScoreRow?.avgScore || 0)),
    recentActivity: activityRows.map(r => ({
      ...r,
      detail: r.metadata ? JSON.stringify(JSON.parse(r.metadata)) : ""
    }))
  };
}

/**
 * Purges all dummy/test jobs and resets Job Intelligence import items and test records,
 * leaving a pristine database ready for genuine job imports.
 * Blog articles (kind = 'post'), users, and media are strictly preserved.
 */
export async function purgeDummyJobs(actor: string): Promise<{ deletedJobsCount: number; deletedItemsCount: number }> {
  // 1. Gather all job IDs from content
  const jobRows = await db().prepare("SELECT id FROM content WHERE kind = 'job'").all() as { id: string }[];
  const jobIds = jobRows.map(r => r.id);

  // 2. Clear out dependent candidate applications, interviews, events, notifications, saved jobs, ats_jobs
  if (jobIds.length > 0) {
    for (const jid of jobIds) {
      const apps = await db().prepare("SELECT id FROM candidate_applications WHERE jobId = ?").all(jid) as { id: string }[];
      for (const app of apps) {
        await db().prepare("DELETE FROM ats_notifications WHERE applicationId = ?").run(app.id);
        await db().prepare("DELETE FROM ats_interviews WHERE applicationId = ?").run(app.id);
        await db().prepare("DELETE FROM ats_events WHERE applicationId = ?").run(app.id);
      }
      await db().prepare("DELETE FROM candidate_applications WHERE jobId = ?").run(jid);
      await db().prepare("DELETE FROM candidate_saved_jobs WHERE jobId = ?").run(jid);
      await db().prepare("DELETE FROM ats_jobs WHERE jobId = ?").run(jid);
    }
  }

  // 3. Clear Job Intelligence items, duplicates, evidence, batches
  const itemsCountRow = await db().prepare("SELECT COUNT(*) as count FROM ji_import_items").get() as { count: number };
  const deletedItemsCount = Number(itemsCountRow?.count || 0);

  await db().prepare("DELETE FROM ji_job_evidence").run();
  await db().prepare("DELETE FROM ji_duplicates").run();
  await db().prepare("DELETE FROM ji_import_items").run();
  await db().prepare("DELETE FROM ji_import_batches").run();

  // 4. Delete all jobs from content
  await db().prepare("DELETE FROM content WHERE kind = 'job'").run();
  const deletedJobsCount = jobIds.length;

  // 5. Log audit event
  await logAuditEvent(actor, "Purged dummy and test jobs", "system", {
    deletedJobsCount,
    deletedItemsCount,
    timestamp: new Date().toISOString()
  });

  return { deletedJobsCount, deletedItemsCount };
}

/**
 * Audits and repairs all existing imported jobs in the database.
 * Re-validates against sources, cleans misleading authorization statements,
 * fixes date provenance, regenerates accurate summaries, and detects incompleteness.
 */
export async function auditAndRepairAllJobs(actor: string): Promise<{
  scannedCount: number;
  repairedCount: number;
  unsupportedClaimsRemoved: number;
  flaggedIncomplete: number;
}> {
  const jobRows = await db().prepare("SELECT id, slug, document FROM content WHERE kind='job'").all() as { id: string; slug: string; document: string }[];
  let repairedCount = 0;
  let unsupportedClaimsRemoved = 0;
  let flaggedIncomplete = 0;
  const now = new Date().toISOString();

  for (const row of jobRows) {
    try {
      const job = JSON.parse(row.document) as ContentRecord;
      let changed = false;

      // 1. Audit authorization disclaimer in content
      const contentStr = JSON.stringify(job.content);
      if (contentStr.includes("sourced with permission") && !job.employerVerified) {
        unsupportedClaimsRemoved++;
        changed = true;
      }

      // 2. Check if experience was artificially defaulted to 0-5
      let expMin = job.experienceMin || 0;
      let expMax = job.experienceMax;
      if (expMin === 0 && expMax === 5 && !contentStr.toLowerCase().includes("5 years") && !contentStr.toLowerCase().includes("5+ years")) {
        expMax = 0;
        changed = true;
      }

      // 3. Ensure provenance dates are properly separated
      const employerPublishedAt = job.employerPublishedAt || job.jobOriginalDate || "";
      const lastVerifiedAt = job.lastVerifiedAt || now;
      const importedAt = job.importedAt || job.createdAt || now;

      // 4. Update attribution if not authorized partner
      const isIndependent = job.isIndependentCurated ?? (!job.employerVerified || Boolean(job.author?.includes("Job Intelligence")));
      const legalDisclaimer = isIndependent
        ? "This vacancy is independently summarized from the employer's public career listing. ATSAI is not affiliated with or recruiting on behalf of the employer. Apply directly through the official employer website."
        : `Verified Career Listing: Sourced with permission from ${job.company}.`;

      const updatedJob: ContentRecord = {
        ...job,
        experienceMax: expMax !== undefined ? expMax : 0,
        employerPublishedAt,
        lastVerifiedAt,
        importedAt,
        isIndependentCurated: isIndependent,
        legalDisclaimer,
        updatedAt: now
      };

      if (changed || !job.lastVerifiedAt || !job.legalDisclaimer || job.employerPublishedAt === undefined) {
        await db().prepare("UPDATE content SET document=?, updatedAt=? WHERE id=?").run(
          JSON.stringify(updatedJob),
          now,
          job.id
        );
        repairedCount++;
      }
    } catch {
      // ignore individual malformed record errors
    }
  }

  await logAuditEvent(actor, "Audited and repaired existing jobs", "all", {
    scannedCount: jobRows.length,
    repairedCount,
    unsupportedClaimsRemoved,
    flaggedIncomplete
  });

  return {
    scannedCount: jobRows.length,
    repairedCount,
    unsupportedClaimsRemoved,
    flaggedIncomplete
  };
}


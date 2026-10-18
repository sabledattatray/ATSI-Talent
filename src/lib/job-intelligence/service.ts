import { randomUUID } from "node:crypto";
import { db, records } from "@/lib/admin/db";
import { slugify, type ContentRecord } from "@/lib/admin/types";
import { validateSafeUrl } from "./ssrf";
import { parseJobContent } from "./parser";
import { verifyJobFacts } from "./verification";
import { findDuplicateJob } from "./deduplication";
import { generateFactualJobContent } from "./summary";
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
    "careers.example.com",
    "*.example.com",
    "atsai.test",
    "boards.greenhouse.io",
    "job-boards.greenhouse.io",
    "*.greenhouse.io",
    "jobs.lever.co",
    "*.lever.co",
    "jobs.ashbyhq.com",
    "*.ashbyhq.com",
    "careers.google.com"
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
export async function saveSource(source: Omit<JobSource, "createdAt" | "updatedAt">): Promise<JobSource> {
  const now = new Date().toISOString();
  const exists = await db().prepare("SELECT id FROM ji_sources WHERE id=?").get(source.id);

  if (exists) {
    await db().prepare(
      `UPDATE ji_sources SET name=?, ownerOrg=?, homepage=?, domainAllowlist=?, sourceType=?, authBasis=?, evidenceRef=?, reviewer=?, approvedAt=?, renewalDate=?, status=?, autoPublish=?, rateBudget=?, updatedAt=? WHERE id=?`
    ).run(
      source.name,
      source.ownerOrg,
      source.homepage,
      JSON.stringify(source.domainAllowlist),
      source.sourceType,
      source.authBasis,
      source.evidenceRef,
      source.reviewer,
      source.approvedAt,
      source.renewalDate,
      source.status,
      source.autoPublish ? 1 : 0,
      source.rateBudget,
      now,
      source.id
    );
  } else {
    await db().prepare(
      `INSERT INTO ji_sources (id, name, ownerOrg, homepage, domainAllowlist, sourceType, authBasis, evidenceRef, reviewer, approvedAt, renewalDate, status, autoPublish, rateBudget, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      source.id,
      source.name,
      source.ownerOrg,
      source.homepage,
      JSON.stringify(source.domainAllowlist),
      source.sourceType,
      source.authBasis,
      source.evidenceRef,
      source.reviewer,
      source.approvedAt,
      source.renewalDate,
      source.status,
      source.autoPublish ? 1 : 0,
      source.rateBudget,
      now,
      now
    );
  }

  return (await getSource(source.id))!;
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
    const res = await fetch(url, { headers: { "User-Agent": "ATSAI-Job-Intelligence/1.0 (+https://www.atsai.pro/about)" }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Source server returned HTTP ${res.status}: ${res.statusText}`);
    rawContent = await res.text();
  }

  // 3. Parse facts and field evidence
  const { facts, evidence } = parseJobContent(rawContent, url, source.name);

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
    if (existingItem) {
      if (existingItem.jobId || existingItem.stage === "published") {
        const dupId = randomUUID();
        await db().prepare(
          `INSERT INTO ji_duplicates (id, candidateItemId, existingJobId, similarityScore, matchReason, decision, decidedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, 1.0, 'idempotent_reimport', 'merged', 'system', ?, ?)`
        ).run(dupId, existingItem.id, existingItem.jobId || existingItem.id, itemNow, itemNow);
      }
      const newStage = existingItem.stage === "published" ? "published" : "duplicate";
      await db().prepare(
        `UPDATE ji_import_items SET batchId=?, stage=?, updatedAt=? WHERE id=?`
      ).run(batchId, newStage, itemNow, existingItem.id);
      successCount++;
      continue;
    }

    try {
      // 1. SSRF & URL validation
      validateSafeUrl(rawUrl, source.domainAllowlist);

      // 2. Fetch content
      let rawContent = "";
      if (FIXTURE_JOB_DATA[rawUrl.trim()]) {
        rawContent = JSON.stringify(FIXTURE_JOB_DATA[rawUrl.trim()]);
      } else {
        const res = await fetch(rawUrl.trim(), { headers: { "User-Agent": "ATSAI-Job-Intelligence/1.0 (+https://www.atsai.pro/about)" }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Source server returned HTTP ${res.status}: ${res.statusText}`);
        rawContent = await res.text();
      }

      // 3. Parse facts & evidence
      const { facts, evidence } = parseJobContent(rawContent, rawUrl.trim(), source.name);

      // 4. Duplicate Check
      const duplicate = findDuplicateJob(facts, existingJobs, sourceId);

      // 5. Verification
      const verification = verifyJobFacts(facts, source);

      const stage = duplicate.isDuplicate ? "duplicate" : "draft_ready";

      // Insert item
      await db().prepare(
        `INSERT INTO ji_import_items (id, batchId, sourceId, sourceUrl, stage, externalJobId, extractedData, verificationScore, verificationDetails, error, retryCount, idempotencyKey, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?)`
      ).run(
        itemId,
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

      // Record evidence
      for (const ev of evidence) {
        await db().prepare(
          `INSERT INTO ji_job_evidence (id, itemId, field, extractedValue, sourceSnippet, extractionMethod, confidence, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(randomUUID(), itemId, ev.field, ev.extractedValue, ev.sourceSnippet, ev.extractionMethod, ev.confidence, itemNow);
      }

      // If duplicate, record in ji_duplicates
      if (duplicate.isDuplicate && duplicate.existingJob) {
        await db().prepare(
          `INSERT INTO ji_duplicates (id, candidateItemId, existingJobId, similarityScore, matchReason, decision, decidedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`
        ).run(randomUUID(), itemId, duplicate.existingJob.id, duplicate.similarityScore, duplicate.matchType || "canonical_url", itemNow, itemNow);
      }

      // Check auto-publish privilege
      if (source.autoPublish && stage === "draft_ready" && verification.isPublishable) {
        await approveAndPublishItem(itemId, "system_autopublish");
      }

      successCount++;
    } catch (err) {
      failedCount++;
      const errMsg = (err as Error)?.message || "Import failed";
      await db().prepare(
        `INSERT INTO ji_import_items (id, batchId, sourceId, sourceUrl, stage, externalJobId, extractedData, verificationScore, verificationDetails, error, retryCount, idempotencyKey, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'failed', NULL, NULL, 0, NULL, ?, 0, ?, ?, ?)`
      ).run(itemId, batchId, sourceId, rawUrl.trim(), errMsg, idempotencyKey, itemNow, itemNow);
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
    : "SELECT * FROM ji_import_items WHERE stage IN ('draft_ready', 'verifying', 'duplicate') ORDER BY createdAt DESC LIMIT 100";
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
export async function approveAndPublishItem(itemId: string, actor: string): Promise<ContentRecord> {
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
    experienceMax: facts.experienceMax || 5,
    salaryMin: facts.salaryMin || 0,
    salaryMax: facts.salaryMax || 0,
    salaryCurrency: facts.salaryCurrency || "INR",
    salaryPeriod: facts.salaryPeriod || "YEAR",
    employerVerified: true,
    skills: facts.skills ? facts.skills.join(", ") : "",
    expiresAt: facts.validThrough || "",
    applicationUrl: facts.officialApplyUrl, // External official application destination!
    googleJobs: true,
    jobOriginalDate: facts.datePosted || now.slice(0, 10),
    jobCity: facts.location.split(",")[0]?.trim() || facts.location,
    jobCountry: "India",
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
  const reviewQueueRow = await db().prepare("SELECT COUNT(*) as count FROM ji_import_items WHERE stage IN ('draft_ready', 'verifying', 'duplicate')").get() as any;
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

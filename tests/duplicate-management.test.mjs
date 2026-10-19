import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();

function createTestContext(overrides = {}) {
  const jar = new Map();
  const cookieOptions = new Map();
  const cache = new Map();
  const context = vm.createContext({
    console,
    Buffer,
    URL,
    Request,
    Response,
    File,
    FormData,
    Date,
    setTimeout,
    clearTimeout,
    structuredClone,
    process: {
      cwd: () => root,
      env: {
        NODE_ENV: "development",
        ATSAI_DATABASE_PATH: ":memory:",
        ATSAI_ADMIN_SETUP_TOKEN: "test-setup-key-at-least-thirty-two-characters",
        ...overrides
      }
    }
  });

  const cookieJar = {
    get: (k) => (jar.has(k) ? { value: jar.get(k) } : undefined),
    set: (k, v, options) => {
      jar.set(k, v);
      cookieOptions.set(k, options);
    },
    delete: (k) => jar.delete(k)
  };

  function load(file) {
    const full = path.resolve(root, file);
    if (cache.has(full)) return cache.get(full).exports;
    const loaded = { exports: {} };
    cache.set(full, loaded);
    const source = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;

    const require = (id) => {
      if (id === "next/server") return { ...nativeRequire("next/server"), connection: async () => {}, NextResponse: { json: (data, init) => Response.json(data, init) } };
      if (id === "server-only") return {};
      if (id === "next/headers") return { cookies: async () => cookieJar };
      if (id.startsWith("@/")) {
        let p = `src/${id.slice(2)}`;
        if (!p.endsWith(".ts")) p += ".ts";
        return load(p);
      }
      if (id.startsWith(".")) {
        let p = path.resolve(path.dirname(full), id);
        if (!p.endsWith(".ts")) p += ".ts";
        return load(p);
      }
      return nativeRequire(id);
    };

    vm.runInContext(`(function(require,module,exports){${source}\n})`, context, { filename: full })(
      require,
      loaded,
      loaded.exports
    );
    return loaded.exports;
  }

  return { load, jar, cookieOptions };
}

test("1. Entity & Semantic Normalization and Deterministic Canonical Fingerprints", async () => {
  const { load } = createTestContext();
  const canonical = load("src/lib/canonical-jobs.ts");

  // Company normalization
  assert.equal(canonical.normalizeCompanyName("TCS"), "tata consultancy");
  assert.equal(canonical.normalizeCompanyName("Tata Consultancy Services Pvt. Ltd."), "tata consultancy");
  assert.equal(canonical.normalizeCompanyName("INFY"), "infosys");
  assert.equal(canonical.normalizeCompanyName("Infosys Technologies Limited"), "infosys");

  // Title normalization
  assert.equal(canonical.normalizeJobTitleText("Sr. Data Analyst"), "senior data analyst");
  assert.equal(canonical.normalizeJobTitleText("Jr. Software Developer"), "junior software developer");
  assert.equal(canonical.normalizeJobTitleText("Lead Software Engr."), "lead software engineer");

  // City normalization
  assert.equal(canonical.normalizeCityName("Bangalore, Karnataka"), "bengaluru");
  assert.equal(canonical.normalizeCityName("Bengaluru"), "bengaluru");
  assert.equal(canonical.normalizeCityName("Bombay"), "mumbai");

  // Fingerprint matching
  const fp1 = canonical.computeCanonicalFingerprint("TCS", "Sr. Data Analyst", "Mumbai", "TCS-DA-101");
  const fp2 = canonical.computeCanonicalFingerprint("Tata Consultancy Services", "Senior Data Analyst", "Mumbai, Maharashtra", "TCS-DA-101");
  assert.equal(fp1, fp2, "Requisition-anchored vacancies must produce identical fingerprints regardless of agency syntax differences");
});

test("2. 4-Tier Weighted Duplicate Detection Engine", async () => {
  const { load } = createTestContext();
  const deduplication = load("src/lib/job-intelligence/deduplication.ts");

  const existingJob = {
    id: "job-agency-a",
    title: "Senior Data Analyst",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    experienceMin: 3,
    experienceMax: 5,
    workMode: "Hybrid",
    category: "Data",
    skills: "SQL, Python, PowerBI",
    organizationId: "org-agency-a"
  };

  // Scenario 2A: Same Agency submitting duplicate -> block_same_employer
  const sameAgencyCandidate = {
    id: "job-candidate-dup",
    title: "Data Analyst",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    experienceMin: 3,
    experienceMax: 5
  };
  const sameAgencyResult = deduplication.findDuplicateJob(sameAgencyCandidate, [existingJob], "org-agency-a");
  assert.equal(sameAgencyResult.action, "block_same_employer");
  assert.match(sameAgencyResult.reason, /TCS-DA-101/i);

  // Scenario 2B: Second Authorized Agency submitting same requisition -> link_authorized_partner
  const secondAgencyCandidate = {
    id: "job-agency-b",
    title: "Data Analyst",
    company: "Tata Consultancy Services",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    experienceMin: 3,
    experienceMax: 5
  };
  const secondAgencyResult = deduplication.findDuplicateJob(secondAgencyCandidate, [existingJob], "org-agency-b");
  assert.equal(secondAgencyResult.action, "link_authorized_partner");
  assert.ok(secondAgencyResult.confidenceScore >= 0.80);

  // Scenario 2C: Different Seniority & Scope -> distinct_vacancy
  const distinctLeadCandidate = {
    id: "job-lead",
    title: "Lead Data Scientist & AI Architect",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-AI-909",
    experienceMin: 10,
    experienceMax: 15
  };
  const distinctResult = deduplication.findDuplicateJob(distinctLeadCandidate, [existingJob], "org-agency-b");
  assert.equal(distinctResult.action, "distinct_vacancy");
});

test("3. Canonical Vacancy & Employer Job Postings Relational Linking", async () => {
  const { load } = createTestContext();
  const db = load("src/lib/admin/db.ts");
  const canonical = load("src/lib/canonical-jobs.ts");

  // Register agency organizations
  await db.db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    "org-abc", "ABC Recruitment Partners", "IN", "https://abc-recruiting.com", new Date().toISOString()
  );
  await db.db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    "org-xyz", "XYZ Staffing Solutions", "IN", "https://xyz-staffing.com", new Date().toISOString()
  );

  // Agency A creates vacancy for TCS Data Analyst (Req: TCS-DA-101)
  const jobRecordA = {
    id: "content-job-a",
    kind: "job",
    slug: "tcs-data-analyst-mumbai-abc",
    title: "Data Analyst",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    category: "Analytics",
    jobCity: "Mumbai",
    jobRegion: "Maharashtra",
    jobCountry: "IN",
    workMode: "Hybrid",
    experienceMin: 3,
    experienceMax: 5,
    status: "published",
    author: "ABC Recruiter",
    content: { type: "doc", content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  await db.db().prepare("INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    jobRecordA.id, "job", jobRecordA.slug, jobRecordA.status, JSON.stringify(jobRecordA), jobRecordA.createdAt, jobRecordA.updatedAt, 1
  );
  await db.db().prepare("INSERT INTO ats_jobs VALUES (?, ?)").run(jobRecordA.id, "org-abc");

  const syncA = await canonical.syncContentToCanonical(jobRecordA, "org-abc", "authorized_agency");
  assert.ok(syncA.isNewCanonical);
  assert.ok(syncA.canonicalJob.id);
  assert.equal(syncA.posting.organizationId, "org-abc");

  // Agency B creates vacancy for same requisition
  const jobRecordB = {
    id: "content-job-b",
    kind: "job",
    slug: "tcs-data-analyst-mumbai-xyz",
    title: "Data Analyst (Analytics)",
    company: "Tata Consultancy Services",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    category: "Analytics",
    jobCity: "Mumbai",
    jobRegion: "Maharashtra",
    jobCountry: "IN",
    workMode: "Hybrid",
    experienceMin: 3,
    experienceMax: 5,
    status: "published",
    author: "XYZ Staffing",
    content: { type: "doc", content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  await db.db().prepare("INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    jobRecordB.id, "job", jobRecordB.slug, jobRecordB.status, JSON.stringify(jobRecordB), jobRecordB.createdAt, jobRecordB.updatedAt, 1
  );
  await db.db().prepare("INSERT INTO ats_jobs VALUES (?, ?)").run(jobRecordB.id, "org-xyz");

  const syncB = await canonical.syncContentToCanonical(jobRecordB, "org-xyz", "authorized_agency");
  assert.equal(syncB.isNewCanonical, false, "Must link to existing canonical vacancy");
  assert.equal(syncB.canonicalJob.id, syncA.canonicalJob.id, "Both agencies must point to same canonicalJobId");

  // Retrieve canonical summary by content slug
  const summary = await canonical.getCanonicalJobSummary(jobRecordA.slug);
  assert.ok(summary);
  assert.equal(summary.allPostingsCount, 2);
  assert.equal(summary.authorizedPostings.length, 1);
  assert.equal(summary.authorizedPostings[0].organizationName, "XYZ Staffing Solutions");
});

test("4. Candidate Prior Application Detection & Multi-Tenant Privacy Isolation", async () => {
  const { load } = createTestContext();
  const db = load("src/lib/admin/db.ts");
  const recruitment = load("src/lib/recruitment.ts");
  const canonical = load("src/lib/canonical-jobs.ts");

  // Create Organizations
  await db.db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    "org-agency-1", "Alpha Global Talent", "IN", "https://alphaglobal.com", new Date().toISOString()
  );
  await db.db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    "org-agency-2", "Beta Executive Search", "IN", "https://betasearch.com", new Date().toISOString()
  );

  // Create Candidate
  const candidateId = "cand-101";
  await db.db().prepare("INSERT INTO candidate_accounts (id, name, email, password, profile, consentAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    candidateId, "Rahul Sharma", "rahul.sharma@example.com", "hash", JSON.stringify({ skills: "SQL, Python", location: "Mumbai", headline: "Data Analyst" }), new Date().toISOString(), new Date().toISOString()
  );

  // Job 1 by Agency 1
  const job1 = {
    id: "job-req-alpha",
    kind: "job",
    slug: "tcs-data-analyst-alpha",
    title: "Data Analyst",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    category: "Analytics",
    jobCity: "Mumbai",
    jobCountry: "IN",
    workMode: "Hybrid",
    experienceMin: 3,
    experienceMax: 5,
    status: "published",
    author: "Alpha",
    content: { type: "doc", content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  await db.db().prepare("INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    job1.id, "job", job1.slug, job1.status, JSON.stringify(job1), job1.createdAt, job1.updatedAt, 1
  );
  await db.db().prepare("INSERT INTO ats_jobs VALUES (?, ?)").run(job1.id, "org-agency-1");
  await canonical.syncContentToCanonical(job1, "org-agency-1", "authorized_agency");

  // Job 2 by Agency 2
  const job2 = {
    id: "job-req-beta",
    kind: "job",
    slug: "tcs-data-analyst-beta",
    title: "Data Analyst",
    company: "TCS",
    location: "Mumbai",
    requisitionId: "TCS-DA-101",
    category: "Analytics",
    jobCity: "Mumbai",
    jobCountry: "IN",
    workMode: "Hybrid",
    experienceMin: 3,
    experienceMax: 5,
    status: "published",
    author: "Beta",
    content: { type: "doc", content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  await db.db().prepare("INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    job2.id, "job", job2.slug, job2.status, JSON.stringify(job2), job2.createdAt, job2.updatedAt, 1
  );
  await db.db().prepare("INSERT INTO ats_jobs VALUES (?, ?)").run(job2.id, "org-agency-2");
  await canonical.syncContentToCanonical(job2, "org-agency-2", "authorized_agency");

  // Step 1: Candidate applies via Agency 1
  const check1 = await canonical.checkCandidatePriorCanonicalApplication(candidateId, job1.id);
  assert.equal(check1.hasPrior, false);

  const now = new Date().toISOString();
  await db.db().prepare(
    "INSERT INTO candidate_applications (id, candidateId, jobId, jobTitle, company, status, document, createdAt, updatedAt, canonicalJobId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run("app-1", candidateId, job1.id, job1.title, job1.company, "submitted", JSON.stringify({ notes: "Agency 1 submission" }), now, now, check1.canonicalJobId || null);

  // Step 2: Candidate navigates to Agency 2's listing
  const check2 = await canonical.checkCandidatePriorCanonicalApplication(candidateId, job2.id);
  assert.equal(check2.hasPrior, true, "Must detect prior submission for the same canonical vacancy");
  assert.equal(check2.isSameRecruiter, false, "Must detect it was a different agency");
  assert.equal(check2.priorAgencyName, "Alpha Global Talent", "Must identify prior agency");

  // Step 3: Candidate confirms application to Agency 2
  const app2Id = "app-2";
  await db.db().prepare(
    "INSERT INTO candidate_applications (id, candidateId, jobId, jobTitle, company, status, document, createdAt, updatedAt, canonicalJobId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(app2Id, candidateId, job2.id, job2.title, job2.company, "submitted", JSON.stringify({ notes: "Agency 2 submission" }), now, now, check2.canonicalJobId);

  // Step 4: Strict Multi-Tenant Isolation Verification
  // Agency 1 must ONLY see app-1
  const agency1Apps = await db.db().prepare(
    "SELECT a.id, a.jobId FROM candidate_applications a JOIN ats_jobs j ON j.jobId = a.jobId WHERE j.organizationId = ?"
  ).all("org-agency-1");
  assert.equal(agency1Apps.length, 1);
  assert.equal(agency1Apps[0].id, "app-1");

  // Agency 2 must ONLY see app-2
  const agency2Apps = await db.db().prepare(
    "SELECT a.id, a.jobId FROM candidate_applications a JOIN ats_jobs j ON j.jobId = a.jobId WHERE j.organizationId = ?"
  ).all("org-agency-2");
  assert.equal(agency2Apps.length, 1);
  assert.equal(agency2Apps[0].id, "app-2");
});

test("5. Admin Duplicate Resolution Workflow", async () => {
  const { load } = createTestContext();
  const db = load("src/lib/admin/db.ts");
  const canonical = load("src/lib/canonical-jobs.ts");

  const auditId = "audit-dup-01";
  const canonicalId = "canon-vac-01";
  const incomingJobId = "job-incoming-01";
  const orgId = "org-unverified";

  // Create organization
  await db.db().prepare("INSERT INTO ats_organizations (id, name, country, website, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    orgId, "Unverified Agency", "IN", "https://unverified.com", new Date().toISOString()
  );

  // Create content record for incoming job
  const incDoc = {
    id: incomingJobId,
    kind: "job",
    slug: "cloud-engineer-tcs-unverified",
    title: "Cloud Engineer",
    company: "TCS",
    location: "Pune",
    requisitionId: "TCS-REQ-55",
    category: "Technology",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  await db.db().prepare("INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    incomingJobId, "job", incDoc.slug, incDoc.status, JSON.stringify(incDoc), incDoc.createdAt, incDoc.updatedAt, 1
  );

  // Create canonical job
  await db.db().prepare(
    `INSERT INTO canonical_jobs (id, slug, hiringCompanyName, hiringCompanyNormalized, requisitionId, jobTitle, jobTitleNormalized, category, locationCity, locationRegion, locationCountry, workMode, experienceMin, experienceMax, fingerprintHash, status, primaryPostingId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    canonicalId, "canon-job", "TCS", "tata consultancy", "TCS-REQ-55", "Cloud Engineer", "cloud engineer", "Tech", "Pune", "", "IN", "Hybrid", 4, 8, "fphash", "published", null, new Date().toISOString(), new Date().toISOString()
  );

  // Create audit entry
  await db.db().prepare(
    `INSERT INTO job_duplicate_audits (id, incomingJobId, canonicalJobId, matchMethod, confidenceScore, featuresJson, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    auditId, incomingJobId, canonicalId, "ai_4tier_rules", 0.88, JSON.stringify({ requisitionMatch: true }), "held_for_review", new Date().toISOString()
  );

  // Create incoming employer job posting
  await db.db().prepare(
    `INSERT INTO employer_job_postings (id, canonicalJobId, contentId, organizationId, postingRole, authorizationStatus, mandateReference, mandateProofMediaId, isPrimary, displayAgencyBrand, recruiterNotes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "post-inc-01", canonicalId, incomingJobId, orgId, "authorized_agency", "pending_review", "MND-123", "", 0, 1, "", new Date().toISOString(), new Date().toISOString()
  );

  // Check pending audits
  const pending = await canonical.getPendingDuplicateAudits();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, auditId);

  // Admin approves and links as authorized partner
  const res = await canonical.resolveDuplicateAudit(auditId, "link_authorized", "admin@atsai.pro");
  assert.equal(res.status, "auto_linked");

  const updatedPosting = await db.db().prepare("SELECT authorizationStatus FROM employer_job_postings WHERE contentId = ?").get(incomingJobId);
  assert.equal(updatedPosting.authorizationStatus, "verified");

  const pendingAfter = await canonical.getPendingDuplicateAudits();
  assert.equal(pendingAfter.length, 0);
});

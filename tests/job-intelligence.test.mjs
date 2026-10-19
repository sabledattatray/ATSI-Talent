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
      if (id === "next/server") return { ...nativeRequire("next/server"), connection: async () => {} };
      if (id === "server-only") return {};
      if (id === "next/headers") return { cookies: async () => cookieJar };
      if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`);
      if (id.startsWith(".")) return load(path.resolve(path.dirname(full), `${id}.ts`));
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

test("Job Intelligence SSRF Guard: Blocks private, loopback, and metadata network targets", async () => {
  const { load } = createTestContext();
  const ssrf = load("src/lib/job-intelligence/ssrf.ts");

  // Loopback IPv4
  assert.throws(() => {
    ssrf.validateSafeUrl("http://127.0.0.1/admin/secrets");
  }, /(private\/restricted|loopback)/i);

  // Cloud metadata service (AWS/GCP/Azure link-local: 169.254.169.254)
  assert.throws(() => {
    ssrf.validateSafeUrl("http://169.254.169.254/latest/meta-data/");
  }, /private\/restricted/i);

  // Private RFC 1918 addresses
  assert.throws(() => ssrf.validateSafeUrl("http://10.0.0.1/jobs"), /private\/restricted/i);
  assert.throws(() => ssrf.validateSafeUrl("http://192.168.1.100/feed.json"), /private\/restricted/i);
  assert.throws(() => ssrf.validateSafeUrl("http://172.16.5.10/jobs"), /private\/restricted/i);

  // Localhost names
  assert.throws(() => ssrf.validateSafeUrl("http://localhost:3000/api"), /loopback/i);
  assert.throws(() => ssrf.validateSafeUrl("http://sub.localhost/api"), /loopback/i);

  // Dangerous protocols
  assert.throws(() => ssrf.validateSafeUrl("ftp://careers.example.com/jobs"), /scheme/i);
  assert.throws(() => ssrf.validateSafeUrl("file:///etc/passwd"), /scheme/i);
  assert.throws(() => ssrf.validateSafeUrl("gopher://internal.corp"), /scheme/i);

  // Embedded credentials
  assert.throws(() => ssrf.validateSafeUrl("https://admin:secret@careers.example.com"), /credentials/i);

  // Allowlist checking
  const allowlist = ["careers.google.com", "jobs.lever.co"];
  const safe = ssrf.validateSafeUrl("https://careers.google.com/jobs/123", allowlist);
  assert.equal(safe.hostname, "careers.google.com");

  assert.throws(() => {
    ssrf.validateSafeUrl("https://malicious-site.com/jobs", allowlist);
  }, /outside the authorized source domain allowlist/i);
});

test("Job Intelligence Normalizer: Maps types, work modes, and enforces non-fabrication of salaries", async () => {
  const { load } = createTestContext();
  const normalizer = load("src/lib/job-intelligence/normalizer.ts");

  // Employment type mappings
  assert.equal(normalizer.normalizeEmploymentType("FULL_TIME"), "Full-time");
  assert.equal(normalizer.normalizeEmploymentType("Contractor (C2C)"), "Contract");
  assert.equal(normalizer.normalizeEmploymentType("Intern"), "Internship");
  assert.equal(normalizer.normalizeEmploymentType("Temporary Worker"), "Temporary");
  assert.equal(normalizer.normalizeEmploymentType("Part-time"), "Part-time");
  assert.equal(normalizer.normalizeEmploymentType("Unknown / Random"), "Full-time");

  // Work mode mappings
  assert.equal(normalizer.normalizeWorkMode("Remote / Work from home"), "Remote");
  assert.equal(normalizer.normalizeWorkMode("Office-based only"), "On-site");
  assert.equal(normalizer.normalizeWorkMode("2 days in office"), "Hybrid");
  assert.equal(normalizer.normalizeWorkMode(""), "Unknown");

  // Salary non-fabrication
  const emptySalary = normalizer.normalizeSalary(undefined, undefined);
  assert.equal(emptySalary.salaryDisclosed, false);
  assert.equal(emptySalary.salaryMin, undefined);
  assert.equal(emptySalary.salaryMax, undefined);

  const rangeSalary = normalizer.normalizeSalary(1200000, 1800000, "INR", "YEAR");
  assert.equal(rangeSalary.salaryDisclosed, true);
  assert.equal(rangeSalary.salaryMin, 1200000);
  assert.equal(rangeSalary.salaryMax, 1800000);
  assert.equal(rangeSalary.salaryCurrency, "INR");
  assert.equal(rangeSalary.salaryPeriod, "YEAR");
});

test("Job Intelligence Parser: Extracts JSON-LD schema with field-level evidence tracking", async () => {
  const { load } = createTestContext();
  const parser = load("src/lib/job-intelligence/parser.ts");

  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Senior Frontend Engineer - Acme Corp Careers</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": "Senior Frontend Engineer",
            "description": "<p>We are seeking an experienced React and TypeScript engineer to lead our core UI platform.</p>",
            "identifier": {
              "@type": "PropertyValue",
              "name": "Acme Corp",
              "value": "ACME-2026-904"
            },
            "datePosted": "2026-03-01",
            "validThrough": "2026-12-31",
            "employmentType": "FULL_TIME",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Acme Corporation",
              "sameAs": "https://acme.example.com"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bengaluru",
                "addressRegion": "Karnataka",
                "addressCountry": "IN"
              }
            },
            "baseSalary": {
              "@type": "MonetaryAmount",
              "currency": "INR",
              "value": {
                "@type": "QuantitativeValue",
                "minValue": 2500000,
                "maxValue": 3500000,
                "unitText": "YEAR"
              }
            }
          }
        </script>
      </head>
      <body>
        <main>Job Posting Details</main>
      </body>
    </html>
  `;

  const { facts, evidence } = parser.parseJobContent(sampleHtml, "https://acme.example.com/jobs/904", "Acme Careers");
  assert.ok(facts, "Parsed job posting facts should not be null");
  assert.equal(facts.title, "Senior Frontend Engineer");
  assert.equal(facts.company, "Acme Corporation");
  assert.equal(facts.location, "Bengaluru, Karnataka, IN");
  assert.equal(facts.externalJobId, "ACME-2026-904");
  assert.equal(facts.salaryMin, 2500000);
  assert.equal(facts.salaryMax, 3500000);
  assert.equal(facts.salaryCurrency, "INR");

  // Verify evidence tracking
  assert.ok(evidence.length > 0, "Must record field evidence items");
  const titleEvidence = evidence.find(e => e.field === "title");
  assert.ok(titleEvidence);
  assert.equal(titleEvidence.extractionMethod, "json_ld");
});

test("Job Intelligence Verification: Hard blocks past deadlines, missing titles, and missing apply URLs", async () => {
  const { load } = createTestContext();
  const verifier = load("src/lib/job-intelligence/verification.ts");

  const mockSource = {
    id: "src-test",
    name: "Verified Partner Feed",
    ownerOrg: "Partner Corp",
    homepage: "https://partner.example.com",
    domainAllowlist: ["partner.example.com"],
    sourceType: "api",
    authBasis: "direct_owner",
    evidenceRef: "AGREEMENT-2026",
    reviewer: "Admin",
    approvedAt: "2026-01-01T00:00:00Z",
    renewalDate: "2027-01-01T00:00:00Z",
    status: "active",
    autoPublish: false,
    rateBudget: 100,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  };

  // Valid vacancy
  const validJob = {
    title: "Senior Product Designer",
    company: "DesignCo",
    location: "Bengaluru",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salaryMin: 2000000,
    salaryMax: 3000000,
    salaryCurrency: "INR",
    salaryPeriod: "YEAR",
    salaryDisclosed: true,
    descriptionSummary: "Leading our consumer design systems. Responsibilities include prototyping, UX audits, and mentoring.",
    responsibilities: ["Lead design reviews"],
    qualifications: ["5+ years experience"],
    skills: ["Figma", "UI Design"],
    datePosted: "2026-01-15",
    validThrough: "2026-12-31",
    officialApplyUrl: "https://partner.example.com/apply/123",
    sourceUrl: "https://partner.example.com/jobs/123"
  };

  const validResult = verifier.verifyJobFacts(validJob, mockSource);
  assert.equal(validResult.hardBlocks.length, 0);
  assert.equal(validResult.isPublishable, true);
  assert.ok(validResult.score >= 80, `Expected score >= 80, got ${validResult.score}`);

  // Hard block: Missing apply URL
  const missingApply = { ...validJob, officialApplyUrl: "" };
  const applyCheck = verifier.verifyJobFacts(missingApply, mockSource);
  assert.ok(applyCheck.hardBlocks.length > 0);
  assert.equal(applyCheck.isPublishable, false);

  // Hard block: Past deadline (expired)
  const expiredJob = { ...validJob, validThrough: "2025-01-01" };
  const expiredCheck = verifier.verifyJobFacts(expiredJob, mockSource);
  assert.ok(expiredCheck.hardBlocks.length > 0);
  assert.equal(expiredCheck.isPublishable, false);

  // Hard block: Missing title or company
  const noTitleJob = { ...validJob, title: "" };
  assert.ok(verifier.verifyJobFacts(noTitleJob, mockSource).hardBlocks.length > 0);

  const noCompanyJob = { ...validJob, company: "" };
  assert.ok(verifier.verifyJobFacts(noCompanyJob, mockSource).hardBlocks.length > 0);
});

test("Job Intelligence Deduplication: Computes fingerprints and matches canonical URLs and IDs", async () => {
  const { load } = createTestContext();
  const normalizer = load("src/lib/job-intelligence/normalizer.ts");
  const dedupe = load("src/lib/job-intelligence/deduplication.ts");

  const fp1 = normalizer.generateJobFingerprint({ company: "Acme Corp Ltd.", title: "Staff SRE", location: "Bengaluru, India" });
  const fp2 = normalizer.generateJobFingerprint({ company: "Acme Corp Ltd.", title: "Staff SRE", location: "Bengaluru, India" });
  assert.equal(fp1, fp2);

  // Exact apply URL match
  const existingJob = {
    id: "job-1",
    title: "Staff SRE",
    company: "Acme Corp Ltd.",
    location: "Bengaluru, India",
    applicationUrl: "https://careers.example.com/jobs/100"
  };

  const incomingFacts = {
    title: "Staff SRE",
    company: "Acme Corp Ltd.",
    location: "Bengaluru, India",
    officialApplyUrl: "https://careers.example.com/jobs/100"
  };

  const dupResult = dedupe.findDuplicateJob(incomingFacts, [existingJob], "src-1");
  assert.equal(dupResult.isDuplicate, true);
  assert.equal(dupResult.matchType, "canonical_url");
});

test("Job Intelligence Service: End-to-end import, deduplication, review queue, and approval publishing", async () => {
  const { load } = createTestContext();
  const service = load("src/lib/job-intelligence/service.ts");

  // 1. Seed sources
  await service.ensureDefaultSources();
  const sources = await service.getSources();
  assert.ok(sources.length >= 1, "Default source must be present");
  const source = sources[0];

  // 2. Preview import using built-in fixture URL
  const fixtureUrl = "https://careers.example.com/jobs/cloud-architect";
  const preview = await service.previewImport(fixtureUrl, source.id);
  assert.equal(preview.facts.title, "Lead Cloud Infrastructure Architect");
  assert.equal(preview.facts.company, "Example Cloud Technologies");
  assert.equal(preview.verification.hardBlocks.length, 0);
  assert.equal(preview.verification.isPublishable, true);

  // 3. Import batch
  const batch = await service.createImportBatch("admin-user", source.id, [fixtureUrl]);
  assert.equal(batch.totalItems, 1);
  assert.equal(batch.successItems, 1);
  assert.equal(batch.items.length, 1);

  const importedItem = batch.items[0];
  assert.equal(importedItem.stage, "draft_ready");

  // 4. Check review queue
  const queue = await service.getReviewQueue();
  assert.ok(queue.some(i => i.id === importedItem.id));

  // 5. Check item evidence
  const evidenceDetails = await service.getItemEvidence(importedItem.id);
  assert.ok(evidenceDetails);
  assert.equal(evidenceDetails.item.id, importedItem.id);

  // 6. Approve and publish item to content table
  const publishedJob = await service.approveAndPublishItem(importedItem.id, "Admin Tester");
  assert.ok(publishedJob);
  assert.equal(publishedJob.kind, "job");
  assert.equal(publishedJob.status, "published");
  assert.equal(publishedJob.applicationUrl, "https://careers.example.com/apply/cloud-architect");
  assert.equal(publishedJob.googleJobs, true);

  // 7. Test deduplication on re-import
  const batch2 = await service.createImportBatch("admin-user", source.id, [fixtureUrl]);
  assert.equal(batch2.items[0].stage, "published");
  assert.equal(batch2.items[0].jobId, publishedJob.id);

  // 8. Test overview statistics
  const overview = await service.getOverview();
  assert.ok(overview.importedCount >= 1);
  assert.ok(overview.duplicatesPreventedCount >= 1);
  assert.ok(overview.publishedCount >= 1);
  assert.ok(overview.activeSourcesCount >= 1);
});

test("Job Intelligence ATS Detection: Recognizes Greenhouse, Lever, Ashby, Workday URLs", () => {
  const { load } = createTestContext();
  const ats = load("src/lib/job-intelligence/ats-resolver.ts");

  assert.equal(ats.detectAtsProvider("https://boards.greenhouse.io/stripe/jobs/12345"), "greenhouse");
  assert.equal(ats.detectAtsProvider("https://jobs.lever.co/netflix/67890"), "lever");
  assert.equal(ats.detectAtsProvider("https://jobs.ashbyhq.com/openai/abcde"), "ashby");
  assert.equal(ats.detectAtsProvider("https://mycompany.myworkdayjobs.com/en-US/careers/job/123"), "workday");
  assert.equal(ats.detectAtsProvider("https://careers.example.com/jobs/cloud-architect"), "generic");
});

test("Job Intelligence HTML Section Parser: Parses sections, bullet points, and stated experience", () => {
  const { load } = createTestContext();
  const htmlParser = load("src/lib/job-intelligence/html-parser.ts");

  const sampleHtml = `
    <div>
      <p>Acme Corp is seeking a Senior Cloud Engineer to scale global systems.</p>
      <h2>What You'll Do</h2>
      <ul>
        <li>Architect distributed microservices on Kubernetes.</li>
        <li>Implement automated CI/CD deployment pipelines.</li>
        <li>Monitor high-availability multi-region services.</li>
      </ul>
      <h2>What You Bring</h2>
      <ul>
        <li>5+ years of experience with distributed systems and Go.</li>
        <li>Deep understanding of Linux networking and container runtimes.</li>
        <li>Bachelor's degree in Computer Science or related quantitative field.</li>
      </ul>
      <h2>Nice to Have</h2>
      <ul>
        <li>Experience with Terraform and eBPF.</li>
      </ul>
      <h2>Benefits</h2>
      <ul>
        <li>Comprehensive health insurance and wellness stipend.</li>
      </ul>
    </div>
  `;

  const sections = htmlParser.extractHtmlSections(sampleHtml);
  assert.ok(sections.responsibilities.length >= 3, "Must extract 3 responsibilities");
  assert.ok(sections.responsibilities[0].includes("Architect distributed microservices"));
  assert.ok(sections.qualifications.length >= 2, "Must extract qualifications");
  assert.ok(sections.preferredQualifications.length >= 1, "Must extract nice to have");
  assert.ok(sections.benefits.length >= 1, "Must extract benefits");

  const exp = htmlParser.extractExperienceFromText(sampleHtml);
  assert.equal(exp.statedExperience, "5+ years");
  assert.equal(exp.experienceMin, 5);

  const edu = htmlParser.extractEducationFromText(sampleHtml);
  assert.ok(edu.includes("Bachelor"), "Must extract education requirement");
});

test("Job Intelligence 3-Score Validation Gate: Enforces independent Authenticity, Completeness 0-100%, and Publication Rights", () => {
  const { load } = createTestContext();
  const verifier = load("src/lib/job-intelligence/verification.ts");

  // Thin job (only title, company, location, apply URL)
  const thinJob = {
    title: "Software Engineer",
    company: "Thin Listings Inc",
    location: "Bengaluru, India",
    workMode: "Hybrid",
    employmentType: "Full-time",
    officialApplyUrl: "https://careers.example.com/apply/thin",
    salaryDisclosed: false,
    responsibilities: [],
    qualifications: [],
    summary: "A role at Thin Listings Inc."
  };

  const externalSource = {
    id: "src-external",
    name: "External Public Career Board",
    status: "active",
    authBasis: "manual_reference_only",
    domainAllowlist: ["*"],
    autoPublish: false
  };

  const thinCheck = verifier.verifyJobFacts(thinJob, externalSource);

  // 1. Authenticity: External public board is Unverified
  assert.equal(thinCheck.authenticityStatus, "Unverified");

  // 2. Completeness: Thin page must NOT receive 100/100 and must be incomplete!
  assert.ok(thinCheck.completeness.score < 65, "Thin listing must score below 65%");
  assert.equal(thinCheck.completeness.isComplete, false, "Thin listing must not be marked complete");
  assert.ok(thinCheck.completeness.missingFields.length > 0, "Missing fields must be populated");

  // 3. Publication Rights: Incomplete external job must require Review, never Auto-Publish
  assert.equal(thinCheck.publicationRights, "Review");
  assert.equal(thinCheck.isPublishable, false);

  // Comprehensive verified job
  const richJob = {
    title: "Staff Systems Engineer",
    company: "Partner Enterprise",
    location: "Hyderabad, India",
    workMode: "Remote",
    employmentType: "Full-time",
    officialApplyUrl: "https://careers.example.com/apply/staff",
    salaryDisclosed: true,
    salaryMin: 4000000,
    salaryMax: 6000000,
    salaryCurrency: "INR",
    salaryPeriod: "YEAR",
    responsibilities: [
      "Design distributed fault-tolerant storage systems.",
      "Lead cross-functional reliability engineering reviews.",
      "Drive zero-downtime maintenance operations."
    ],
    qualifications: [
      "8+ years of production systems engineering.",
      "Proficiency in Rust, Go, and Linux internals.",
      "BS or MS in Computer Science."
    ],
    skills: ["Rust", "Go", "Kubernetes", "Distributed Systems"],
    summary: "Partner Enterprise is hiring a Staff Systems Engineer to oversee resilient platform infrastructure.",
    datePosted: "2026-10-18"
  };

  const partnerSource = {
    id: "src-partner",
    name: "Partner Enterprise Official",
    status: "active",
    authBasis: "direct_owner",
    domainAllowlist: ["*"],
    autoPublish: true
  };

  const richCheck = verifier.verifyJobFacts(richJob, partnerSource);
  assert.equal(richCheck.authenticityStatus, "Verified");
  assert.ok(richCheck.completeness.score >= 80, "Complete rich job must score >= 80%");
  assert.equal(richCheck.completeness.isComplete, true);
  assert.equal(richCheck.publicationRights, "Authorized");
  assert.equal(richCheck.isPublishable, true);
});

test("Job Intelligence Legal Attribution & Disclaimers: Never claims permission without authorization", () => {
  const { load } = createTestContext();
  const parser = load("src/lib/job-intelligence/parser.ts");

  // Unauthorized / public career reference
  const publicAttribution = parser.getLegalAttribution("HackerRank", "manual_reference_only");
  assert.equal(publicAttribution.isIndependentCurated, true);
  assert.ok(publicAttribution.attribution.includes("independently summarized from the employer's public career listing"));
  assert.ok(!publicAttribution.attribution.includes("sourced with permission"));

  // Explicit written permission
  const partnerAttribution = parser.getLegalAttribution("Google", "written_permission");
  assert.equal(partnerAttribution.isIndependentCurated, false);
  assert.ok(partnerAttribution.attribution.includes("Sourced with permission from Google"));
});

test("Job Intelligence Audit & Repair: Audits existing jobs and normalizes provenance", async () => {
  const { load } = createTestContext();
  const service = load("src/lib/job-intelligence/service.ts");

  const repairResult = await service.auditAndRepairAllJobs("Test Runner");
  assert.ok(typeof repairResult.scannedCount === "number");
  assert.ok(typeof repairResult.repairedCount === "number");
  assert.ok(typeof repairResult.unsupportedClaimsRemoved === "number");
});

test("Job Intelligence HTML Sanitizer: Strips raw/encoded HTML block kit and div tags cleanly", () => {
  const { load } = createTestContext();
  const htmlParser = load("src/lib/job-intelligence/html-parser.ts");
  const summaryModule = load("src/lib/job-intelligence/summary.ts");

  const rawBlockSnippet = `Role Overview & Summary\n\n<div class="content-intro"><div class="c-message_kit__blocks c-message_kit__blocks--rich_text"> <div class="c-message__message_blocks c-message__message_blocks--rich_text" data-qa="message-text"> <div class="p-block_kit_renderer" data-qa="block-kit-renderer"> <div class="p-block_kit_renderer__block_wrapper p-block_kit_renderer__block_wrapper--first"> <div class="p-rich_text_block">We are looking for an exceptional Staff AI Engineer to build scalable machine learning systems.`;
  const cleaned = htmlParser.cleanHtmlToText(rawBlockSnippet);

  assert.ok(!cleaned.includes("<div"), "Cleaned text must not contain raw <div tags");
  assert.ok(!cleaned.includes("content-intro"), "Cleaned text must not contain raw HTML class names");
  assert.ok(!cleaned.includes("c-message_kit__blocks"), "Cleaned text must not contain block kit classes");
  assert.ok(cleaned.includes("Staff AI Engineer"), "Cleaned text must retain actual content");

  // Encoded HTML snippet test
  const encodedSnippet = `&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;Lead multi-agent reasoning models.&lt;/p&gt;&lt;/div&gt;`;
  const cleanedEncoded = htmlParser.cleanHtmlToText(encodedSnippet);
  assert.ok(!cleanedEncoded.includes("&lt;"), "Must decode entities");
  assert.ok(!cleanedEncoded.includes("<div"), "Must not leave <div after decoding");
  assert.ok(cleanedEncoded.includes("Lead multi-agent reasoning models."));

  // Full summary generation test
  const generated = summaryModule.generateFactualJobContent({
    externalJobId: "12345",
    title: "Staff AI Researcher",
    company: "Anthropic Partner",
    location: "Bengaluru, India",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salaryDisclosed: false,
    descriptionSummary: rawBlockSnippet,
    responsibilities: [
      `<div class="p-rich_text_block">Design and evaluate reasoning benchmarks</div>`,
      "Train multi-modal foundation models"
    ],
    officialApplyUrl: "https://careers.example.com/apply/staff-ai-researcher",
    sourceUrl: "https://careers.example.com/apply/staff-ai-researcher",
    sourceAttribution: "Independent vacancy notice",
    isIndependentCurated: true,
    atsProvider: "greenhouse"
  });

  const docText = JSON.stringify(generated.content);
  assert.ok(!docText.includes("<div"), "Generated document AST must not contain <div tags in text nodes");
  assert.ok(!docText.includes("c-message_kit"), "Generated document AST must not contain c-message_kit");
  assert.ok(docText.includes("Staff AI Engineer"));
  assert.ok(docText.includes("Design and evaluate reasoning benchmarks"));
});

test("Country Normalization & Validation: Accepts country names and codes without 'Too big: expected string to have <=2 characters' error", () => {
  const { load } = createTestContext();
  const countries = load("src/lib/countries.ts");
  const validation = load("src/lib/admin/validation.ts");

  // Country code normalizer checks
  assert.equal(countries.toCountryCode("India"), "IN");
  assert.equal(countries.toCountryCode("United States"), "US");
  assert.equal(countries.toCountryCode("USA"), "US");
  assert.equal(countries.toCountryCode("United Kingdom"), "GB");
  assert.equal(countries.toCountryCode("UK"), "GB");
  assert.equal(countries.toCountryCode("Canada"), "CA");
  assert.equal(countries.toCountryCode("Germany"), "DE");
  assert.equal(countries.toCountryCode("IN"), "IN");
  assert.equal(countries.toCountryCode("in"), "IN");

  // Content schema validation checks
  const baseJob = {
    id: "job-test-country-1",
    kind: "job",
    title: "Senior Full Stack Engineer",
    slug: "senior-full-stack-engineer",
    status: "draft",
    excerpt: "Join our engineering team to build scalable recruiting platforms.",
    category: "Engineering",
    cover: "",
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "This is a full description of the role for validation." }] }]
    },
    seoTitle: "Senior Full Stack Engineer",
    seoDescription: "Join our engineering team to build scalable recruiting platforms.",
    author: "ATSAI Team",
    featured: false,
    company: "Example Tech",
    location: "Bengaluru, India",
    workMode: "Hybrid",
    employmentType: "Full-time",
    experienceMin: 3,
    experienceMax: 8,
    salaryMin: 2000000,
    salaryMax: 4000000,
    skills: "React, Node.js, TypeScript",
    expiresAt: "",
    applicationUrl: "",
    version: 1,
    googleJobs: true,
    jobOriginalDate: "2026-10-18",
    jobCity: "Bengaluru",
    jobRegion: "Karnataka",
    jobCountry: "India" // Full country name - previously failed with "Too big: expected string to have <=2 characters"
  };

  const parsed = validation.contentSchema.parse(baseJob);
  assert.equal(parsed.jobCountry, "IN", "Full country name 'India' must be normalized to 'IN'");

  // Also test with "United States"
  const parsedUS = validation.contentSchema.parse({ ...baseJob, jobCountry: "United States" });
  assert.equal(parsedUS.jobCountry, "US", "Full country name 'United States' must be normalized to 'US'");
});

test("SEO Title and Description Length Validation: Automatically trims strings exceeding limits without 'Too big: expected string to have <=70 characters' error", () => {
  const { load } = createTestContext();
  const validation = load("src/lib/admin/validation.ts");

  const longSeoTitle = "Senior Cloud Infrastructure Engineer at Tata Consultancy Services | ATSAI Career Directory";
  assert.ok(longSeoTitle.length > 70, "Test prerequisite: longSeoTitle must exceed 70 chars");
  const longSeoDesc = "A".repeat(250);

  const baseJob = {
    id: "seo-test-job-id",
    kind: "job",
    title: "Senior Full Stack Engineer",
    slug: "senior-full-stack-engineer",
    status: "draft",
    excerpt: "Summary excerpt for the role.",
    category: "Engineering",
    cover: "",
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Role content description." }] }]
    },
    seoTitle: longSeoTitle,
    seoDescription: longSeoDesc,
    author: "ATSAI Team",
    featured: false,
    company: "Example Tech",
    location: "Bengaluru, India",
    workMode: "Hybrid",
    employmentType: "Full-time",
    experienceMin: 3,
    experienceMax: 8,
    salaryMin: 2000000,
    salaryMax: 4000000,
    skills: "React, Node.js, TypeScript",
    expiresAt: "",
    applicationUrl: "",
    version: 1,
    googleJobs: false,
    jobOriginalDate: "2026-10-18",
    jobCity: "Bengaluru",
    jobRegion: "Karnataka",
    jobCountry: "IN"
  };

  const parsed = validation.contentSchema.parse(baseJob);
  assert.ok(parsed.seoTitle.length <= 70, `seoTitle must be <= 70 chars, got ${parsed.seoTitle.length}`);
  assert.equal(parsed.seoTitle, longSeoTitle.slice(0, 70).trim());
  assert.ok(parsed.seoDescription.length <= 170, `seoDescription must be <= 170 chars, got ${parsed.seoDescription.length}`);
  assert.equal(parsed.seoDescription, longSeoDesc.slice(0, 170).trim());
});



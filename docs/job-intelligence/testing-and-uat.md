# ATSAI.pro — Job Intelligence Testing, Verification & UAT Suite
**Version**: 1.0  
**Effective Date**: 19 October 2026  

---

## 1. Test Suite Architecture

All automated tests run via `node --test tests/job-intelligence.test.mjs` using the repository's native in-memory test runner harness. No external network requests are made during automated CI runs.

### 1.1 Test Scenarios
1. **Source Permissions & Gating**:
   - Rejection of URLs outside source domain allowlist.
   - Enforcement of active source status (paused/revoked sources reject ingestion).
   - Validation that `manual_reference_only` sources cannot auto-publish.
2. **SSRF & Security Defense**:
   - Rejection of loopback addresses (`127.0.0.1`, `localhost`), link-local metadata addresses (`169.254.169.254`), and private LAN subnets (`10.0.0.0/8`, `192.168.0.0/16`).
   - Rejection of non-HTTP protocols (`file:`, `javascript:`, `ftp:`).
3. **Deterministic Extraction & Normalization**:
   - Accurate extraction of Schema.org `JobPosting` JSON-LD metadata.
   - Normalization of employment types (`Full-time`, `Contract`, `Part-time`, `Internship`).
   - Normalization of workplace modes (`On-site`, `Hybrid`, `Remote`).
   - Preservation of unstated fields (missing salary stays `"Not disclosed"`, never fabricated).
4. **Duplicate Detection**:
   - Idempotent re-import of exact `(source_id, external_job_id)` produces zero duplicate records.
   - Matching canonical source URLs updates the existing record with revision history.
5. **Quality Verification Engine**:
   - Computation of 100-point explainable verification score.
   - Hard-block triggers for missing official apply URLs or closed deadlines.
6. **Publishing Flow & Public Experience**:
   - Published job successfully renders on `/jobs/[slug]` with external apply CTA.
   - Verification that candidates are routed directly to the official employer website without collecting unauthorized resumes.

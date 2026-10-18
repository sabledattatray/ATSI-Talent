# ATSAI.pro — Job Intelligence Source Permissions & Legal Governance
**Version**: 1.0  
**Effective Date**: 19 October 2026  
**Module**: Job Intelligence  

---

## 1. Governance Principles & Strict Constraints

1. **Non-Negotiable Rule**: Public visibility on the web is **NOT** automatic permission to scrape, harvest, or republish job listings. Automated acquisition is permitted **ONLY** where authorized by:
   - Employer direct authorization / written agreement.
   - Licensed job feed agreement (XML/JSON/RSS) granting redistribution rights.
   - Published official API terms permitting indexing and attribution.
   - Documented consent from the hiring organization.
2. **Aggregator Blacklist**: Third-party aggregators (such as LinkedIn, Indeed, Naukri, Monster) are **NEVER** scraped or acquired without express written partnership contracts.
3. **Robots.txt & Rate Governance**: All ingestion connectors strictly respect `robots.txt` directives, HTTP 429 backoff headers, and configured request budgets (concurrency and rate caps).
4. **Third-Party Attribution & Linking**:
   - Independent summaries must be visibly labeled: *"Independent job summary curated by ATSAI. Sourced with permission from [Employer]. Apply directly on the official employer website."*
   - Never state or imply that ATSAI is the hiring company for third-party positions.
   - Never collect resumes or candidate applications on behalf of an employer without explicit, signed authorization.

---

## 2. Authorization Bases (`authorization_basis`)

| Basis Key | Description | Required Evidence | Auto-Publish Eligible? |
|-----------|-------------|-------------------|------------------------|
| `direct_owner` | Directly registered and verified employer posting within their own workspace. | Verified employer domain email & session auth. | Yes (standard ATS flow) |
| `written_permission` | Formal written contract or legal authorization letter from employer. | Signed agreement PDF reference & legal review date. | Opt-in after review |
| `license` | Commercial feed syndication license. | Commercial license agreement ID & term duration. | Opt-in after review |
| `published_api_terms` | Official career API with public developer terms permitting job search syndication. | URL to published API terms & compliance audit record. | Manual review by default |
| `manual_reference_only` | Admin research assist; factual extraction into private draft. | Reference URL; must link exclusively to official employer apply page. | Strictly NO |

---

## 3. Approved Test Sources (Phase 1 Baseline)

1. **`src-atsai-fixtures`** (Internal Synthetic Fixture Source):
   - Scope: Deterministic mock job requisitions for continuous integration, regression testing, and UAT.
   - Authorization: Built-in development fixtures.
   - Auto-publish: Configurable in test environment.

2. **`src-sample-employer-feed`** (Standard JSON Job Feed):
   - Protocol: Structured JSON Job Feed compliant with Schema.org JobPosting.
   - Authorization: Verified mock partnership agreement.
   - Domain Allowlist: `*.example.com`, `*.test`, `*.atsai.pro`.

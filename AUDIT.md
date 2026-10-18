# ATSAI project audit

Date: 17 October 2026. Scope: application routes, API handlers, shared data service and fixtures, public navigation, job search and application workflows, dashboards, metadata/indexing, configuration, dependency advisories, lint/type checks, production build and selected browser flows.

> Historical baseline audit. Admin authentication, persistent job/blog publishing, and database backups were implemented afterward. See [RELEASE_AUDIT.md](RELEASE_AUDIT.md) and [ADMIN.md](ADMIN.md) for current capabilities and remaining launch limitations.

## Assessment

The repository implements a recruitment website and local browser prototype, not an operational ATS. Its PRD describes services that do not exist yet. The highest-risk problems were unauthenticated access to sample personal records and success/security claims for actions that never reached a backend. These have been contained. This audit does not certify production security, legal compliance or WCAG conformance.

Existing uncommitted project work was retained. No deployment, publication, account creation or external messaging was performed.

## Findings and changes

| Priority | Finding | Change |
| --- | --- | --- |
| Critical | Application, lead and mandate APIs exposed records without authentication. | Private GET handlers now return 401 and no records. No anonymous access mechanism was substituted for authentication. |
| Critical | Any credentials and MFA input led to privileged dashboards; direct dashboard URLs bypassed the simulated login. | Removed credential/MFA simulation. Demo workspace selection is explicit. Server layouts return 404 for every workspace in production builds. |
| High | Submission APIs fabricated reference IDs and successful persistence, verification emails and team notifications. | All operational submission handlers return 503 with an explicit nothing-saved-or-sent response. Password reset no longer claims email delivery. |
| High | Sample jobs, recruiter identities, candidate records and workflow outcomes could appear as real inventory. | Fixture exports are development-only. Persistent demo notice; production public APIs contain no fixtures; recruiter API cannot issue a verified result. Production submission pages are unavailable. |
| High | Browser local storage retained personal-like records and silently swallowed write failures. | New isolated session-storage keys; legacy data is neither loaded nor deleted. Write failures throw; delayed submission handlers and immediate workflow actions show errors instead of success. Embedded browsers that block session storage can still read the sample preview but cannot save changes. Stored record shapes are validated. |
| High | Withdrawal did not revoke consent; withdrawn applications could advance. | Withdrawal clears role consent, is idempotent, and blocks advancement. Applications reject missing consent, duplicate active submissions and unavailable jobs. |
| High | Admin takedown changed component state then immediately reloaded the unchanged record. | Save the paused job before refreshing. Shared job subscriptions propagate changes to directory, homepage and job detail views. |
| Medium | Filtering included inappropriate job states, invalid numeric ranges and confidential company search matches. | Shared visibility checks require published, verified, current listings. API filters validate integers, bounds and enums. Experience ranges use overlap semantics. Confidential employer fields are redacted in public API results and excluded from company-name matching. |
| Medium | Incoming search URLs were lost when Next.js reused an existing page. | Filters derive from Next search parameters and update the URL directly, preserving client navigation, reload and share behavior. |
| Medium | File replacement could retain an earlier valid resume after an invalid file selection. | Clear prior selection before validation; reject empty/oversized/unsupported files; validate every application step on final submit. Only metadata is stored, not file contents. |
| Medium | Application modal and mobile filter drawer lacked native focus containment and Escape handling. | Native modal dialogs provide focus containment and Escape close; scroll locking added. Labels associated with fields; nested main landmark removed; desktop menus support keyboard access and Escape. |
| Medium | Duplicate JobPosting structured data, indexable sample pages and a broken footer link. | Removed sample JobPosting markup; disabled preview indexing via metadata, robots and response headers; empty preview sitemap; corrected resources link. |
| Medium | Invented uptime, latency, encryption, scanning and ready-for-production claims. | Replaced status/security pages and JSON with actual configuration availability. Added draft legal notices. Removed article cards that advertised nonexistent articles. |
| Medium | Missing baseline HTTP response protection. | Added framing restrictions, nosniff, referrer policy, device permission restrictions, a limited CSP and noindex headers. This is not a complete production CSP or deployment security assessment. |
| Low | Project-wide lint errors, unused imports, unsafe any types and cascading hydration effects. | Fixed source issues without disabling lint rules; added a browser hydration boundary; internal navigation uses Next Link/router. |
| Low | Default development port conflicted with another project. | npm run dev defaults to 127.0.0.1:3001. |

## Verification

- `npm run lint`: passes with no errors or warnings.
- `npm run typecheck`: passes.
- `npm test`: 12 passing regression tests covering production fixture isolation, storage integrity/failures, persisted takedown, consent withdrawal, duplicate applications, job visibility, confidential search and API boundaries.
- `npm run build`: production build verified; removal of empty job static-parameter generation resolved the Cache Components build error.
- Production HTTP smoke checks: 31 static page routes checked; all returned expected status (workspaces 404, public pages 200). Three private API collections returned 401. Production jobs API returned zero fixtures. Four response security/indexing headers checked. No sample employer name in homepage HTML.
- Browser checks on port 3001: homepage Power BI search retained `q=Power+BI` and showed one matching position; job detail loaded; application and mobile filters exposed named dialogs; Escape closed both.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities.
- Full `npm audit`: five high-severity reports in one development-tool chain, `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`. The installed and latest available braces release was 3.0.3, which is affected by GHSA-vfj7-8cjw-p6xm. No compatible patched release was available. The suggested eslint-config-next downgrade to 14.2.35 was not applied to this Next 16 project. Keep untrusted glob patterns away from tooling and recheck for a compatible upstream patch.

## Remaining launch blockers

1. Select and implement server-side authentication, MFA where appropriate, sessions and role/tenant authorization. Development demo access is not an authorization system.
2. Implement a durable database and transactional services for jobs, applications, leads, mandates, consent events, withdrawals, reports and privacy requests. Restore success responses only after records really persist.
3. Implement private resume storage, validated uploads, malware scanning, authorized retrieval and deletion. Current selected files are not uploaded.
4. Connect verified transactional email, delivery/error handling, idempotency, rate limiting and abuse protection. No operational messages are currently sent.
5. Replace sample data with approved inventory and establish real employer/recruiter verification and independent moderation. The browser audit timeline is illustrative and mutable, not a security audit log.
6. Obtain business verification, approved contact channels, content substantiation and qualified legal review of policy texts and commercial terms. Marketing/service pages remain preview copy and are not evidence of operational capability.
7. Implement monitored backups, restore checks, operational health probes and deployment controls. HTTPS, secrets, infrastructure controls and external integrations are not assessable from this repository alone.
8. Complete a dedicated accessibility/contrast, assistive-technology and full responsive regression pass before claiming WCAG conformance. Browser testing here covered selected workflows, not every device or every multi-step input combination.
9. Resolve the development dependency advisory when a compatible patch becomes available.

Production remains an explicitly limited preview. The safeguards intentionally prevent real personal-data intake until the missing services exist. To continue into an operational MVP, use the PRD's phased scope and supply the chosen infrastructure, identity provider and approved business records.

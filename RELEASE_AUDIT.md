# GitHub publishing review

Date: 17 October 2026. Target: `sabledattatray/ATSI-Talent`, branch `main`.

## Scope and current state

Reviewed the project structure, public and admin route boundaries, admin authentication and authorization, persistence, rich-content validation/rendering, media handling, job publishing APIs, public service descriptions, package metadata, Git exclusions, source/asset inventory, and the existing automated tests. The website includes public recruitment pages, the approved shared Helvetica logo artwork, a journal, and a persistent admin publishing workspace.

The admin workspace supports owner bootstrap, invitation-only editor accounts, hashed passwords, server sessions, job/article drafts and publication, archives, media, publishing defaults, team access, audit events, and database backups. Candidate/employer recruitment workflows remain development-only previews. This review prepares the source repository for GitHub; it does not certify production security, legal compliance, accessibility conformance, or authorize public deployment.

## Corrections in this review

- Malformed rich-text marks/attributes and unsupported heading levels now return validation errors, rather than crashing the request or breaking the editor. Empty embedded-image sources are rejected.
- Publication requires actual text; padding an empty document with editor attributes cannot bypass the content check.
- Owner setup-key comparison uses fixed-size hashes, handling non-ASCII guesses safely while retaining constant-time comparison.
- Public status and API descriptions now accurately distinguish configured admin publishing/authentication from unavailable recruitment intake and email services.
- Added regression coverage for malformed documents, empty publication, Unicode setup-key guesses, and published-job consistency between list/detail APIs.
- Type checking generates Next.js route definitions first, supporting a clean checkout. Declared `sharp` directly for the brand export script, rather than depending on an incidental transitive installation.
- Added an empty-secret environment template, repository credential/runtime-file checks, LF source normalization, and GitHub CI using Node.js 24 and pinned action commits.
- Updated the README and marked the earlier audit as a historical baseline. The target repository's existing MIT license and commit history are preserved.

## Verification

- Repository inspection checks the complete Git source/asset inventory for excluded runtime data, recognized credential patterns, and oversized files.
- All 18 automated tests pass, using isolated in-memory databases for admin testing.
- ESLint, Next.js route type generation, TypeScript checking, and an isolated production build are required before the push.
- Production dependency audit: zero reported vulnerabilities.
- The full dependency audit reports five high-severity entries in one **development-only** chain: `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`. The advisory is GHSA-vfj7-8cjw-p6xm. The current registry release of braces is 3.0.3 and remains affected. The suggested Next ESLint major downgrade was not applied to this Next.js 16 project. CI audits production dependencies; the full-audit limitation remains documented and should be revisited when a compatible upstream fix exists.

Private SQLite databases, WAL files, backups, session/user data, environment secrets, installed dependencies, and Next.js build outputs are excluded from Git. The safe `.env.example` contains no credentials. Passwords used in automated tests are fictional fixtures, not deployed login credentials. No raw Helvetica font files are included; the approved logo lettering is vector artwork.

## Remaining deployment limitations

- Hosting requires Node.js 24+, HTTPS, an exact configured admin origin, and a private persistent disk for the single-server SQLite deployment. Configure the first-owner setup secret on the production host. See [ADMIN.md](ADMIN.md).
- SMTP, email password recovery, MFA, and external identity providers are not configured. Team invitation links are created for the owner to share manually.
- Real candidate intake, resumes/scanning, employer inquiries, recruiter verification, abuse/privacy submissions, operational monitoring and business/legal review remain outside the configured publishing workspace.
- Search indexing remains disabled for the pre-launch site.
- Runtime database contents are intentionally not part of the source push. Admin accounts and published content need separate secure migration/backups when deploying to another host.

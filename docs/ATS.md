# ATSAI Technologies — Recruitment Software & HR Technology Solutions

This release changes ATSAI from a specialist recruitment site into an industry-neutral job portal with company-managed applicant tracking. It uses the existing Next.js application, Turso/libSQL storage, publishing workspace and candidate accounts. Existing jobs and applications are preserved.

## Working workflows

- **Company accounts:** independent signup/login, eight-hour hashed sessions, company owner and invited recruiter roles, expiring invitation links, member removal and password changes that revoke previous sessions.
- **Company data isolation:** server-side ownership checks apply to job editing, applicants, notes, stage updates, interview scheduling/cancellation, exports and attached resume access. Knowing another record’s ID grants no access. Authorized platform owners retain administrative oversight.
- **Job lifecycle:** draft, publish, update and archive; publication immediately affects the public job directory and sitemap. Jobs support any industry, international locations, two-letter country codes, ISO currencies and yearly/monthly/weekly/daily/hourly compensation. Original currencies and pay periods are displayed without currency conversion.
- **ATS pipeline:** applied, review, shortlist, interview, offer, hired, rejected and withdrawn. Employers can move an active application forward or reject it. Candidates control withdrawal. Closed applications cannot be advanced by company users. Optimistic concurrency rejects stale edits. Jobs retain applications when archived.
- **Candidate records:** applications capture an explicit-consent snapshot of the profile, cover note and attached resume. Later profile edits do not silently replace an application snapshot.
- **Private resumes:** successful PDF/Word/text import can save a private attachment. Downloads require the owning candidate, the hiring company with a non-withdrawn application referencing that file, or an authorized platform owner. Files are attachments with private/no-store caching. Candidates can delete stored files; referenced application links then stop resolving. Duplicate uploads are deduplicated by candidate and SHA-256, with ten files per candidate and an 8 MB per-file cap.
- **Team notes and audit:** internal assessment notes are visible only in the company workspace; candidate-facing timeline queries explicitly exclude them. Job, team, interview and application operations create persistent audit or timeline entries.
- **Interviews:** future dated appointments, explicit IANA time zones, meeting links or locations, cancellation and candidate-visible updates. Scheduling does not fabricate an email invitation or video meeting room.
- **Candidate tracking:** status, public history and interviews refresh approximately every 15 seconds while the page is visible. Employers also refresh visible workspaces. This is polling, not a WebSocket service.
- **Reporting:** actual job/applicant/interview/hire counts, current-stage funnel, search/job filtering and company-only CSV export. Exports neutralize spreadsheet formula prefixes.
- **Public website:** ATSAI Technologies branding, broader industry discovery, international job directory, software-focused services and employer pages, updated notices, structured job data and metadata. No fabricated global vacancy counts or sample production applicants.

## Run locally

Use Node.js 24 or newer. Run `npm ci`, configure storage as described in ADMIN.md, then `npm run dev`. The development URL is http://127.0.0.1:3001. Candidate accounts use `/candidate/signup`; companies use `/employer/signup`; company dashboards use `/employer/dashboard`. Staff CMS access remains separate at `/admin`.

Local sample workflows are disabled by default. For legacy fixture demonstrations only, explicitly set `NEXT_PUBLIC_ATSAI_DEMO=true` in development. Production never enables them.

The new tables are created additively during database initialization: `ats_organizations`, `ats_employers`, `ats_sessions`, `ats_jobs`, `ats_invites`, `ats_events`, `ats_interviews` and `ats_resumes`. Existing platform-managed jobs retain their current management; new employer jobs acquire an explicit company ownership record. Do not assign legacy jobs to companies without confirming ownership.

## Verification

`npm test`, `npm run lint`, `npm run build` and `npm run check:repository` cover the application. Integration tests exercise actual in-memory SQL rather than simulated success responses, including cross-company access attempts, private file access, withdrawal and conflicting edits.

For a production HTTP smoke test, start the built app on port 3005 with a **separate disposable local database**. Explicitly unset both ordinary and pinned Turso credentials so the test cannot write to production. Set `ATSAI_ADMIN_ORIGIN=http://127.0.0.1:3005`, then run `npm run check:ats`. The checker refuses non-local hosts. It creates fictional test companies, candidates, a job and application, and verifies the complete workflow. Test data remains in that isolated database for inspection.

## Operational configuration and current boundaries

- Production requires the existing valid database credentials, HTTPS, exact trusted request origin, backups and a retention process. New private resume files increase database storage; monitor capacity. Files are not antivirus-scanned, and scanned-image PDFs require OCR before importing.
- Automated email, email verification, self-service password recovery, external calendar/video integrations, SSO/MFA and offer e-signing are not configured in this release. Interviews and public stage messages work in the application. Share recruiter invitation links manually. No UI claims those external services ran.
- Company signup does not establish legal identity or grant a verification badge. Platform operations still need moderation and a business-approved employer verification process.
- Job eligibility is stated by the employer. Worldwide-capable publishing does not mean every role is open to every nationality or that the application automatically imports every vacancy on the internet.
- This is a single-organization-per-employer-account model with owner/recruiter permissions and shared application stages. Pipeline customization, complex approval chains, configurable retention automation and large-volume data pagination are additional product work.
- This release is a working ATS implementation, not an independent security, compliance, accessibility or load-testing certification. Run operational acceptance checks against the actual hosting configuration before representing enterprise readiness or a “100%” certification.

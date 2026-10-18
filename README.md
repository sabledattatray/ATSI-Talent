# ATSAI Talent Solutions

## Recruitment Software & HR Technology Solutions

An industry-neutral job portal and company-managed applicant tracking system built with Next.js, React, TypeScript and Turso/libSQL. Companies manage their own jobs, applicants and recruiting teams; candidates maintain resume-powered profiles and track applications.

### Included

- Public international job directory with industry, location, work-mode and keyword discovery.
- Company signup, private hiring dashboards and expiring recruiter invitations.
- Job drafts, publishing, editing and archiving, with original currencies and compensation periods.
- Persistent applicant pipeline, candidate-visible stage history and private team notes.
- Interview scheduling and cancellation with explicit time zones.
- PDF/Word resume import and private, authenticated resume attachments.
- Company-only reporting and CSV export; candidate withdrawal and consent snapshots.
- Existing platform publishing CMS, articles, owner administration, metadata and structured job data.

See [ATS workflows, setup and boundaries](docs/ATS.md), [admin/storage configuration](ADMIN.md) and [search setup](docs/SEO.md).

### Development

Use Node.js 24+. Install with `npm ci`, configure your database and trusted origin, and start `npm run dev`. Open http://127.0.0.1:3001.

- Candidate account: `/candidate/signup`
- Employer account: `/employer/signup`
- Company workspace: `/employer/dashboard`
- Staff publishing: `/admin`

### Verification

```sh
npm test
npm run lint
npm run build
npm run check:pdf-runtime
npm run check:repository
```

`npm run check:ats` runs a write-enabled workflow test against an isolated local server on port 3005. Read docs/ATS.md before starting it; never point test storage at production. Sample workflows are opt-in in development and excluded from production.

### Deployment

Existing Turso credentials and the exact production trusted origin remain required. Schema additions are automatic and additive. Keep backups and monitor private resume storage. The production website uses HTTPS and hashed server sessions; candidate, employer and staff accounts remain separate.

### External services

Candidate status and interview updates use a durable Resend email queue with delivery controls. Configure the verified sender, server credentials and retry scheduler as described in [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md). Candidate dashboards receive live updates with polling fallback. Email verification/password recovery, external calendar/video integrations, SSO/MFA and e-signing are not configured. Companies publish their own opportunities; no global job-feed subscription is bundled. Consult docs/ATS.md for remaining operational and scale considerations.

Created by [Datta Sable](https://dattasable.com). [MIT license](LICENSE).

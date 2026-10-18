# Public pages and recruitment workflows

Public information pages use the existing ATSAI brand and shared responsive form styles. Contact and About retain the approved contact@atsai.pro address and Pune/Mumbai location. Staff authentication is unchanged at /admin/login.

## Candidate access

- /candidate/signup creates a separate candidate account with explicit storage consent, hashed password, and a timestamp. /signup is an alias.
- /candidate/login authenticates candidates; /login is an alias. Candidate sessions use a separate HttpOnly cookie and do not grant staff access.
- /candidate/dashboard supports profile editing, saved published roles, internal application tracking, withdrawal, and password changes.
- Profiles accept an optional HTTPS resume/portfolio link. Candidate files are not uploaded.
- /candidate/apply/[slug] requires authentication and a published, unexpired internal role. Role-specific consent is required and a profile snapshot is saved. Duplicate applications are rejected. External application links remain external.

## Forms and owner review

Contact, employer hiring briefs, reports, privacy requests, and account assistance submit to /api/recruitment/inquiries. Valid submissions are saved in Turso and return a reference. Success is never displayed before a successful database write. No automated email is sent.

The owner uses /admin/inbox to read enquiries, candidates, and applications, update workflow status, and maintain the public recruiter directory. Editors cannot access the inbox or its API. Candidate APIs restrict data access and withdrawal to the current candidate. Private account and staff routes remain excluded from search indexing.

## Recruiter lookup

/verify-recruiter searches exact work email or recruiter ID in the owner-approved public directory. An empty directory yields no match. Staff accounts are not used as public recruiter records. Owners can deactivate entries; inactive records no longer match. Directory membership is not proof of the identity of a message sender.

## Remaining external services

Automated email confirmations, email-based reset links, MFA, direct candidate document uploads/scanning, and interview-calendar integrations are not configured. The account assistance form records a request for manual review. Commercial fees and engagement timelines are agreed separately; public pages no longer invent fixed guarantees.

## Validation

Integration tests cover separate candidate/staff access, consent, hashed credentials, profile snapshots, duplicate applications, expired/draft/external roles, candidate isolation, withdrawal, owner-only enquiries, explicit recruiter approval, and password session revocation. Production browser checks use an isolated local database with fictional accounts and messages. No test candidates or enquiries are inserted into the live database during release verification.

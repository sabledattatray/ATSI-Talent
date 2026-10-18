# Candidate updates and Resend

## Where staff update an application

Company owners and invited recruiters: sign in at `/employer/login`, open **Hiring pipeline**, select a candidate and use **Hiring decision → Application status**. Platform owners: `/admin/inbox` → **Applications**. Select a stage, optionally add a candidate-visible message, then **Save status & notify candidate**.

Stages include Applied, In review, Shortlisted, Interview scheduled, Interview completed, Selected, Offer, Hired, Rejected and Withdrawn. Staff can advance or reject an active application. Only candidates can withdraw. Closed applications cannot be reopened. Concurrent edits require a refresh instead of overwriting another decision. Scheduling an interview advances earlier stages to Interview scheduled. Selected is a hiring decision; Offer and Hired remain separate steps.

Public status updates, application receipts, interview scheduling/cancellation and withdrawals create a candidate timeline event and email queue entry in the same database transaction. Private team notes never create emails. Saving an unchanged stage with no message creates no additional event. Saving a message at the current stage creates a public update.

## Production configuration

1. In [Resend](https://resend.com/domains), add and verify a sender domain using the DNS records Resend provides. Follow the [sending guide](https://resend.com/docs/send-with-nodejs).
2. Set server-only `RESEND_API_KEY` and `ATSAI_EMAIL_FROM` in the hosting environment. Sender example: `ATSAI Talent Solutions <updates@your-verified-domain>`. Never use NEXT_PUBLIC variables or commit keys. Redeploy after changing environment variables.
3. Set `CRON_SECRET` to a random secret of at least 32 characters. Configure a hosting scheduler to GET `/api/notifications/dispatch` every minute with `Authorization: Bearer <CRON_SECRET>`. Do not put the secret in a URL. Choose a scheduler and plan that support the required frequency. The endpoint rejects missing/invalid credentials.
4. Apply a status update to a fictional QA application and verify its **Candidate email updates** panel. Check the Resend dashboard and the test recipient inbox. Avoid using real candidate records for testing.

The application already attempts delivery after successful API mutations using Next.js `after`. The scheduler is required for unattended retries and recovering queued messages after configuration or service outages. Each run processes up to three messages; increase worker frequency or capacity for larger volumes. Application changes remain saved when email delivery fails. No existing status history is retroactively emailed.

Without credentials, email rows show **Waiting for email setup**. Configuring credentials allows the worker to process them; staff can retry individual blocked/failed emails. Credentials being present confirms configuration only, not a verified domain or provider delivery.

## Delivery behavior

- The queue is durable in the same SQL database as the application. Conditional leases prevent concurrent workers claiming the same pending message. An immutable payload and stable Resend idempotency key protect retries within the provider's idempotency window.
- Failed requests use exponential backoff starting at one minute, up to five automatic attempts. Staff can retry failed messages after correcting the configuration. Processing abandoned by a terminated worker can be reclaimed after its one-minute lease expires.
- **Accepted by email provider** means Resend returned a message ID. It does not prove inbox delivery. Inspect Resend for bounces or delivery results; webhook-based delivered/bounced synchronization is not included.
- Emails contain only the candidate name, application role/company, public update, reference and dashboard link. HTML is escaped. Resume files and private notes are excluded.
- Authenticated SSE streams check revisions every two seconds and reconnect after short sessions. Candidate streams include only that candidate's public events; employer streams include only their company. Polling remains available during stream interruptions. Hosting must permit streaming responses.

## Validation

`npm test` covers stage transitions, company isolation, concurrent edits, transactional queue creation, mocked Resend success/failure/retry behavior, private-note exclusion and authenticated streams. No automated test sends real email. `npm run check:ats -- <base-url>` checks the built HTTP routes with fictional records.

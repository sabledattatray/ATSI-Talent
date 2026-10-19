# Google sign-in and email verification

Candidate and employer accounts support Google Identity Services (One Tap plus a Google button) and email/password sign-in. Staff/admin authentication stays separate. Accounts created before this update must verify their email the next time they sign in with a password; legacy candidate/employer sessions cannot access protected records until verification.

## Required production settings

1. Create a **Web application** OAuth client in Google Cloud / Google Auth Platform. Add **https://www.atsai.pro** and **https://atsai.pro** to authorised JavaScript origins. Set **GOOGLE_CLIENT_ID** on the hosting server, then redeploy. This integration uses the JavaScript credential callback: it does not need a client secret or redirect URI. Add a localhost origin and its port separately for local Google testing.
2. Configure Google branding, audience and authorised domains, and supply the actual ATSAI homepage, privacy-policy and terms URLs. Publish the OAuth app for the intended audience when ready; a testing app may restrict who can sign in.
3. Verify a sender domain in Resend. Set **RESEND_API_KEY** and **ATSAI_EMAIL_FROM**, for example ATSAI Talent Solutions <verify@atsai.pro>, only after that sender is authorised. Optional **ATSAI_AUTH_RESEND_API_KEY** and **ATSAI_AUTH_EMAIL_FROM** override these for OTP mail alone. Keep API keys server-side, never in NEXT_PUBLIC settings or source control. The existing application-notification service can reuse the ordinary Resend settings.
4. Keep **ATSAI_ADMIN_ORIGIN=https://www.atsai.pro** configured as the trusted production origin. The bare domain redirects to www. Redeploy after changing settings.

Missing email configuration blocks new email registrations and verification-required logins with an actionable error; it never skips verification. Missing Google configuration hides the Google controls. Configure email delivery before deploying this authentication change so existing unverified users can complete sign-in.

## User experience

- Email registration creates a pending account, sends a six-digit OTP and does not issue a session until the correct code is submitted. Password logins for already verified addresses do not require another OTP. Existing unverified users receive a verification step after supplying the correct password.
- OTPs expire after 10 minutes, allow five guesses, can be resent after 60 seconds and are limited to five send attempts per 15 minutes per account email/type. Verification is bound to a random, HttpOnly cookie and account type. Only a digest derived from the cookie secret and code is stored. Codes are single-use and never returned to the browser or logged.
- Delivery success means Resend returned a message ID, not proof of inbox delivery. If sending fails, sign in again with the registered email/password to retry; pending accounts are not treated as verified.
- Google sign-in verifies the token using Google's official library, including signature, issuer, audience and expiry, then checks the verified-email claim and a browser-bound, single-use nonce. Browser/FedCM policy decides whether One Tap appears; the Google button is the fallback. One Tap runs on login pages; new users register through the Google button after explicit terms consent (and company details for employers).
- Google does not automatically merge into an existing email account. Sign in with the password, complete email verification, open **Account security** from the workspace and explicitly link Google with the same email. Company invitations still require the invited email and a valid invitation. Google candidate access does not grant employer or staff access.
- Google-only accounts have no user-known password. Self-service password recovery/setting is not part of this change; use Google to sign in or contact support if access is lost.

## Owner reporting

Open **Admin → Users & accounts** for the full registered-user directory. It supports search, account-type/status/login-method filters, pagination, editing names and email addresses, employer company-owner/recruiter roles, suspension/restoration, forced sign-out and permanent account deletion with typed email confirmation. Every mutation is owner-only, checks the request origin, rejects stale edits and writes an audit event. Saving a user signs out existing sessions. Email changes reset verification and are blocked for Google-linked identities. Candidates cannot be converted to employer or staff accounts here; staff access stays in **Team members**. A company must keep at least one active company owner. Suspending an account prevents both email and Google login and revokes all sessions. Candidate deletion removes applications, interview records, private resumes and authentication data; employer deletion removes that login while keeping the company and its hiring records. These are registered accounts, not a newsletter subscription list.

The **User sign-in methods & verification** section remains available below the directory and in the recruitment inbox. Search users or filter by last successful method: Email + password, Google One Tap or Google button. The report shows account type, registration provider, Google linkage, verified-email status and last sign-in time; a second table lists the latest 100 successful sign-ins. The account table is capped at 500 users. Only the platform owner may read the underlying /api/auth/activity endpoint.

Google One Tap/button labels are based on the Google SDK's client-reported interaction type; they are analytics labels, not a security assertion. Provider identity always comes from the server-verified Google token. Existing accounts have no retroactive history: their next successful sign-in starts recording it. Deleting an account also deletes its authentication metadata, outstanding OTPs and sign-in history.

## Verification

Run npm test and npm run build. identity.test.mjs covers session gating, code expiry/replay/guess limits, sender failures, Google verifier rejection and nonce checks, explicit linking, account separation, owner-only reports and deletion cleanup. OAuth verification and email delivery are mocked in automated tests; real Google/FedCM and inbox delivery require the configured production credentials and an end-to-end test.

The local check:ats HTTP smoke script also completes OTP for its fictional users. Start an isolated server with ATSAI_DATABASE_PATH=:memory:, ATSAI_ADMIN_ORIGIN=http://127.0.0.1:3005, all four Turso URL/token settings empty, and ATSAI_TEST_OTP_INBOX pointing to an absolute temporary JSON file. Launch Node with --import ./scripts/fixtures/otp-mail.mjs before node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3005. Run check:ats in another terminal with the same inbox path. The opt-in preload intercepts mail only for fictional @example.test recipients and refuses non-local or production-storage settings; it is never imported by application code. It writes test OTPs only to that dedicated fixture inbox, and the checker submits them through the real verification endpoint. Never use this fixture on a deployed server.

References:
- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://developers.google.com/identity/gsi/web/guides/display-google-one-tap

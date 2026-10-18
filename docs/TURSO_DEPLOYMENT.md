# ATSAI on Vercel with Turso

The Vercel Turso integration supplies `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. The app uses these server-only credentials for accounts, sessions, jobs, articles, images, invitations, settings, and activity history. No writable deployment disk is required.

## Connect and deploy

1. Connect the Turso resource to the existing `atsi-talent` Vercel project for Production.
2. Confirm both Turso variables are present. Keep the token private and never use a `NEXT_PUBLIC_` prefix.
3. Add `ATSAI_ADMIN_ORIGIN=https://www.atsai.pro` for Production.
4. Add `ATSAI_ADMIN_SETUP_TOKEN` for Production using a newly generated random secret of at least 32 characters. Save it privately for the first signup.
5. Deploy the latest `main` commit. Environment variable changes require a new deployment.

Use separate database credentials for preview environments if you enable publishing there. The database URL must use `libsql://` or `https://`; incomplete configuration returns an unavailable response rather than falling back to an ephemeral database.

## Schema initialization and first owner

On the first database-backed request, the app creates missing tables and indexes using idempotent statements. Existing records are preserved. Opening `/api/admin/setup` should return HTTP 200 with `needsSetup`, `setupTokenRequired`, and `setupTokenConfigured` booleans. No secrets are returned.

Open `https://www.atsai.pro/admin/signup`. Create your own owner account using your name, email, a unique password of at least 12 characters, and the private server setup key. Once an owner exists, further signups require single-use email-bound invitations. No default credentials are installed.

After the owner is created, remove the setup key from the production environment and redeploy. Existing sessions and accounts remain in Turso across deployments.

## Data and media

Local development without Turso continues using `data/atsai.sqlite` or `ATSAI_DATABASE_PATH`. A new Turso resource starts with its own data; local accounts, articles, jobs, and media are not automatically uploaded. Preserve a local backup before any separate data migration.

Images remain stored as database BLOBs. Uploads are limited to 3 MB so requests fit below Vercel's function payload limit, including multipart overhead. Use Turso's backup/export facilities for hosted data; `scripts/backup-admin.mjs` is for local SQLite only.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Regression coverage includes owner setup, permissions, sessions, publishing visibility, media round trips, rollback, concurrent-edit conflict handling, and missing Vercel database configuration.

The public job API should respond successfully even when no roles have been published. First-owner signup still requires a configured setup key. Email delivery, email recovery, MFA, and real recruitment submission services remain separate integrations.

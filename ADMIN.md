# ATS AI admin workspace

## Start and create your account

Requires Node.js 24 or newer. Turso is used on Vercel; local development can use the existing SQLite file.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3001/admin. The first signup creates the workspace owner. No default passwords or test accounts are installed in the real workspace. After the owner exists, signup requires a single-use invitation tied to the invitee's email. Invitations last 72 hours; the owner copies and shares the link from Team members. Email delivery is not configured or simulated.

## Included

- Dashboard with real content counts and publishing checklist.
- Job postings: company, department, location, work mode, contract type, experience, INR compensation, skills, description, expiry, external application link, search metadata, cover, author, feature flag, draft/published/archive states.
- Blog publishing: Tiptap visual editor with headings, bold, italic, underline, strike, highlighting, alignment, lists, quotes, code blocks, links, uploaded images, tables, dividers, undo/redo, word counts and previews. The italic option belongs to article formatting; the brand wordmark remains upright.
- SEO titles and descriptions, readable unique slugs, cover images, author attribution, categories and featured articles.
- Media library: PNG, JPEG, WebP uploads up to 3 MB, server-side file signature checks, copy links, previews, and protection against removing referenced images. Media URLs are publicly accessible; do not upload private candidate documents.
- Owner/editor permissions, password changes, session revocation, activity log, publishing defaults and public journal identity settings.
- Drafts stay private. Publish makes jobs available at `/jobs` and `/jobs/<slug>`, and articles at `/blog`, `/blog/<slug>`, and `/resources`. Archiving removes public visibility and preserves the record for recovery. Expired jobs are excluded automatically.
- Optimistic version checks prevent one editor from silently overwriting another's saved content. Unsaved editor changes prompt before navigating away.

The editor saves when **Save draft**, **Publish**, or **Update published** is clicked. It does not claim to autosave. The first published timestamp is preserved across revisions. Content preview is private inside the authenticated workspace.

## Storage and authentication

When `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are configured, all users, password hashes, hashed session tokens, jobs, articles, media bytes, invitations, audit events and settings live in Turso. The libSQL client uses asynchronous parameterized queries and write transactions; transaction context stays isolated across requests. Missing tables and indexes are created idempotently on first use.

Without Turso, local development and self-hosting use `data/atsai.sqlite`, excluded from Git. Vercel deployments require complete Turso configuration and never create a local database as a fallback. Foreign keys are enabled. Passwords use salted scrypt; server sessions use random tokens in HttpOnly, SameSite=Strict cookies, expire after eight hours, and use Secure cookies in production. Mutations check the request origin. Authentication/password/upload attempts are rate limited. Only the owner controls invitations, team access, and site settings. Removing an editor invalidates their sessions.

Rich content is stored as a validated editor document and rendered using React elements; arbitrary HTML is never injected. Links accept HTTP/HTTPS only, and embedded images must reference the media library.

## Production configuration

Deploy to **Vercel with Turso**, or self-host on a single Node.js server with a private persistent SQLite disk. See [the Turso deployment guide](docs/TURSO_DEPLOYMENT.md). Local SQLite files must not be deployed as public assets. Existing local account/content data is not copied to Turso automatically.

Set these environment variables on the server:

```dotenv
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=provided-by-the-vercel-integration
ATSAI_ADMIN_ORIGIN=https://www.atsai.pro
ATSAI_ADMIN_SETUP_TOKEN=replace-with-a-random-secret-of-at-least-32-characters
```

Generate your setup key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Enter it on the first production signup. The setup key is never sent to the browser by the server. Remove it from deployment configuration after creating the owner, and store account recovery details securely. No SMTP, email-based password recovery, MFA, or external identity provider is configured.

Build with `npm run build`, then use `npm start -- --hostname 127.0.0.1 --port 3001`. Keep HTTPS and the exact admin origin configured at the reverse proxy. Production public pages allow indexing and are listed at `https://www.atsai.pro/sitemap.xml`. Admin, API, draft-policy, and preview routes remain excluded from search. Roles with an external application URL open that employer site. Other roles accept consented applications from signed-in candidates. The owner reviews candidate applications and public requests in Recruitment inbox.

For Turso, use the provider backup/export facilities. For local SQLite only, back up the database using `node scripts/backup-admin.mjs`. This uses SQLite's online backup API, including live WAL changes, and creates a timestamped file in `data/backups/` by default. Secure backups as carefully as the live database. To restore, stop the app, preserve the current database, restore the backup at the configured database path, then restart.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The admin tests use isolated libSQL in-memory databases, including a simulated Vercel configuration, and cover owner bootstrap, invitation-only signup, authentication, secure cookies, public/draft visibility, publishing, archiving, expired jobs, concurrent edits, unsafe rich text, upload signatures, referenced-image deletion, permissions, session invalidation, and rate limiting, asynchronous transaction rollback, concurrent edits, and media BLOB readback. Browser checks use a separate database on port 3002; no test records are added to the real workspace.

For isolated test builds, `ATSAI_BUILD_DIR` can select another Next.js output directory. Use it only for local verification; the ordinary development server remains on port 3001.

## Recruitment inbox and candidate accounts

The owner can open `/admin/inbox` to review saved Contact requests, hiring briefs, reports, privacy requests, account assistance, candidate applications, and registered candidate profiles. Editors cannot access these personal-data collections. Request and application statuses can be updated from the inbox. Withdrawn applications cannot be advanced.

Candidates register at `/candidate/signup`, sign in at `/candidate/login`, and use `/candidate/dashboard`. These accounts and cookies are separate from staff accounts. A candidate cannot choose or obtain a staff role through signup. Profile snapshots and consent timestamps are stored with each internal application. Direct resume uploads are not enabled; profiles accept optional HTTPS resume or portfolio links.

Public recruiter lookup returns only active entries explicitly added by the owner in Recruitment inbox → Recruiters. Staff accounts are not automatically published. Use exact recruiter ID or work email for lookup.

Enquiry and application receipts are displayed on screen. No automatic email is sent. Reply links open your own email app. Privacy and account-recovery requests require owner review and identity confirmation before action; submitting one does not automatically disclose or remove data.

### Text size and color

Select text in the job or article editor, enter a size from 8 to 96 pixels and press Enter (or leave the field), or choose a text color with the color picker. Reset text removes those two overrides from the selection. Save or publish to persist the formatting; previews and public pages render the same size and color. Existing unformatted content keeps its theme defaults.

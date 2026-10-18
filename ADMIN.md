# ATS AI admin workspace

## Start and create your account

Requires Node.js 24 or newer (uses the built-in SQLite driver).

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
- Media library: PNG, JPEG, WebP uploads up to 5 MB, server-side file signature checks, copy links, previews, and protection against removing referenced images. Media URLs are publicly accessible; do not upload private candidate documents.
- Owner/editor permissions, password changes, session revocation, activity log, publishing defaults and public journal identity settings.
- Drafts stay private. Publish makes jobs available at `/jobs` and `/jobs/<slug>`, and articles at `/blog`, `/blog/<slug>`, and `/resources`. Archiving removes public visibility and preserves the record for recovery. Expired jobs are excluded automatically.
- Optimistic version checks prevent one editor from silently overwriting another's saved content. Unsaved editor changes prompt before navigating away.

The editor saves when **Save draft**, **Publish**, or **Update published** is clicked. It does not claim to autosave. The first published timestamp is preserved across revisions. Content preview is private inside the authenticated workspace.

## Storage and authentication

The default database is `data/atsai.sqlite`, including users, password hashes, hashed session tokens, jobs, articles, media bytes, invitations, audit events and settings. It is excluded from Git. SQLite WAL mode and foreign keys are enabled. Passwords use salted scrypt; server sessions use random tokens in HttpOnly, SameSite=Strict cookies, expire after eight hours, and use Secure cookies in production. Mutations check the request origin. Authentication/password/upload attempts are rate limited. Only the owner controls invitations, team access, and site settings. Removing an editor invalidates their sessions.

Rich content is stored as a validated editor document and rendered using React elements; arbitrary HTML is never injected. Links accept HTTP/HTTPS only, and embedded images must reference the media library.

## Production configuration

Deploy as a **single Node.js server with persistent disk**, behind HTTPS. This SQLite configuration is not for ephemeral serverless disks or independently replicated app instances. Do not deploy the database or its directory as public static files.

Set these environment variables on the server:

```dotenv
ATSAI_DATABASE_PATH=/persistent/private/atsai.sqlite
ATSAI_ADMIN_ORIGIN=https://your-domain.example
ATSAI_ADMIN_SETUP_TOKEN=replace-with-a-random-secret-of-at-least-32-characters
```

Generate your setup key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Enter it on the first production signup. The setup key is never sent to the browser by the server. Remove it from deployment configuration after creating the owner, and store account recovery details securely. No SMTP, email-based password recovery, MFA, or external identity provider is configured.

Build with `npm run build`, then use `npm start -- --hostname 127.0.0.1 --port 3001`. Keep HTTPS and the exact admin origin configured at the reverse proxy. Production public pages allow indexing and are listed at `https://www.atsai.pro/sitemap.xml`. Admin, API, draft-policy, and preview routes remain excluded from search. Recruitment submission restrictions remain in place. Job applications go to the employer's configured external application URL, or open an email enquiry if no URL is supplied.

Back up the database using `node scripts/backup-admin.mjs`. This uses SQLite's online backup API, including live WAL changes, and creates a timestamped file in `data/backups/` by default. Secure backups as carefully as the live database. To restore, stop the app, preserve the current database, restore the backup at the configured database path, then restart.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The admin tests use isolated in-memory databases and cover owner bootstrap, invitation-only signup, authentication, secure cookies, public/draft visibility, publishing, archiving, expired jobs, concurrent edits, unsafe rich text, upload signatures, referenced-image deletion, permissions, session invalidation, and rate limiting. Browser checks use a separate database on port 3002; no test records are added to the real workspace.

For isolated test builds, `ATSAI_BUILD_DIR` can select another Next.js output directory. Use it only for local verification; the ordinary development server remains on port 3001.

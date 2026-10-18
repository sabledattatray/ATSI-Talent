# ATS AI Talent Solutions

Next.js recruitment website with authenticated admin job and blog publishing, a rich-text editor, a media library, and persistent SQLite storage. Candidate and employer intake remains a development preview; this project is not ready to process real recruitment submissions.

## Admin publishing workspace

Persistent jobs and blog publishing is available at **http://127.0.0.1:3001/admin**. The first signup creates the owner; subsequent signups require an invitation. Includes a rich-text editor, media library, team permissions, audit history, and site publishing settings. See [ADMIN.md](ADMIN.md) for configuration, backup, and production deployment requirements. Requires Node.js 24 or newer.

## Run locally

```sh
npm ci
# Optional: copy .env.example to .env.local and configure your environment.
npm run dev
```

Open http://localhost:3001. The development server binds to loopback. Port 3000 remains available for other projects.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start -- --port 3001 --hostname 127.0.0.1
```

Development builds include illustrative jobs and shared-role workspaces. Demo changes use isolated session-storage keys and remain in the current tab. Legacy `atsai_*_v1` local-storage records are not loaded or deleted. Use fictional information only. Resume file contents are never uploaded, and emails are not sent.

Production builds exclude sample collections and deny access to demo recruitment workspaces. The separate admin publishing workspace uses real authentication and persistent SQLite storage. Private collection APIs return 401; submission APIs return 503 until authenticated, durable services exist. There is no simulated credential or MFA flow. Search indexing stays disabled for this preview.

See [RELEASE_AUDIT.md](RELEASE_AUDIT.md) for the GitHub publishing review and current limitations. See [AUDIT.md](AUDIT.md) for findings, changes, validation and launch blockers. The product specification is [atsai.md](atsai.md); it describes intended functionality, not implemented services.

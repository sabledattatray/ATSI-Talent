# Content seeding and homepage improvements

The homepage is rendered on the server, including its job cards. Its search is a native GET form, so searching does not need a homepage event handler. Jobs still stream independently of the hero and navigation. The jobs directory retains interactive filters and live refreshes. The homepage shows database listings rather than local demo-store jobs. The rich-text editor and its editing libraries are loaded on demand when a content editor opens.

Visual improvements include stronger text contrast, blue/cyan accents, clearer feature links, comfortable search fields and touch targets, and adaptive cards at phone and tablet widths. Undisclosed compensation stays explicitly undisclosed.

## Seed editorial content explicitly

Database startup no longer inserts articles. Existing content is untouched. Seeding belongs in a maintenance step instead of a visitor request. The five bundled articles can be inserted as **drafts** for editorial review. No synthetic accounts, applications, employers or live vacancies are created.

Node.js 24 or later is required. The command loads the project's environment files without printing credentials. Cloud access must be selected explicitly.

```powershell
# Local: preview, then insert missing drafts
npm run seed:content -- --database data/editorial-preview.sqlite
npm run seed:content -- --database data/editorial-preview.sqlite --apply

# Configured Turso database: preview before applying
npm run seed:content -- --remote
npm run seed:content -- --remote --apply
```

Existing articles with the same slug are skipped, including edits and unpublished drafts. Re-running the command will not duplicate them or overwrite an editor's work. Review each inserted draft in the admin content area before publishing. The command does not delete anything and does not change existing publication dates.

## Validation and limitations

Use a local fixture database for seed checks. Never use production customer data for screenshots or performance testing. Preview on narrow phones, tablets and desktop; test keyboard navigation and search. A browser preview checks visual layout but cannot establish real-user Core Web Vitals. Measure deployed performance separately before claiming a load-time improvement.
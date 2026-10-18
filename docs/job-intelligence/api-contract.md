# ATSAI.pro — Job Intelligence API Contract
**Version**: 1.0  
**Effective Date**: 19 October 2026  

All endpoints are authenticated server-side routes mounted under `/api/admin/job-intelligence/`. Access requires an active admin session (`owner` or `editor`).

---

## 1. Overview & Statistics
- `GET /api/admin/job-intelligence/overview`
  - Returns KPI metrics: total discovered, imported, awaiting review, published, duplicates prevented, active sources, recent activity.

## 2. Source Governance
- `GET /api/admin/job-intelligence/sources`
  - Lists all configured job sources, permission status, rate limits, and health.
- `POST /api/admin/job-intelligence/sources`
  - Registers a new source (requires `owner` role for approval, `editor` creates pending proposal).
- `PATCH /api/admin/job-intelligence/sources/:id`
  - Updates source status (`active`, `paused`, `revoked`), domain allowlist, or auto-publish setting.

## 3. Ingestion & Import Pipeline
- `POST /api/admin/job-intelligence/imports/preview`
  - Takes a single URL and source ID. Runs validation, SSRF checks, extraction, and duplicate detection; returns structured preview with field evidence without persisting.
- `POST /api/admin/job-intelligence/imports`
  - Initiates a batch or single-URL import. Accepts array of URLs, optional batch label, dry-run flag.
- `GET /api/admin/job-intelligence/imports/:batchId`
  - Returns batch progress, status of each item, errors, and extracted draft IDs.
- `POST /api/admin/job-intelligence/imports/:batchId/cancel`
  - Cancels pending items in a batch.

## 4. Review Queue & Verification
- `GET /api/admin/job-intelligence/review-queue`
  - Retrieves items in `draft_ready` or `verifying` stage with pagination, filters by source and verification score.
- `GET /api/admin/job-intelligence/items/:id/evidence`
  - Returns full field-level evidence and verification check breakdown for a specific imported item.
- `POST /api/admin/job-intelligence/items/:id/approve`
  - Approves a verified draft and publishes it into the main `content` table.
- `POST /api/admin/job-intelligence/items/:id/reject`
  - Rejects an imported draft with mandatory rationale recorded in the audit log.
- `POST /api/admin/job-intelligence/items/:id/merge`
  - Merges duplicate draft with an existing canonical job listing.

## 5. Audit & Activity
- `GET /api/admin/job-intelligence/audit`
  - Returns chronologically ordered audit events for compliance tracing.

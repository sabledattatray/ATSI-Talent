# ATSAI.pro — Job Intelligence Data Model & Schema Specification
**Version**: 1.0  
**Effective Date**: 19 October 2026  

---

## 1. Schema Extensions in `src/lib/admin/db.ts`

The database tables are implemented using idempotent `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements compatible with both SQLite and Turso.

### 1.1 Source Governance Table (`ji_sources`)
```sql
CREATE TABLE IF NOT EXISTS ji_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ownerOrg TEXT NOT NULL,
  homepage TEXT NOT NULL,
  domainAllowlist TEXT NOT NULL,      -- JSON array of allowed hostnames
  sourceType TEXT NOT NULL,          -- 'api' | 'feed' | 'manual_assist'
  authBasis TEXT NOT NULL,           -- 'direct_owner' | 'written_permission' | 'license' | 'published_api_terms' | 'manual_reference_only'
  evidenceRef TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  approvedAt TEXT NOT NULL,
  renewalDate TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'revoked')),
  autoPublish INTEGER NOT NULL DEFAULT 0,
  rateBudget INTEGER NOT NULL DEFAULT 60, -- requests per hour
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### 1.2 Import Batches Table (`ji_import_batches`)
```sql
CREATE TABLE IF NOT EXISTS ji_import_batches (
  id TEXT PRIMARY KEY,
  initiator TEXT NOT NULL,
  sourceId TEXT REFERENCES ji_sources(id),
  totalItems INTEGER NOT NULL,
  processedItems INTEGER NOT NULL DEFAULT 0,
  successItems INTEGER NOT NULL DEFAULT 0,
  failedItems INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('queued', 'processing', 'completed', 'cancelled', 'failed')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### 1.3 Import Items Table (`ji_import_items`)
```sql
CREATE TABLE IF NOT EXISTS ji_import_items (
  id TEXT PRIMARY KEY,
  batchId TEXT NOT NULL REFERENCES ji_import_batches(id) ON DELETE CASCADE,
  sourceId TEXT NOT NULL REFERENCES ji_sources(id),
  sourceUrl TEXT NOT NULL,
  stage TEXT NOT NULL CHECK(stage IN ('queued', 'validating', 'fetching', 'parsing', 'normalizing', 'deduplicating', 'verifying', 'draft_ready', 'published', 'duplicate', 'failed', 'cancelled')),
  jobId TEXT REFERENCES content(id),
  externalJobId TEXT,
  extractedData TEXT,               -- Normalized JSON facts
  verificationScore INTEGER,
  verificationDetails TEXT,         -- JSON array of rule evaluations
  error TEXT,
  retryCount INTEGER NOT NULL DEFAULT 0,
  idempotencyKey TEXT UNIQUE NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ji_item_batch ON ji_import_items(batchId, stage);
CREATE INDEX IF NOT EXISTS ji_item_source ON ji_import_items(sourceId, stage);
```

### 1.4 Field Evidence Table (`ji_job_evidence`)
```sql
CREATE TABLE IF NOT EXISTS ji_job_evidence (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL REFERENCES ji_import_items(id) ON DELETE CASCADE,
  field TEXT NOT NULL,             -- 'title', 'company', 'salary', 'location', etc.
  extractedValue TEXT NOT NULL,
  sourceSnippet TEXT NOT NULL,
  extractionMethod TEXT NOT NULL,   -- 'json_ld', 'meta', 'parser', 'ai_grounded'
  confidence REAL NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ji_evidence_item ON ji_job_evidence(itemId, field);
```

### 1.5 Duplicate Tracking Table (`ji_duplicates`)
```sql
CREATE TABLE IF NOT EXISTS ji_duplicates (
  id TEXT PRIMARY KEY,
  candidateItemId TEXT NOT NULL REFERENCES ji_import_items(id) ON DELETE CASCADE,
  existingJobId TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  similarityScore REAL NOT NULL,
  matchReason TEXT NOT NULL,       -- 'exact_external_id' | 'canonical_url' | 'title_company_location' | 'near_text'
  decision TEXT NOT NULL CHECK(decision IN ('pending', 'merged', 'distinct', 'rejected')),
  decidedBy TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ji_duplicate_item ON ji_duplicates(candidateItemId);
```

### 1.6 Job Intelligence Audit Log (`ji_audit_events`)
```sql
CREATE TABLE IF NOT EXISTS ji_audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  targetId TEXT NOT NULL,
  metadata TEXT NOT NULL,           -- JSON structured event context
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ji_audit_time ON ji_audit_events(createdAt DESC);
```

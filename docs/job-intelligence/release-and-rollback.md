# ATSAI.pro — Job Intelligence Release and Rollback Strategy
**Version**: 1.0  
**Effective Date**: 19 October 2026  

---

## 1. Zero-Downtime Additive Migration Strategy

1. **Schema Migration**:
   - All Job Intelligence tables (`ji_sources`, `ji_source_permissions`, `ji_import_batches`, `ji_import_items`, `ji_job_evidence`, `ji_duplicates`, `ji_audit_events`) are strictly additive.
   - Initialized via idempotent `CREATE TABLE IF NOT EXISTS` statements during application boot in `src/lib/admin/db.ts`.
   - Existing tables (`content`, `users`, `sessions`, `candidate_applications`) remain intact with zero column deletions or destructive alterations.

2. **Rollback Plan**:
   - If Job Intelligence functionality needs to be rolled back, the module can be disabled via environment variable:
     `FEATURE_JOB_INTELLIGENCE=false`
   - Reverting the code deployment leaves existing `content` records unharmed because published jobs use the standard `content` table format.
   - Drop scripts for emergency auxiliary cleanup:
     ```sql
     DROP TABLE IF EXISTS ji_job_evidence;
     DROP TABLE IF EXISTS ji_duplicates;
     DROP TABLE IF EXISTS ji_import_items;
     DROP TABLE IF EXISTS ji_import_batches;
     DROP TABLE IF EXISTS ji_source_permissions;
     DROP TABLE IF EXISTS ji_sources;
     DROP TABLE IF EXISTS ji_audit_events;
     ```

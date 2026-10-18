# ATSAI.pro — Job Intelligence Operations Runbook
**Version**: 1.0  
**Effective Date**: 19 October 2026  

---

## 1. Routine Operational Procedures

### 1.1 Onboarding a New Job Source
1. Verify the legal authorization basis (`direct_owner`, `written_permission`, `license`, or `published_api_terms`).
2. Confirm domain allowlist and inspect the target site's `robots.txt` policy.
3. Open **Admin → Job Intelligence → Discovery Sources** and select **Add Source**.
4. Set hourly request budget (default 60 requests/hour).
5. Leave **Auto-Publish** disabled initially. Run test imports and review at least 20 records manually before considering auto-publish.

### 1.2 Managing Stale & Expired Vacancies
1. The system periodically executes automated status verification for published listings with external URLs.
2. If an employer page explicitly returns HTTP 404 or declares the position filled, the listing transitions to `closed`.
3. If an employer site returns HTTP 429 (rate limited) or temporary 503, the listing is marked `needs_reverification` and held for a retry; it is **never** prematurely expired.

---

## 2. Emergency Incident Response

### 2.1 Handling Source Revocation or Legal Takedown
1. Navigate to **Admin → Job Intelligence → Discovery Sources**.
2. Select the source and click **Revoke Source**.
3. Revocation immediately:
   - Pauses all pending and scheduled imports from this source.
   - Flags all published jobs derived from this source for unpublishing/review.
   - Records an immutable compliance entry in `ji_audit_events`.

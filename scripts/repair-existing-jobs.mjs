import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

// Connect to Turso cloud database or local SQLite database
const tursoUrl = (process.env.ATSAI_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || "").trim();
const tursoToken = (process.env.ATSAI_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "").trim();
const isTurso = Boolean(tursoUrl && tursoToken);

const dbPath = process.env.ATSAI_DATABASE_PATH || path.join(process.cwd(), "data", "atsai.sqlite");
const client = isTurso
  ? createClient({ url: tursoUrl, authToken: tursoToken })
  : createClient({ url: pathToFileURL(path.resolve(dbPath)).href });

console.log(`Database target: ${isTurso ? "Turso Cloud (" + tursoUrl + ")" : "Local SQLite (" + dbPath + ")"}`);

async function auditAndRepair() {
  const result = await client.execute("SELECT id, slug, document FROM content WHERE kind = 'job'");
  console.log(`Auditing ${result.rows.length} existing job listings...`);

  let repairedCount = 0;
  let unsupportedClaimsRemoved = 0;
  let missingExperienceFixed = 0;
  let datesRepaired = 0;

  const now = new Date().toISOString();

  for (const row of result.rows) {
    try {
      const job = JSON.parse(row.document);
      let changed = false;

      // 1. Audit authorization disclaimer in content
      const contentStr = JSON.stringify(job.content || {});
      if (contentStr.includes("sourced with permission") && !job.employerVerified) {
        unsupportedClaimsRemoved++;
        changed = true;
      }

      // 2. Fix artificial experience default
      let expMin = job.experienceMin || 0;
      let expMax = job.experienceMax;
      if (expMin === 0 && expMax === 5 && !contentStr.toLowerCase().includes("5 years") && !contentStr.toLowerCase().includes("5+ years")) {
        expMax = 0;
        missingExperienceFixed++;
        changed = true;
      }

      // 3. Ensure provenance dates are properly separated
      const employerPublishedAt = job.employerPublishedAt || job.jobOriginalDate || "";
      const lastVerifiedAt = job.lastVerifiedAt || now;
      const importedAt = job.importedAt || job.createdAt || now;
      if (!job.lastVerifiedAt || !job.employerPublishedAt) {
        datesRepaired++;
        changed = true;
      }

      // 4. Update attribution if not authorized partner
      const isIndependent = job.isIndependentCurated ?? (!job.employerVerified || (job.author && job.author.includes("Job Intelligence")));
      const legalDisclaimer = isIndependent
        ? "This vacancy is independently summarized from the employer's public career listing. ATSAI is not affiliated with or recruiting on behalf of the employer. Apply directly through the official employer website."
        : `Verified Career Listing: Sourced with permission from ${job.company}.`;

      // 5. Ensure SEO title and description are within limits
      let seoTitle = job.seoTitle || "";
      let seoDescription = job.seoDescription || "";
      if (seoTitle.length > 70) {
        seoTitle = seoTitle.slice(0, 70).trim();
        changed = true;
      }
      if (seoDescription.length > 170) {
        seoDescription = seoDescription.slice(0, 170).trim();
        changed = true;
      }

      const updatedJob = {
        ...job,
        seoTitle,
        seoDescription,
        experienceMax: expMax !== undefined ? expMax : 0,
        employerPublishedAt,
        lastVerifiedAt,
        importedAt,
        isIndependentCurated: isIndependent,
        legalDisclaimer,
        updatedAt: now
      };

      if (changed || !job.legalDisclaimer) {
        await client.execute({
          sql: "UPDATE content SET document = ?, updatedAt = ? WHERE id = ?",
          args: [JSON.stringify(updatedJob), now, job.id]
        });
        repairedCount++;
      }
    } catch (e) {
      console.error(`Error repairing job ${row.id}:`, e.message);
    }
  }

  console.log(`\nAudit and Repair Complete:`);
  console.log(`- Scanned: ${result.rows.length}`);
  console.log(`- Repaired: ${repairedCount}`);
  console.log(`- Unsupported permission claims removed: ${unsupportedClaimsRemoved}`);
  console.log(`- Artificial experience defaults normalized: ${missingExperienceFixed}`);
  console.log(`- Date provenance records separated: ${datesRepaired}`);
}

auditAndRepair().catch(console.error);

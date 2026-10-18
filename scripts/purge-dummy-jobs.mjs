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

async function purge() {
  // Check existing records before purge
  const beforeJobs = await client.execute("SELECT id, slug, kind FROM content WHERE kind = 'job'");
  const beforePosts = await client.execute("SELECT id, slug, kind FROM content WHERE kind = 'post'");
  console.log(`Found ${beforeJobs.rows.length} jobs to purge.`);
  console.log(`Found ${beforePosts.rows.length} blog posts (MUST PRESERVE).`);

  const jobIds = beforeJobs.rows.map(r => r.id);

  for (const jid of jobIds) {
    // Find candidate applications for this job
    const apps = await client.execute({ sql: "SELECT id FROM candidate_applications WHERE jobId = ?", args: [jid] });
    for (const app of apps.rows) {
      await client.execute({ sql: "DELETE FROM ats_notifications WHERE applicationId = ?", args: [app.id] });
      await client.execute({ sql: "DELETE FROM ats_interviews WHERE applicationId = ?", args: [app.id] });
      await client.execute({ sql: "DELETE FROM ats_events WHERE applicationId = ?", args: [app.id] });
    }
    await client.execute({ sql: "DELETE FROM candidate_applications WHERE jobId = ?", args: [jid] });
    await client.execute({ sql: "DELETE FROM candidate_saved_jobs WHERE jobId = ?", args: [jid] });
    await client.execute({ sql: "DELETE FROM ats_jobs WHERE jobId = ?", args: [jid] });
  }

  // Clear Job Intelligence test items and batches
  await client.execute("DELETE FROM ji_job_evidence");
  await client.execute("DELETE FROM ji_duplicates");
  await client.execute("DELETE FROM ji_import_items");
  await client.execute("DELETE FROM ji_import_batches");

  // Delete all jobs from content
  await client.execute("DELETE FROM content WHERE kind = 'job'");

  // Verification after purge
  const afterJobs = await client.execute("SELECT id, slug, kind FROM content WHERE kind = 'job'");
  const afterPosts = await client.execute("SELECT id, slug, kind FROM content WHERE kind = 'post'");

  console.log("--- Purge Complete ---");
  console.log(`Jobs remaining: ${afterJobs.rows.length}`);
  console.log(`Blog posts preserved: ${afterPosts.rows.length}`);
  for (const p of afterPosts.rows) {
    console.log(`- Post preserved: ${p.slug}`);
  }
}

purge().catch(err => {
  console.error("Purge failed:", err);
  process.exit(1);
});

import path from "node:path";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import nextEnv from "@next/env";
import { SEED_ARTICLES } from "../src/lib/data/seedArticles.ts";

const args = process.argv.slice(2);
const databaseFlag = args.indexOf("--database");
if (args.some((arg, index) => !["--apply", "--remote", "--database"].includes(arg) && !(databaseFlag !== -1 && index === databaseFlag + 1))) throw new Error("Usage: npm run seed:content -- [--apply] [--database <local-file> | --remote]");
if (databaseFlag !== -1 && (!args[databaseFlag + 1] || args[databaseFlag + 1].startsWith("--"))) throw new Error("--database requires a local filename.");
if (databaseFlag !== -1 && args.includes("--remote")) throw new Error("Choose one database target.");
nextEnv.loadEnvConfig(process.cwd());
const remoteUrl = process.env.ATSAI_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const remoteToken = process.env.ATSAI_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
const remote = args.includes("--remote");
if (!remote && databaseFlag === -1 && remoteUrl) throw new Error("Cloud database configured. Use --remote explicitly or --database <local-file> for a local preview.");
if (remote && (!remoteUrl || !remoteToken || !/^(libsql|https):\/\//.test(remoteUrl))) throw new Error("A complete Turso configuration is required for --remote.");
const filename = path.resolve(databaseFlag === -1 ? process.env.ATSAI_DATABASE_PATH || "data/atsai.sqlite" : args[databaseFlag + 1]);
if (!remote) mkdirSync(path.dirname(filename), { recursive: true });
const client = createClient(remote ? { url: remoteUrl, authToken: remoteToken } : { url: pathToFileURL(filename).href });
try {
  const table = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='content'");
  const existing = table.rows.length ? (await client.execute("SELECT slug FROM content WHERE kind='post'")).rows : [];
  const slugs = new Set(existing.map(row => row.slug));
  const missing = SEED_ARTICLES.filter(article => !slugs.has(article.slug));
  console.log(`Content seed: ${remote ? "configured cloud database" : filename}`);
  console.log(`${missing.length} missing editorial drafts; ${SEED_ARTICLES.length - missing.length} existing articles will be preserved.`);
  missing.forEach(article => console.log(`  draft: ${article.slug}`));
  if (!args.includes("--apply")) {
    console.log("Dry run only. Add --apply to insert missing drafts. Review and publish them in Admin > Content.");
  } else if (missing.length) {
    await client.execute("CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,status TEXT NOT NULL,document TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,version INTEGER NOT NULL,UNIQUE(kind,slug))");
    const now = new Date().toISOString();
    await client.batch(missing.map(article => ({
      sql: "INSERT INTO content (id,kind,slug,status,document,createdAt,updatedAt,version) VALUES (?,'post',?,'draft',?,?,?,1) ON CONFLICT(kind,slug) DO NOTHING",
      args: [article.id, article.slug, JSON.stringify({...JSON.parse(article.document),status:"draft",publishedAt:"",createdAt:now,updatedAt:now,version:1}), now, now],
    })), "write");
    console.log("Seed complete. Existing content was preserved; no users, jobs or applications were created.");
  } else console.log("Nothing to seed.");
} finally {
  client.close();
}
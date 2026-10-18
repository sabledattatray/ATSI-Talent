import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient, type Client, type InValue, type Transaction } from "@libsql/client";
import type { AdminUser, ContentRecord, SiteSettings, AuditRecord, MediaRecord } from "./types";

const schema = [
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','editor')),createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expiresAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,status TEXT NOT NULL,document TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,version INTEGER NOT NULL,UNIQUE(kind,slug))",
  "CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,size INTEGER NOT NULL,bytes BLOB NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1),document TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS invites (hash TEXT PRIMARY KEY,email TEXT NOT NULL,expiresAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,resetAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS candidate_accounts (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,profile TEXT NOT NULL,consentAt TEXT NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS candidate_sessions (hash TEXT PRIMARY KEY,candidateId TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,expiresAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS candidate_applications (id TEXT PRIMARY KEY,candidateId TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,jobId TEXT NOT NULL REFERENCES content(id),jobTitle TEXT NOT NULL,company TEXT NOT NULL,status TEXT NOT NULL,document TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,UNIQUE(candidateId,jobId))",
  "CREATE TABLE IF NOT EXISTS candidate_saved_jobs (candidateId TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,jobId TEXT NOT NULL REFERENCES content(id),PRIMARY KEY(candidateId,jobId))",
  "CREATE TABLE IF NOT EXISTS public_inquiries (id TEXT PRIMARY KEY,kind TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,company TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS public_recruiters (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,title TEXT NOT NULL,active INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_resumes (id TEXT PRIMARY KEY,candidateId TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,name TEXT NOT NULL,type TEXT NOT NULL,bytes BLOB NOT NULL,hash TEXT NOT NULL,createdAt TEXT NOT NULL,UNIQUE(candidateId,hash))",
  "CREATE TABLE IF NOT EXISTS ats_organizations (id TEXT PRIMARY KEY,name TEXT NOT NULL,country TEXT NOT NULL,website TEXT NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_employers (id TEXT PRIMARY KEY,organizationId TEXT NOT NULL REFERENCES ats_organizations(id),name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','recruiter')),createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_sessions (hash TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES ats_employers(id) ON DELETE CASCADE,expiresAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_jobs (jobId TEXT PRIMARY KEY REFERENCES content(id),organizationId TEXT NOT NULL REFERENCES ats_organizations(id))",
  "CREATE TABLE IF NOT EXISTS ats_invites (hash TEXT PRIMARY KEY,organizationId TEXT NOT NULL REFERENCES ats_organizations(id),email TEXT NOT NULL,expiresAt INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_events (id TEXT PRIMARY KEY,applicationId TEXT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,kind TEXT NOT NULL,stage TEXT NOT NULL,message TEXT NOT NULL,visibility TEXT NOT NULL CHECK(visibility IN ('candidate','team')),actor TEXT NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ats_interviews (id TEXT PRIMARY KEY,applicationId TEXT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,organizationId TEXT NOT NULL REFERENCES ats_organizations(id),title TEXT NOT NULL,startsAt TEXT NOT NULL,timeZone TEXT NOT NULL,location TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS ats_job_organization ON ats_jobs(organizationId)",
  "CREATE INDEX IF NOT EXISTS ats_events_application ON ats_events(applicationId,createdAt)",
  "CREATE INDEX IF NOT EXISTS ats_interviews_organization ON ats_interviews(organizationId,startsAt)",
  "CREATE INDEX IF NOT EXISTS candidate_application_owner ON candidate_applications(candidateId,createdAt)",
  "CREATE INDEX IF NOT EXISTS candidate_session_expiry ON candidate_sessions(expiresAt)",
  "CREATE INDEX IF NOT EXISTS content_visibility ON content(kind,status)",
  "CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expiresAt)",
];

const transactionContext = new AsyncLocalStorage<Transaction>();
let client: Client | undefined;
let initialization: Promise<void> | undefined;

function getClient(): Client {
  if (client) return client;
  const pinnedUrl = process.env.ATSAI_TURSO_DATABASE_URL?.trim();
  const pinnedToken = process.env.ATSAI_TURSO_AUTH_TOKEN?.trim();
  const pinned = !!(pinnedUrl || pinnedToken);
  const url = pinned ? pinnedUrl : process.env.TURSO_DATABASE_URL?.trim();
  const authToken = pinned ? pinnedToken : process.env.TURSO_AUTH_TOKEN?.trim();
  if (url || authToken) {
    if (!url || !authToken || !/^(libsql|https):\/\//.test(url)) {
      throw Object.assign(new Error("Turso database configuration is incomplete."), { status: 503 });
    }
    client = createClient({ url, authToken });
  } else {
    if (process.env.VERCEL) throw Object.assign(new Error("Connect the Turso database to this deployment."), { status: 503 });
    const filename = process.env.ATSAI_DATABASE_PATH || path.join(process.cwd(), "data", "atsai.sqlite");
    if (filename !== ":memory:") mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ filename)), { recursive: true });
    client = createClient({ url: filename === ":memory:" ? ":memory:" : pathToFileURL(path.resolve(/*turbopackIgnore: true*/ filename)).href, timeout: 5000 });
  }
  return client;
}

async function initializedClient(): Promise<Client> {
  const connection = getClient();
  if (!initialization) {
    initialization = (async () => {
      await connection.execute("PRAGMA foreign_keys=ON");
      await connection.batch(schema, "write");
    })().catch(error => { initialization = undefined; throw error; });
  }
  await initialization;
  return connection;
}

// Local in-memory SQLite has a single connection. Serialize independent local
// operations while allowing transaction-scoped queries to use their own connection.
let localQueue = Promise.resolve();
async function localOperation<T>(fn: () => Promise<T>): Promise<T> {
  if (process.env.ATSAI_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL) return fn();
  const previous = localQueue;
  let release!: () => void;
  localQueue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  try { return await fn(); } finally { release(); }
}

async function execute(sql: string, args: InValue[]) {
  const transaction = transactionContext.getStore();
  if (transaction) return transaction.execute({ sql, args });
  const connection = await initializedClient();
  return localOperation(() => connection.execute({ sql, args }));
}

// A small async adapter keeps all queries parameterized across local and Turso storage.
const database = {
  prepare(sql: string) {
    return {
      async run(...args: InValue[]) { return { changes: (await execute(sql, args)).rowsAffected }; },
      async get(...args: InValue[]): Promise<unknown> { return (await execute(sql, args)).rows[0]; },
      async all(...args: InValue[]): Promise<unknown[]> { return (await execute(sql, args)).rows; },
    };
  },
};
export function db() { return database; }

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  if (transactionContext.getStore()) return fn();
  const connection = await initializedClient();
  return localOperation(async () => {
    const tx = await connection.transaction("write");
    try {
      const value = await transactionContext.run(tx, fn);
      await tx.commit();
      return value;
    } catch (error) {
      if (!tx.closed) await tx.rollback();
      throw error;
    } finally { tx.close(); }
  });
}

export async function audit(actor: string, action: string, detail: string) {
  await db().prepare("INSERT INTO audit VALUES (?,?,?,?,?)").run(randomUUID(), actor, action, detail.slice(0, 500), new Date().toISOString());
}
export async function hasOwner() { return !!await db().prepare("SELECT id FROM users LIMIT 1").get(); }
export async function users(): Promise<AdminUser[]> {
  return await db().prepare("SELECT id,name,email,role,createdAt FROM users ORDER BY createdAt").all() as AdminUser[];
}
export async function records(kind?: string, published = false): Promise<ContentRecord[]> {
  const rows = await db().prepare("SELECT document FROM content WHERE (? IS NULL OR kind=?) AND (?=0 OR status='published') ORDER BY updatedAt DESC").all(kind || null, kind || null, published ? 1 : 0) as { document: string }[];
  return rows.map(row => JSON.parse(row.document) as ContentRecord).filter(r => !published || (!!r.publishedAt && Date.parse(r.publishedAt) <= Date.now() && (r.kind !== "job" || !r.expiresAt || Date.parse(r.expiresAt) > Date.now())));
}
export async function settings(): Promise<SiteSettings> {
  const row = await db().prepare("SELECT document FROM settings WHERE id=1").get() as { document: string } | undefined;
  return row ? JSON.parse(row.document) : { siteName: "ATSAI Talent Solutions", tagline: "Recruitment Software & HR Technology Solutions", contactEmail: "contact@atsai.pro", siteUrl: "https://www.atsai.pro", defaultAuthor: "ATS AI Editorial" };
}
export async function media(): Promise<MediaRecord[]> {
  return (await db().prepare("SELECT id,name,type,size,createdAt FROM media ORDER BY createdAt DESC").all() as Omit<MediaRecord, "url">[]).map(m => ({ ...m, url: `/api/media/${m.id}` }));
}
export async function activity(): Promise<AuditRecord[]> {
  return await db().prepare("SELECT * FROM audit ORDER BY createdAt DESC LIMIT 100").all() as AuditRecord[];
}
export async function workspace(user: AdminUser) {
  const [content, images, team, events, config] = await Promise.all([records(), media(), user.role === "owner" ? users() : Promise.resolve([]), activity(), settings()]);
  return { user, records: content, media: images, users: team, activity: events, settings: config };
}
export async function limit(key: string, max: number, windowMs = 900_000) {
  const now = Date.now();
  const row = await db().prepare("INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resetAt<? THEN 1 ELSE count+1 END,resetAt=CASE WHEN resetAt<? THEN excluded.resetAt ELSE resetAt END RETURNING count").get(key, now + windowMs, now, now) as { count: number };
  if (row.count > max) throw Object.assign(new Error("Too many attempts. Please try again in 15 minutes."), { status: 429 });
  await db().prepare("DELETE FROM rate_limits WHERE resetAt<?").run(now - windowMs);
}

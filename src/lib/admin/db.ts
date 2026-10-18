import "server-only";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { AdminUser, ContentRecord, SiteSettings, AuditRecord, MediaRecord } from "./types";

type Statement = { run(...args: unknown[]): { changes: number }; get(...args: unknown[]): unknown; all(...args: unknown[]): unknown[] };
type Database = { exec(sql: string): void; prepare(sql: string): Statement };
const requireNode = createRequire(process.cwd() + "/package.json");
const globalDb = globalThis as typeof globalThis & { atsaiAdminDb?: Database };
export function db(): Database {
  if (globalDb.atsaiAdminDb) return globalDb.atsaiAdminDb;
  const filename = process.env.ATSAI_DATABASE_PATH || path.join(process.cwd(), "data", "atsai.sqlite");
  mkdirSync(path.dirname(filename), { recursive: true });
  const { DatabaseSync } = requireNode("node:sqlite") as { DatabaseSync: new (filename: string) => Database };
  const database = new DatabaseSync(filename);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','editor')),createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expiresAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,status TEXT NOT NULL,document TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,version INTEGER NOT NULL,UNIQUE(kind,slug));
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,size INTEGER NOT NULL,bytes BLOB NOT NULL,createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1),document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS invites (hash TEXT PRIMARY KEY,email TEXT NOT NULL,expiresAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,resetAt INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS content_visibility ON content(kind,status);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expiresAt);`);
  globalDb.atsaiAdminDb = database;
  return database;
}
export function transaction<T>(fn: () => T): T { const d = db(); d.exec("BEGIN IMMEDIATE"); try { const value = fn(); d.exec("COMMIT"); return value; } catch (e) { d.exec("ROLLBACK"); throw e; } }
export function audit(actor: string, action: string, detail: string) { db().prepare("INSERT INTO audit VALUES (?,?,?,?,?)").run(randomUUID(), actor, action, detail.slice(0, 500), new Date().toISOString()); }
export function hasOwner() { return !!db().prepare("SELECT id FROM users LIMIT 1").get(); }
export function users(): AdminUser[] { return db().prepare("SELECT id,name,email,role,createdAt FROM users ORDER BY createdAt").all() as AdminUser[]; }
export function records(kind?: string, published = false): ContentRecord[] {
  const rows = db().prepare("SELECT document FROM content WHERE (? IS NULL OR kind=?) AND (?=0 OR status='published') ORDER BY updatedAt DESC").all(kind || null, kind || null, published ? 1 : 0) as { document: string }[];
  return rows.map(row => JSON.parse(row.document) as ContentRecord).filter(r => !published || (!!r.publishedAt && Date.parse(r.publishedAt) <= Date.now() && (r.kind !== "job" || !r.expiresAt || Date.parse(r.expiresAt) > Date.now())));
}
export function settings(): SiteSettings { const row = db().prepare("SELECT document FROM settings WHERE id=1").get() as { document: string } | undefined; return row ? JSON.parse(row.document) : { siteName: "ATS AI Talent Solutions", tagline: "Connecting talent. Empowering careers.", contactEmail: "contact@atsai.pro", siteUrl: "https://atsai.pro", defaultAuthor: "ATS AI Editorial" }; }
export function media(): MediaRecord[] { return (db().prepare("SELECT id,name,type,size,createdAt FROM media ORDER BY createdAt DESC").all() as Omit<MediaRecord, "url">[]).map(m => ({ ...m, url: `/api/media/${m.id}` })); }
export function activity(): AuditRecord[] { return db().prepare("SELECT * FROM audit ORDER BY createdAt DESC LIMIT 100").all() as AuditRecord[]; }
export function limit(key: string, max: number, windowMs = 900_000) {
  const now = Date.now();
  const row = db().prepare("INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resetAt<? THEN 1 ELSE count+1 END,resetAt=CASE WHEN resetAt<? THEN excluded.resetAt ELSE resetAt END RETURNING count").get(key, now + windowMs, now, now) as { count: number };
  if (row.count > max) throw Object.assign(new Error("Too many attempts. Please try again in 15 minutes."), { status: 429 });
  db().prepare("DELETE FROM rate_limits WHERE resetAt<?").run(now - windowMs);
}

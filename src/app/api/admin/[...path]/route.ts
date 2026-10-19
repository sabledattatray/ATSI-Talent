import { NextResponse } from "next/server";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { assertOrigin, currentUser, currentAdminOrEmployerUser, endSession, hashPassword, requireUser, startSession, tokenHash, verifyPassword } from "@/lib/admin/auth";
import { audit, db, hasOwner, limit, records, transaction, users, workspace } from "@/lib/admin/db";
import { contentSchema, credentials, registration, settingsSchema } from "@/lib/admin/validation";
import type { ContentRecord } from "@/lib/admin/types";
import { z } from "zod";
import { getPendingDuplicateAudits, resolveDuplicateAudit, syncContentToCanonical } from "@/lib/canonical-jobs";

type Context = { params: Promise<{ path: string[] }> };
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function json(request: Request) { if (Number(request.headers.get("content-length")) > 1_000_000) throw Object.assign(new Error("Request is too large."), { status: 413 }); const text = await request.text(); if (Buffer.byteLength(text) > 1_000_000) throw Object.assign(new Error("Request is too large."), { status: 413 }); try { return JSON.parse(text); } catch { throw Object.assign(new Error("Invalid JSON request."), { status: 400 }); } }
function fail(error: unknown) {
  if (error instanceof z.ZodError) return response({ error: error.issues[0]?.message || "Check your entries.", fields: error.flatten().fieldErrors }, 400);
  const e = error as Error & { status?: number; code?: string };
  if (e.message?.includes("UNIQUE constraint failed")) return response({ error: "That email or URL slug is already in use." }, 409);
  if (e.status) return response({ error: e.message }, e.status);
  console.error("Admin API:", e);
  return response({ error: "The request could not be completed. Please try again." }, 500);
}
export async function GET(_request: Request, context: Context) {
  new URL(_request.url);
  try {
    const route = (await context.params).path.join("/");
    if (route === "setup") return response({ needsSetup: !(await hasOwner()), setupTokenRequired: process.env.NODE_ENV === "production", setupTokenConfigured: (process.env.ATSAI_ADMIN_SETUP_TOKEN || "").length >= 32, authenticated: !!await currentUser() });
    const user = await requireUser();
    if (route === "workspace") return response(await workspace(user));
    if (route === "duplicates") return response({ audits: await getPendingDuplicateAudits() });
    return response({ error: "Not found." }, 404);
  } catch (e) { return fail(e); }
}
export async function POST(request: Request, context: Context) {
  try {
    assertOrigin(request);
    const route = (await context.params).path.join("/");
    if (route === "auth/logout") { await endSession(); return response({ ok: true }); }
    if (route === "auth/login" || route === "auth/signup") {
      const raw = await json(request); const input = route.endsWith("signup") ? registration.parse(raw) : credentials.parse(raw);
      (await limit("auth:global", 60)); (await limit(`auth:${tokenHash(input.email)}`, 12));
      if (route.endsWith("login")) {
        const row = (await db().prepare("SELECT id,password FROM users WHERE email=?").get(input.email)) as { id: string; password: string } | undefined;
        // Equal-cost password work for unknown accounts.
        const valid = await verifyPassword(input.password, row?.password || `${"0".repeat(32)}:${"0".repeat(128)}`);
        if (!row || !valid) return response({ error: "Email or password is incorrect." }, 401);
        await startSession(row.id); (await audit(input.email, "Signed in", "Admin workspace")); return response({ ok: true });
      }
      const signup = registration.parse(raw); const password = await hashPassword(signup.password); const id = randomUUID();
      (await transaction(async () => {
        const first = !(await hasOwner());
        if (first && process.env.NODE_ENV === "production") {
          const expected = process.env.ATSAI_ADMIN_SETUP_TOKEN || ""; const provided = typeof raw.setupToken === "string" ? raw.setupToken : "";
          if (expected.length < 32 || !timingSafeEqual(Buffer.from(tokenHash(expected)), Buffer.from(tokenHash(provided)))) throw Object.assign(new Error("A valid server setup key is required to create the owner."), { status: 403 });
        }
        if (!first) {
          const invitation = (await db().prepare("SELECT email FROM invites WHERE hash=? AND expiresAt>?").get(tokenHash(signup.invite || ""), Date.now())) as { email: string } | undefined;
          if (!invitation || invitation.email !== signup.email) throw Object.assign(new Error("A valid invitation for this email is required."), { status: 403 });
          (await db().prepare("DELETE FROM invites WHERE hash=?").run(tokenHash(signup.invite || "")));
        }
        (await db().prepare("INSERT INTO users VALUES (?,?,?,?,?,?)").run(id, signup.name, signup.email, password, first ? "owner" : "editor", new Date().toISOString()));
        (await audit(signup.email, first ? "Workspace created" : "Team member joined", signup.name));
      }));
      await startSession(id); return response({ ok: true }, 201);
    }
    const user = (route === "media" ? await currentAdminOrEmployerUser() : null) || await requireUser();
    if (route === "content") {
      const value = contentSchema.parse(await json(request));
      const saved = (await transaction(async () => {
        const row = value.id ? (await db().prepare("SELECT document FROM content WHERE id=?").get(value.id)) as { document: string } | undefined : undefined;
        const previous = row ? JSON.parse(row.document) as ContentRecord : null;
        if (value.id && !previous) throw Object.assign(new Error("This record no longer exists."), { status: 404 });
        if (previous && (previous.version !== value.version || previous.kind !== value.kind)) throw Object.assign(new Error("Someone changed this content. Reload before saving to avoid overwriting their work."), { status: 409 });
        const now = new Date().toISOString();
        const record = { ...value, id: previous?.id || randomUUID(), createdAt: previous?.createdAt || now, updatedAt: now, publishedAt: value.status === "published" ? previous?.publishedAt || now : previous?.publishedAt || null, version: (previous?.version || 0) + 1 };
        (await db().prepare("INSERT INTO content VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,document=excluded.document,updatedAt=excluded.updatedAt,version=excluded.version").run(record.id, record.kind, record.slug, record.status, JSON.stringify(record), record.createdAt, now, record.version));
        if (record.kind === "job") {
          await syncContentToCanonical(record as ContentRecord, "platform_admin", "direct_employer");
        }
        (await audit(user.email, previous ? "Content updated" : "Content created", `${record.title} · ${record.status}`)); return record;
      }));
      return response({ record: saved });
    }
    if (route === "duplicates/resolve") {
      await requireUser();
      const value = z.object({
        auditId: z.string().min(1),
        decision: z.enum(["link_authorized", "declare_separate", "dismiss"])
      }).parse(await json(request));
      const res = await resolveDuplicateAudit(value.auditId, value.decision, user.email);
      return response({ ok: true, result: res });
    }
    if (route === "media") {
      (await limit(`upload:${user.id}`, 100));
      if (Number(request.headers.get("content-length")) > 3_200_000) return response({ error: "Images must be no larger than 3 MB." }, 413);
      const form = await request.formData(); const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > 3_145_728) return response({ error: "Choose an image no larger than 3 MB." }, 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg" : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "";
      if (!type) return response({ error: "Use a PNG, JPEG, or WebP image. SVG and executable uploads are not accepted." }, 400);
      const id = randomUUID(); const name = file.name.replace(/[^\w. -]/g, "").slice(0, 140) || "image"; const createdAt = new Date().toISOString();
      (await db().prepare("INSERT INTO media VALUES (?,?,?,?,?,?)").run(id, name, type, bytes.length, bytes, createdAt)); (await audit(user.email, "Image uploaded", name));
      return response({ media: { id, name, type, size: bytes.length, url: `/api/media/${id}`, createdAt } }, 201);
    }
    if (route === "settings") { await requireUser(true); const value = settingsSchema.parse(await json(request)); (await db().prepare("INSERT INTO settings VALUES (1,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document").run(JSON.stringify(value))); (await audit(user.email, "Settings updated", value.siteName)); return response({ ok: true }); }
    if (route === "profile") {
      const raw = await json(request); const name = z.string().trim().min(2).max(80).parse(raw.name);
      if (raw.newPassword) {
        const newPassword = z.string().min(12).max(128).parse(raw.newPassword); const current = z.string().min(1).max(128).parse(raw.currentPassword);
        const row = (await db().prepare("SELECT password FROM users WHERE id=?").get(user.id)) as { password: string };
        (await limit(`password:${user.id}`, 8));
        if (!await verifyPassword(current, row.password)) return response({ error: "Current password is incorrect." }, 400);
        const password = await hashPassword(newPassword);
        (await transaction(async () => { (await db().prepare("UPDATE users SET password=? WHERE id=?").run(password, user.id)); (await db().prepare("DELETE FROM sessions WHERE userId=?").run(user.id)); })); await startSession(user.id);
      }
      (await db().prepare("UPDATE users SET name=? WHERE id=?").run(name, user.id)); (await audit(user.email, "Profile updated", name)); return response({ ok: true });
    }
    if (route === "invites") {
      await requireUser(true); const value = z.object({ email: z.email().transform(v => v.toLowerCase().trim()) }).parse(await json(request));
      if ((await users()).some(u => u.email === value.email)) return response({ error: "This person already has an account." }, 409);
      const token = randomBytes(32).toString("hex");
      (await transaction(async () => { (await db().prepare("DELETE FROM invites WHERE email=?").run(value.email)); (await db().prepare("INSERT INTO invites VALUES (?,?,?)").run(tokenHash(token), value.email, Date.now() + 72 * 3600_000)); (await audit(user.email, "Invitation created", value.email)); }));
      return response({ url: `/admin/signup?invite=${token}&email=${encodeURIComponent(value.email)}`, expiresIn: "72 hours" });
    }
    return response({ error: "Not found." }, 404);
  } catch (e) { return fail(e); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertOrigin(request); const user = await requireUser(); const [kind, id] = (await context.params).path;
    if (!id) return response({ error: "Missing identifier." }, 400);
    if (kind === "content") {
      return await transaction(async () => {
        const row = await db().prepare("SELECT document FROM content WHERE id=?").get(id) as { document: string } | undefined;
        if (!row) return response({ error: "Not found." }, 404);
        // Archive and version increment must commit together with the audit event.
        const record = JSON.parse(row.document) as ContentRecord;
        record.status = "archived"; record.version++; record.updatedAt = new Date().toISOString();
        await db().prepare("UPDATE content SET status='archived',document=?,updatedAt=?,version=? WHERE id=?").run(JSON.stringify(record), record.updatedAt, record.version, id);
        await audit(user.email, "Content archived", record.title);
        return response({ ok: true });
      });
    }
    if (kind === "users") { await requireUser(true); if (id === user.id) return response({ error: "The workspace owner cannot be removed." }, 400); (await db().prepare("DELETE FROM users WHERE id=? AND role='editor'").run(id)); (await audit(user.email, "Team access revoked", id)); return response({ ok: true }); }
    if (kind === "media") {
      if ((await records()).some(r => r.cover === `/api/media/${id}` || JSON.stringify(r.content).includes(`/api/media/${id}`))) return response({ error: "This image is used in content. Remove it from those records first." }, 409);
      (await db().prepare("DELETE FROM media WHERE id=?").run(id)); (await audit(user.email, "Unused image removed", id)); return response({ ok: true });
    }
    return response({ error: "Not found." }, 404);
  } catch (e) { return fail(e); }
}

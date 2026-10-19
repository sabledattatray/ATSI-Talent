import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { AdminUser } from "./types";
import { db } from "./db";
const scrypt = promisify(scryptCallback);
export const COOKIE = "atsai_admin_session";
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const key = await scrypt(password, salt, 64) as Buffer; return `${salt}:${key.toString("hex")}`; }
export async function verifyPassword(password: string, stored: string) { const [salt, hex] = stored.split(":"); const key = await scrypt(password, salt, 64) as Buffer; const expected = Buffer.from(hex, "hex"); return key.length === expected.length && timingSafeEqual(key, expected); }
export async function currentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length !== 64) return null;
  return ((await db().prepare("SELECT u.id,u.name,u.email,u.role,u.createdAt FROM sessions s JOIN users u ON s.userId=u.id WHERE s.hash=? AND s.expiresAt>?").get(tokenHash(token), Date.now())) as AdminUser | undefined) || null;
}
export async function requireUser(owner = false) { const user = await currentUser(); if (!user) throw Object.assign(new Error("Please sign in to continue."), { status: 401 }); if (owner && user.role !== "owner") throw Object.assign(new Error("Only the owner can manage this setting."), { status: 403 }); return user; }
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex"); const expiry = Date.now() + 8 * 60 * 60 * 1000;
  (await db().prepare("DELETE FROM sessions WHERE expiresAt<?").run(Date.now()));
  (await db().prepare("INSERT INTO sessions VALUES (?,?,?)").run(tokenHash(token), userId, expiry));
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiry) });
}
export async function endSession() { const jar = await cookies(); const token = jar.get(COOKIE)?.value; if (token) (await db().prepare("DELETE FROM sessions WHERE hash=?").run(tokenHash(token))); jar.delete(COOKIE); }
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const expected = process.env.ATSAI_ADMIN_ORIGIN || `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`;
  if (!origin || origin !== expected) throw Object.assign(new Error("Request origin is not allowed."), { status: 403 });
}

export const EMPLOYER_COOKIE = "atsai_employer_session";

export async function currentEmployer(): Promise<{ id: string; organizationId: string; name: string; email: string; role: "owner" | "recruiter"; company: string; country: string; website: string } | null> {
  const token = (await cookies()).get(EMPLOYER_COOKIE)?.value;
  if (!token || token.length !== 64) return null;
  return ((await db().prepare("SELECT e.id,e.organizationId,e.name,e.email,e.role,o.name AS company,o.country,o.website FROM ats_employers e JOIN ats_organizations o ON o.id=e.organizationId JOIN ats_sessions s ON s.userId=e.id WHERE s.hash=? AND s.expiresAt>?").get(tokenHash(token), Date.now())) as any) || null;
}

export type UnifiedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmployer: boolean;
  organizationId?: string;
  company?: string;
};

export async function currentAdminOrEmployerUser(): Promise<UnifiedUser | null> {
  const admin = await currentUser();
  if (admin) {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isEmployer: false
    };
  }
  const employer = await currentEmployer();
  if (employer) {
    return {
      id: employer.id,
      name: employer.name,
      email: employer.email,
      role: employer.role,
      isEmployer: true,
      organizationId: employer.organizationId,
      company: employer.company
    };
  }
  return null;
}

export async function requireAdminOrEmployer(owner = false): Promise<UnifiedUser> {
  const user = await currentAdminOrEmployerUser();
  if (!user) throw Object.assign(new Error("Please sign in to continue."), { status: 401 });
  if (owner && user.role !== "owner") throw Object.assign(new Error("Only the owner can manage this setting."), { status: 403 });
  return user;
}


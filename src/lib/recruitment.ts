import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { db, limit, records, transaction, audit } from "@/lib/admin/db";
import { assertOrigin, hashPassword, verifyPassword, tokenHash, requireUser } from "@/lib/admin/auth";
import { extractTextFromBuffer, parseResumeText } from "@/lib/resumeParser";

export type WorkExperience = { id: string; title: string; company: string; location?: string; startDate: string; endDate?: string; current?: boolean; description?: string };
export type Education = { id: string; degree: string; field?: string; institution: string; graduationYear?: string };
export type CandidateProfile = { photoUrl?: string; phone: string; location: string; headline?: string; bio?: string; skills: string; experience: number; certifications?: string; targetRole?: string; employmentType?: string; preferredLocation?: string; noticePeriod?: string; expectedSalary?: string; openToRelocation?: boolean; resumeUrl: string; linkedinUrl?: string; githubUrl?: string; portfolioUrl?: string; workHistory?: WorkExperience[]; educationHistory?: Education[] };
export type Candidate = { id: string; name: string; email: string; profile: CandidateProfile; createdAt: string };
export type Application = { id: string; candidateId: string; jobId: string; jobTitle: string; company: string; status: string; document: string; createdAt: string; updatedAt: string };
export type Inquiry = { id: string; kind: string; name: string; email: string; phone: string; company: string; subject: string; message: string; status: string; createdAt: string; updatedAt: string };
export type Recruiter = { id: string; name: string; email: string; title: string; active: number };
const COOKIE = "atsai_candidate_session";
const text = (max: number) => z.string().trim().max(max);
const email = z.email().max(254).transform(value => value.toLowerCase().trim());
const credentials = z.object({ email, password: z.string().min(12).max(128) });
const registration = credentials.extend({ name: text(80).min(2), consent: z.literal(true), website: text(0).optional() });
const httpsUrl = (label: string) => text(1500).default("").refine(value => { if (!value) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }, `Use a complete HTTPS ${label} link.`);
const mediaOrHttpsUrl = (label: string) => text(1500).default("").refine(value => { if (!value) return true; if (value.startsWith("/api/media/")) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }, `Use a complete HTTPS or uploaded ${label} link.`);
const workItemSchema = z.object({ id: text(50).default(""), title: text(120).default(""), company: text(120).default(""), location: text(120).default(""), startDate: text(50).default(""), endDate: text(50).default(""), current: z.boolean().default(false), description: text(2500).default("") });
const educationItemSchema = z.object({ id: text(50).default(""), degree: text(120).default(""), field: text(120).default(""), institution: text(160).default(""), graduationYear: text(30).default("") });
const profileSchema = z.object({ name: text(80).min(2), photoUrl: mediaOrHttpsUrl("photo"), phone: text(35).default(""), location: text(160).default(""), headline: text(160).default(""), bio: text(4000).default(""), skills: text(2500).default(""), experience: z.coerce.number().min(0).max(60).default(0), certifications: text(2500).default(""), targetRole: text(120).default(""), employmentType: text(60).default(""), preferredLocation: text(160).default(""), noticePeriod: text(60).default(""), expectedSalary: text(80).default(""), openToRelocation: z.boolean().default(false), resumeUrl: httpsUrl("resume"), linkedinUrl: httpsUrl("LinkedIn"), githubUrl: httpsUrl("GitHub"), portfolioUrl: httpsUrl("portfolio or website"), workHistory: z.array(workItemSchema).max(25).default([]), educationHistory: z.array(educationItemSchema).max(20).default([]) });
const inquirySchema = z.object({ kind: z.enum(["contact", "employer", "report", "privacy", "account"]), name: text(80).min(2), email, phone: text(35).default(""), company: text(160).default(""), subject: text(180).min(3), message: text(6000).min(20), consent: z.literal(true), website: text(0).optional() });
const emptyProfile: CandidateProfile = { photoUrl: "", phone: "", location: "", headline: "", bio: "", skills: "", experience: 0, certifications: "", targetRole: "", employmentType: "", preferredLocation: "", noticePeriod: "", expectedSalary: "", openToRelocation: false, resumeUrl: "", linkedinUrl: "", githubUrl: "", portfolioUrl: "", workHistory: [], educationHistory: [] };
export async function candidateUser(): Promise<Candidate | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length !== 64) return null;
  const row = await db().prepare("SELECT c.id,c.name,c.email,c.profile,c.createdAt FROM candidate_accounts c JOIN candidate_sessions s ON s.candidateId=c.id WHERE s.hash=? AND s.expiresAt>?").get(tokenHash(token), Date.now()) as (Omit<Candidate, "profile"> & { profile: string }) | undefined;
  if (!row) return null;
  let parsed: Partial<CandidateProfile> = {};
  try { parsed = JSON.parse(row.profile); } catch {}
  return { ...row, profile: { ...emptyProfile, ...parsed } };
}
export async function requireCandidate() {
  const user = await candidateUser();
  if (!user) throw Object.assign(new Error("Please sign in to your candidate account."), { status: 401 });
  return user;
}
async function startCandidateSession(id: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  await db().prepare("DELETE FROM candidate_sessions WHERE expiresAt<?").run(Date.now());
  await db().prepare("INSERT INTO candidate_sessions VALUES (?,?,?)").run(tokenHash(token), id, expiresAt);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt) });
}
export async function candidateDashboard(user: Candidate) {
  const [applications, saved, jobs] = await Promise.all([
    db().prepare("SELECT id,candidateId,jobId,jobTitle,company,status,createdAt,updatedAt FROM candidate_applications WHERE candidateId=? ORDER BY createdAt DESC").all(user.id),
    db().prepare("SELECT jobId FROM candidate_saved_jobs WHERE candidateId=?").all(user.id) as Promise<{ jobId: string }[]>,
    records("job", true),
  ]);
  return { user, applications: applications as Application[], savedJobs: jobs.filter(job => saved.some(row => row.jobId === job.id)).map(job => ({ id: job.id, title: job.title, slug: job.slug, company: job.company, location: job.location })) };
}
async function json(request: Request) {
  if (Number(request.headers.get("content-length")) > 100_000) throw Object.assign(new Error("Request is too large."), { status: 413 });
  const value = await request.text();
  if (Buffer.byteLength(value) > 100_000) throw Object.assign(new Error("Request is too large."), { status: 413 });
  try { return JSON.parse(value); } catch { throw Object.assign(new Error("Invalid request."), { status: 400 }); }
}
const result = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export function recruitmentError(error: unknown) {
  if (error instanceof z.ZodError) return result({ error: error.issues[0]?.message || "Check your entries." }, 400);
  const e = error as Error & { status?: number };
  if (e.status) return result({ error: e.message }, e.status);
  if (e.message?.includes("UNIQUE constraint failed")) return result({ error: "An account or application already exists for these details." }, 409);
  console.error("Recruitment request failed", e);
  return result({ error: "We could not complete this request. Please try again." }, 500);
}
export async function recruitmentRequest(request: Request, route: string): Promise<Response> {
  // Let Next.js handle its request-time prerender interruption outside our error handler.
  new URL(request.url);
  try {
    if (request.method === "GET") {
      if (route === "me") return result({ user: await candidateUser() });
      if (route === "dashboard") return result(await candidateDashboard(await requireCandidate()));
      if (route === "verify") {
        const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() || "";
        if (!query || query.length > 254) return result({ error: "Enter a recruiter ID or exact work email." }, 400);
        const recruiter = await db().prepare("SELECT id,name,email,title FROM public_recruiters WHERE active=1 AND (lower(email)=? OR lower(id)=?)").get(query, query);
        return result({ verified: !!recruiter, recruiter: recruiter || null });
      }
      if (route === "admin") {
        await requireUser(true);
        const [inquiries, applications, candidates, recruiters] = await Promise.all([
          db().prepare("SELECT * FROM public_inquiries ORDER BY createdAt DESC LIMIT 300").all(),
          db().prepare("SELECT a.*,c.name,c.email FROM candidate_applications a JOIN candidate_accounts c ON c.id=a.candidateId ORDER BY a.createdAt DESC LIMIT 300").all(),
          db().prepare("SELECT id,name,email,profile,createdAt FROM candidate_accounts ORDER BY createdAt DESC LIMIT 300").all(),
          db().prepare("SELECT * FROM public_recruiters ORDER BY name").all(),
        ]);
        return result({ inquiries, applications, candidates, recruiters });
      }
      return result({ error: "Not found." }, 404);
    }
    assertOrigin(request);
    if (route === "auth/logout") {
      const jar = await cookies(); const token = jar.get(COOKIE)?.value;
      if (token) await db().prepare("DELETE FROM candidate_sessions WHERE hash=?").run(tokenHash(token));
      jar.delete(COOKIE); return result({ ok: true });
    }
    if (route === "parse-resume") {
      await requireCandidate();
      const contentType = request.headers.get("content-type") || "";
      let extractedText = "";
      let filename = "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") return result({ error: "Please choose a resume file to upload." }, 400);
        if (file.size > 8 * 1024 * 1024) return result({ error: "File exceeds maximum size of 8 MB." }, 413);
        filename = file.name;
        const bytes = Buffer.from(await file.arrayBuffer());
        extractedText = extractTextFromBuffer(bytes, file.name);
      } else {
        const textBody = await request.text();
        let parsedJson: { text?: string; base64?: string; filename?: string } = {};
        try { parsedJson = JSON.parse(textBody); } catch { parsedJson = { text: textBody }; }
        filename = parsedJson.filename || "";
        if (parsedJson.base64) {
          const bytes = Buffer.from(parsedJson.base64, "base64");
          extractedText = extractTextFromBuffer(bytes, filename);
        } else {
          extractedText = parsedJson.text || "";
        }
      }

      if (!extractedText.trim()) {
        return result({ error: "Could not extract readable text from this file. Ensure the file contains text or paste your resume text." }, 422);
      }

      const parsed = parseResumeText(extractedText);
      return result({ ok: true, parsed, filename });
    }
    if (route === "photo") {
      const user = await requireCandidate();
      await limit(`candidate-photo:${user.id}`, 30);
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string" || !file.size) return result({ error: "Please select an image file to upload." }, 400);
      if (file.size > 5 * 1024 * 1024) return result({ error: "Image exceeds maximum size of 5 MB." }, 413);
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg"
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
        : "";
      if (!type) return result({ error: "Use a PNG, JPEG, or WebP image. SVG and executable uploads are not accepted." }, 400);
      const id = randomUUID();
      const name = file.name.replace(/[^\w. -]/g, "").slice(0, 140) || "profile-photo";
      const createdAt = new Date().toISOString();
      await db().prepare("INSERT INTO media VALUES (?,?,?,?,?,?)").run(id, name, type, bytes.length, bytes, createdAt);
      const photoUrl = `/api/media/${id}`;
      return result({ ok: true, photoUrl });
    }
    const body = await json(request);
    if (route.startsWith("auth/")) {
      const input = credentials.parse(body);
      const fingerprint = tokenHash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local");
      await limit(`candidate-auth-ip:${fingerprint}`, 30);
      await limit(`candidate-auth-email:${tokenHash(input.email)}`, 12);
      if (route === "auth/signup") {
        const value = registration.parse(body); const id = randomUUID(); const password = await hashPassword(value.password); const now = new Date().toISOString();
        await transaction(async () => {
          await db().prepare("INSERT INTO candidate_accounts VALUES (?,?,?,?,?,?,?)").run(id, value.name, value.email, password, JSON.stringify(emptyProfile), now, now);
        });
        await startCandidateSession(id);
        return result({ ok: true }, 201);
      }
      if (route === "auth/login") {
        const row = await db().prepare("SELECT id,password FROM candidate_accounts WHERE email=?").get(input.email) as { id: string; password: string } | undefined;
        const valid = await verifyPassword(input.password, row?.password || `${"0".repeat(32)}:${"0".repeat(128)}`);
        if (!row || !valid) return result({ error: "Email or password is incorrect." }, 401);
        await startCandidateSession(row.id); return result({ ok: true });
      }
      return result({ error: "Not found." }, 404);
    }
    if (route === "inquiries") {
      const value = inquirySchema.parse(body);
      const fingerprint = tokenHash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local");
      await limit(`inquiry-ip:${fingerprint}`, 10);
      await limit(`inquiry-email:${tokenHash(value.email)}`, 5);
      const id = randomUUID(); const now = new Date().toISOString();
      await db().prepare("INSERT INTO public_inquiries VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id, value.kind, value.name, value.email, value.phone, value.company, value.subject, value.message, "new", now, now);
      return result({ ok: true, reference: `ATS-${id.slice(0,8).toUpperCase()}` }, 201);
    }
    if (route.startsWith("admin/")) {
      const owner = await requireUser(true);
      if (route === "admin/status") {
        const value = z.object({ id: text(80).min(1), kind: z.enum(["inquiry", "application"]), status: z.string() }).parse(body);
        const states = value.kind === "inquiry" ? ["new", "in-progress", "resolved"] : ["submitted", "review", "shortlisted", "interview", "offer", "hired", "rejected"];
        if (!states.includes(value.status)) return result({ error: "Choose a valid status." }, 400);
        await transaction(async () => {
          const table = value.kind === "inquiry" ? "public_inquiries" : "candidate_applications";
          const changed = await db().prepare(`UPDATE ${table} SET status=?,updatedAt=? WHERE id=?${value.kind === "application" ? " AND status!='withdrawn'" : ""}`).run(value.status, new Date().toISOString(), value.id);
          if (!changed.changes) throw Object.assign(new Error("This record is unavailable or has been withdrawn."), { status: 409 });
          await audit(owner.email, "Recruitment status updated", `${value.kind} ${value.id}: ${value.status}`);
        });
        return result({ ok: true });
      }
      if (route === "admin/recruiter") {
        const value = z.object({ name: text(80).min(2), email, title: text(120).min(2) }).parse(body);
        const id = randomUUID();
        await db().prepare("INSERT INTO public_recruiters VALUES (?,?,?,?,1)").run(id, value.name, value.email, value.title);
        await audit(owner.email, "Public recruiter added", id);
        return result({ ok: true, id }, 201);
      }
      if (route === "admin/recruiter-status") {
        const value = z.object({ id: text(80).min(1), active: z.boolean() }).parse(body);
        await db().prepare("UPDATE public_recruiters SET active=? WHERE id=?").run(value.active ? 1 : 0, value.id);
        await audit(owner.email, "Recruiter visibility updated", value.id);
        return result({ ok: true });
      }
      return result({ error: "Not found." }, 404);
    }
    const user = await requireCandidate();
    if (route === "profile") {
      const value = profileSchema.parse(body); const { name, ...profile } = value;
      await db().prepare("UPDATE candidate_accounts SET name=?,profile=? WHERE id=?").run(name, JSON.stringify(profile), user.id);
      return result({ ok: true });
    }
    if (route === "password") {
      const value = z.object({ currentPassword: z.string().min(1).max(128), password: z.string().min(12).max(128) }).parse(body);
      await limit(`candidate-password:${user.id}`, 8);
      const row = await db().prepare("SELECT password FROM candidate_accounts WHERE id=?").get(user.id) as { password: string };
      if (!await verifyPassword(value.currentPassword, row.password)) return result({ error: "Current password is incorrect." }, 400);
      const password = await hashPassword(value.password);
      await transaction(async () => {
        await db().prepare("UPDATE candidate_accounts SET password=? WHERE id=?").run(password, user.id);
        await db().prepare("DELETE FROM candidate_sessions WHERE candidateId=?").run(user.id);
      });
      await startCandidateSession(user.id); return result({ ok: true });
    }
    if (route === "saved" || route === "apply") {
      const value = z.object({ jobId: text(80).min(1), consent: z.boolean().optional(), coverLetter: text(6000).default("") }).parse(body);
      return await transaction(async () => {
        const job = (await records("job", true)).find(job => job.id === value.jobId);
        if (!job) return result({ error: "This role is no longer accepting applications." }, 404);
        if (route === "saved") {
          const existing = await db().prepare("SELECT jobId FROM candidate_saved_jobs WHERE candidateId=? AND jobId=?").get(user.id, job.id);
          if (existing) await db().prepare("DELETE FROM candidate_saved_jobs WHERE candidateId=? AND jobId=?").run(user.id, job.id);
          else await db().prepare("INSERT INTO candidate_saved_jobs VALUES (?,?)").run(user.id, job.id);
          return result({ saved: !existing });
        }
        if (job.applicationUrl) return result({ error: "Apply using the employer's external application link." }, 409);
        if (value.consent !== true) return result({ error: "Consent is required for this application." }, 400);
        await limit(`candidate-apply:${user.id}`, 25);
        const id = randomUUID(); const now = new Date().toISOString();
        await db().prepare("INSERT INTO candidate_applications VALUES (?,?,?,?,?,?,?,?,?)").run(id, user.id, job.id, job.title, job.company, "submitted", JSON.stringify({ profile: user.profile, name: user.name, email: user.email, coverLetter: value.coverLetter, consentAt: now }), now, now);
        return result({ ok: true, reference: `APP-${id.slice(0,8).toUpperCase()}` }, 201);
      });
    }
    if (route === "withdraw") {
      const value = z.object({ id: text(80).min(1) }).parse(body);
      const changed = await db().prepare("UPDATE candidate_applications SET status='withdrawn',updatedAt=? WHERE id=? AND candidateId=? AND status NOT IN ('hired','rejected','withdrawn')").run(new Date().toISOString(), value.id, user.id);
      return changed.changes ? result({ ok: true }) : result({ error: "This application cannot be withdrawn." }, 409);
    }
    return result({ error: "Not found." }, 404);
  } catch (error) { return recruitmentError(error); }
}

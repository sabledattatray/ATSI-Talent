import "server-only";
import { changeApplicationStage, recordApplicationEvent } from "@/lib/application-workflow";
import { applicationMailStatus, emailConfiguration, retryApplicationEmail } from "@/lib/notifications";
import { STAGES } from "@/lib/ats-types";
import { storeCandidateResume } from "@/lib/resume-storage";
import { checkCandidatePriorCanonicalApplication } from "@/lib/canonical-jobs";
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
const profileSchema = z.object({ name: text(80).min(2), photoUrl: mediaOrHttpsUrl("photo"), phone: text(35).default(""), location: text(160).default(""), headline: text(160).default(""), bio: text(4000).default(""), skills: text(2500).default(""), experience: z.coerce.number().min(0).max(60).default(0), certifications: text(2500).default(""), targetRole: text(120).default(""), employmentType: text(60).default(""), preferredLocation: text(160).default(""), noticePeriod: text(60).default(""), expectedSalary: text(80).default(""), openToRelocation: z.boolean().default(false), resumeUrl: text(1500).default("").refine(value => !value || /^https:\/\/[^\s]+$/.test(value) || /^\/api\/ats\/resume\/[a-f0-9-]{36}$/.test(value), "Use an HTTPS resume link or your private uploaded resume."), linkedinUrl: httpsUrl("LinkedIn"), githubUrl: httpsUrl("GitHub"), portfolioUrl: httpsUrl("portfolio or website"), workHistory: z.array(workItemSchema).max(25).default([]), educationHistory: z.array(educationItemSchema).max(20).default([]) });
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
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      profile: { ...user.profile },
    },
    applications: (applications as Application[]).map(a => ({
      id: a.id,
      candidateId: a.candidateId,
      jobId: a.jobId,
      jobTitle: a.jobTitle,
      company: a.company,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      document: a.document || "",
    })),
    savedJobs: jobs.filter(job => saved.some(row => row.jobId === job.id)).map(job => ({ id: job.id, title: job.title, slug: job.slug, company: job.company, location: job.location })),
  };
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
      if (route === "tracking") {
        const user = await requireCandidate(); const id = new URL(request.url).searchParams.get("id") || "";
        const app = await db().prepare("SELECT status FROM candidate_applications WHERE id=? AND candidateId=?").get(id, user.id) as { status: string } | undefined;
        if (!app) return result({ error: "Application not found." }, 404);
        const events = await db().prepare("SELECT id,applicationId,kind,stage,message,createdAt FROM ats_events WHERE applicationId=? AND visibility='candidate' ORDER BY createdAt DESC").all(id);
        const interviews = await db().prepare("SELECT id,applicationId,title,startsAt,timeZone,location,status,createdAt FROM ats_interviews WHERE applicationId=? ORDER BY startsAt").all(id);
        return result({ status: app.status, events, interviews });
      }
      if (route === "admin/notifications") {
        await requireUser(true);const id=new URL(request.url).searchParams.get("applicationId")||"";
        const exists=await db().prepare("SELECT id FROM candidate_applications WHERE id=?").get(id);if(!exists)return result({error:"Application not found."},404);
        return result({configuration:emailConfiguration(),notifications:await applicationMailStatus(id)});
      }
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
      const candidate = await requireCandidate();
      await limit(`candidate-resume:${candidate.id}`, 20);
      const contentType = request.headers.get("content-type") || "";
      let extractedText = "";
      let filename = "";
      let resumeBytes: Buffer | undefined;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") return result({ error: "Please choose a resume file to upload." }, 400);
        if (file.size > 8 * 1024 * 1024) return result({ error: "File exceeds maximum size of 8 MB." }, 413);
        filename = file.name;
        const bytes = Buffer.from(await file.arrayBuffer());
        resumeBytes = bytes;
        extractedText = await extractTextFromBuffer(bytes, file.name);
      } else {
        if (Number(request.headers.get("content-length")) > 12_000_000) return result({ error: "Resume request is too large." }, 413);
        const textBody = await request.text();
        if (Buffer.byteLength(textBody) > 12_000_000) return result({ error: "Resume request is too large." }, 413);
        let parsedJson: { text?: string; base64?: string; filename?: string } = {};
        try { parsedJson = JSON.parse(textBody); } catch { parsedJson = { text: textBody }; }
        if (!parsedJson || typeof parsedJson !== "object" || (parsedJson.text !== undefined && typeof parsedJson.text !== "string") || (parsedJson.base64 !== undefined && typeof parsedJson.base64 !== "string") || (parsedJson.filename !== undefined && typeof parsedJson.filename !== "string")) return result({ error: "Please provide resume text or a valid resume file." }, 400);
        filename = parsedJson.filename || "";
        if (parsedJson.base64) {
          const bytes = Buffer.from(parsedJson.base64, "base64");
          resumeBytes = bytes;
          extractedText = await extractTextFromBuffer(bytes, filename);
        } else {
          extractedText = parsedJson.text || "";
        }
      }

      if (!extractedText.trim()) {
        return result({ error: "Could not extract readable text from this file. Ensure the file contains text or paste your resume text." }, 422);
      }

      if (typeof extractedText !== "string" || extractedText.length > 150_000) return result({ error: "Please provide resume text of 150,000 characters or fewer." }, 413);
      if (extractedText.replace(/[^\p{L}\p{N}]/gu, "").length < 30) return result({ error: "Please provide more readable resume text." }, 422);
      const parsed = parseResumeText(extractedText);
      if (resumeBytes) parsed.resumeUrl = await storeCandidateResume(candidate.id, resumeBytes, filename);
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
      if (route === "admin/notifications/retry") {
        const value=z.object({id:text(80),applicationId:text(80)}).parse(body);
        await retryApplicationEmail(value.id,value.applicationId);return result({ok:true});
      }
      if (route === "admin/status") {
        const value=z.object({id:text(80).min(1),kind:z.enum(["inquiry","application"]),status:z.string(),updatedAt:text(40).optional(),message:text(2000).default("")}).parse(body);
        if(value.kind==="application"){
          if(!STAGES.includes(value.status as typeof STAGES[number]))return result({error:"Choose a valid status."},400);
          await changeApplicationStage({id:value.id,status:value.status as typeof STAGES[number],updatedAt:value.updatedAt,message:value.message,actor:owner.email});
        }else{
          if(!["new","in-progress","resolved"].includes(value.status))return result({error:"Choose a valid status."},400);
          await transaction(async()=>{const changed=await db().prepare("UPDATE public_inquiries SET status=?,updatedAt=? WHERE id=?").run(value.status,new Date().toISOString(),value.id);if(!changed.changes)throw Object.assign(new Error("Request not found."),{status:404});await audit(owner.email,"Recruitment request updated",value.id);});
        }
        return result({ok:true});
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
      if (route === "admin/delete") {
        const value = z.object({
          id: text(80).min(1),
          kind: z.enum(["application", "inquiry", "candidate", "recruiter"]),
        }).parse(body);

        if (value.kind === "application") {
          await transaction(async () => {
            await db().prepare("DELETE FROM ats_notifications WHERE applicationId=?").run(value.id);
            await db().prepare("DELETE FROM ats_interviews WHERE applicationId=?").run(value.id);
            await db().prepare("DELETE FROM ats_events WHERE applicationId=?").run(value.id);
            const changed = await db().prepare("DELETE FROM candidate_applications WHERE id=?").run(value.id);
            if (!changed.changes) throw Object.assign(new Error("Application not found."), { status: 404 });
            await audit(owner.email, "Application deleted", value.id);
          });
          return result({ ok: true, message: "Application deleted successfully." });
        }

        if (value.kind === "inquiry") {
          await transaction(async () => {
            const changed = await db().prepare("DELETE FROM public_inquiries WHERE id=?").run(value.id);
            if (!changed.changes) throw Object.assign(new Error("Inquiry not found."), { status: 404 });
            await audit(owner.email, "Inquiry deleted", value.id);
          });
          return result({ ok: true, message: "Inquiry deleted successfully." });
        }

        if (value.kind === "candidate") {
          await transaction(async () => {
            const apps = await db().prepare("SELECT id FROM candidate_applications WHERE candidateId=?").all(value.id) as { id: string }[];
            for (const a of apps) {
              await db().prepare("DELETE FROM ats_notifications WHERE applicationId=?").run(a.id);
              await db().prepare("DELETE FROM ats_interviews WHERE applicationId=?").run(a.id);
              await db().prepare("DELETE FROM ats_events WHERE applicationId=?").run(a.id);
            }
            await db().prepare("DELETE FROM candidate_applications WHERE candidateId=?").run(value.id);
            await db().prepare("DELETE FROM candidate_sessions WHERE candidateId=?").run(value.id);
            await db().prepare("DELETE FROM candidate_saved_jobs WHERE candidateId=?").run(value.id);
            await db().prepare("DELETE FROM ats_resumes WHERE candidateId=?").run(value.id);
            const changed = await db().prepare("DELETE FROM candidate_accounts WHERE id=?").run(value.id);
            if (!changed.changes) throw Object.assign(new Error("Candidate not found."), { status: 404 });
            await audit(owner.email, "Candidate account deleted", value.id);
          });
          return result({ ok: true, message: "Candidate account deleted successfully." });
        }

        if (value.kind === "recruiter") {
          await transaction(async () => {
            const changed = await db().prepare("DELETE FROM public_recruiters WHERE id=?").run(value.id);
            if (!changed.changes) throw Object.assign(new Error("Recruiter not found."), { status: 404 });
            await audit(owner.email, "Public recruiter deleted", value.id);
          });
          return result({ ok: true, message: "Recruiter deleted successfully." });
        }
      }
      if (route === "admin/edit-application") {
        const schema = z.object({
          id: text(80).min(1),
          jobTitle: text(160).min(2),
          candidateName: text(80).min(2).optional(),
          candidateEmail: email.optional(),
          headline: text(160).default(""),
          skills: text(2500).default(""),
          experience: z.coerce.number().min(0).max(60).default(0),
          location: text(160).default(""),
          phone: text(35).default(""),
          noticePeriod: text(60).default(""),
          coverLetter: text(6000).default(""),
          resumeUrl: text(1500).default(""),
          portfolioUrl: text(1500).default(""),
        });
        const val = schema.parse(body);

        await transaction(async () => {
          const app = await db().prepare("SELECT * FROM candidate_applications WHERE id=?").get(val.id) as Application | undefined;
          if (!app) throw Object.assign(new Error("Application not found."), { status: 404 });

          let doc: { profile: CandidateProfile; name?: string; email?: string; coverLetter?: string; consentAt?: string } = {
            profile: { phone: "", location: "", skills: "", experience: 0, resumeUrl: "" },
            coverLetter: "",
          };
          try { doc = JSON.parse(app.document); } catch {}

          doc.coverLetter = val.coverLetter;
          if (!doc.profile) doc.profile = { phone: "", location: "", skills: "", experience: 0, resumeUrl: "" };
          doc.profile.phone = val.phone;
          doc.profile.location = val.location;
          doc.profile.headline = val.headline;
          doc.profile.skills = val.skills;
          doc.profile.experience = val.experience;
          doc.profile.noticePeriod = val.noticePeriod;
          doc.profile.resumeUrl = val.resumeUrl;
          doc.profile.portfolioUrl = val.portfolioUrl;

          if (val.candidateName) doc.name = val.candidateName;
          if (val.candidateEmail) doc.email = val.candidateEmail;

          const now = new Date().toISOString();
          await db().prepare("UPDATE candidate_applications SET jobTitle=?, document=?, updatedAt=? WHERE id=?").run(val.jobTitle, JSON.stringify(doc), now, val.id);

          if (val.candidateName) {
            await db().prepare("UPDATE candidate_accounts SET name=? WHERE id=?").run(val.candidateName, app.candidateId);
          }

          await audit(owner.email, "Application updated", val.id);
        });

        return result({ ok: true, message: "Application updated successfully." });
      }
      if (route === "admin/edit-inquiry") {
        const schema = z.object({
          id: text(80).min(1),
          name: text(80).min(2),
          email,
          phone: text(35).default(""),
          company: text(160).default(""),
          subject: text(180).min(3),
          message: text(6000).min(5),
          status: z.enum(["new", "in-progress", "resolved"]),
        });
        const val = schema.parse(body);

        await transaction(async () => {
          const now = new Date().toISOString();
          const changed = await db().prepare(
            "UPDATE public_inquiries SET name=?, email=?, phone=?, company=?, subject=?, message=?, status=?, updatedAt=? WHERE id=?"
          ).run(val.name, val.email, val.phone, val.company, val.subject, val.message, val.status, now, val.id);
          if (!changed.changes) throw Object.assign(new Error("Inquiry not found."), { status: 404 });
          await audit(owner.email, "Inquiry updated", val.id);
        });

        return result({ ok: true, message: "Inquiry updated successfully." });
      }
      if (route === "admin/edit-candidate") {
        const schema = z.object({
          id: text(80).min(1),
          name: text(80).min(2),
          headline: text(160).default(""),
          skills: text(2500).default(""),
          experience: z.coerce.number().min(0).max(60).default(0),
          location: text(160).default(""),
          phone: text(35).default(""),
          resumeUrl: text(1500).default(""),
        });
        const val = schema.parse(body);

        await transaction(async () => {
          const cand = await db().prepare("SELECT profile FROM candidate_accounts WHERE id=?").get(val.id) as { profile: string } | undefined;
          if (!cand) throw Object.assign(new Error("Candidate not found."), { status: 404 });
          let prof: Partial<CandidateProfile> = {};
          try { prof = JSON.parse(cand.profile); } catch {}
          prof.headline = val.headline;
          prof.skills = val.skills;
          prof.experience = val.experience;
          prof.location = val.location;
          prof.phone = val.phone;
          prof.resumeUrl = val.resumeUrl;

          await db().prepare("UPDATE candidate_accounts SET name=?, profile=? WHERE id=?").run(val.name, JSON.stringify(prof), val.id);
          await audit(owner.email, "Candidate account updated", val.id);
        });

        return result({ ok: true, message: "Candidate updated successfully." });
      }
      if (route === "admin/edit-recruiter") {
        const schema = z.object({
          id: text(80).min(1),
          name: text(80).min(2),
          email,
          title: text(120).min(2),
          active: z.boolean(),
        });
        const val = schema.parse(body);

        await transaction(async () => {
          const changed = await db().prepare("UPDATE public_recruiters SET name=?, email=?, title=?, active=? WHERE id=?").run(val.name, val.email, val.title, val.active ? 1 : 0, val.id);
          if (!changed.changes) throw Object.assign(new Error("Recruiter not found."), { status: 404 });
          await audit(owner.email, "Public recruiter updated", val.id);
        });

        return result({ ok: true, message: "Recruiter updated successfully." });
      }
      return result({ error: "Not found." }, 404);
    }
    const user = await requireCandidate();
    if (route === "profile") {
      const value = profileSchema.parse(body); const { name, ...profile } = value;
      return await transaction(async () => {
        if (profile.resumeUrl.startsWith("/api/ats/resume/")) {
          const file = await db().prepare("SELECT id FROM ats_resumes WHERE id=? AND candidateId=?").get(profile.resumeUrl.split("/").at(-1)!, user.id);
          if (!file) return result({ error: "Choose a resume uploaded to your own account." }, 400);
        }
        await db().prepare("UPDATE candidate_accounts SET name=?,profile=? WHERE id=?").run(name, JSON.stringify(profile), user.id);
        return result({ ok: true });
      });
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
      const value = z.object({
        jobId: text(80).min(1),
        consent: z.boolean().optional(),
        coverLetter: text(6000).default(""),
        confirmDuplicateSubmission: z.boolean().optional().default(false)
      }).parse(body);
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

        const priorCheck = await checkCandidatePriorCanonicalApplication(user.id, job.id);
        if (priorCheck.hasPrior && !priorCheck.isSameRecruiter && !value.confirmDuplicateSubmission) {
          return result({
            warning: "duplicate_canonical_application",
            error: `Notice: You previously applied to this vacancy at ${job.company} via ${priorCheck.priorAgencyName} on ${new Date(priorCheck.priorApplicationDate!).toLocaleDateString("en-IN")}.`,
            message: `You previously applied to this opening at ${job.company} via ${priorCheck.priorAgencyName} on ${new Date(priorCheck.priorApplicationDate!).toLocaleDateString("en-IN")}. Submitting through this recruiter will create a separate candidate submission for the same underlying opening.`,
            priorAgencyName: priorCheck.priorAgencyName,
            priorApplicationDate: priorCheck.priorApplicationDate
          }, 409);
        }

        await limit(`candidate-apply:${user.id}`, 25);
        const id = randomUUID(); const now = new Date().toISOString();
        const canonicalId = priorCheck.canonicalJobId || null;
        await db().prepare("INSERT INTO candidate_applications (id, candidateId, jobId, jobTitle, company, status, document, createdAt, updatedAt, canonicalJobId) VALUES (?,?,?,?,?,?,?,?,?,?)").run(id, user.id, job.id, job.title, job.company, "submitted", JSON.stringify({ profile: user.profile, name: user.name, email: user.email, coverLetter: value.coverLetter, consentAt: now }), now, now, canonicalId);
        await recordApplicationEvent(id,"submitted","submitted","Your application was received.","candidate",user.id);
        return result({ ok: true, reference: `APP-${id.slice(0,8).toUpperCase()}` }, 201);
      });
    }
    if (route === "withdraw") {
      const value = z.object({ id: text(80).min(1) }).parse(body);
      return await transaction(async () => {
        const now = new Date().toISOString();
        const changed = await db().prepare("UPDATE candidate_applications SET status='withdrawn',updatedAt=? WHERE id=? AND candidateId=? AND status NOT IN ('hired','rejected','withdrawn')").run(now, value.id, user.id);
        if (!changed.changes) return result({ error: "This application cannot be withdrawn." }, 409);
        await recordApplicationEvent(value.id,"withdrawn","withdrawn","You withdrew this application.","candidate",user.id);
        return result({ ok: true });
      });
    }
    return result({ error: "Not found." }, 404);
  } catch (error) { return recruitmentError(error); }
}

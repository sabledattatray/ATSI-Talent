import { validTextStyle } from "./text-style";
import { z } from "zod";
const text = (max: number) => z.string().trim().max(max);
const url = text(2000).refine(v => !v || /^https?:\/\/[^\s]+$/i.test(v), "Use a complete HTTP or HTTPS URL.");
const mediaUrl = text(2000).refine(v => !v || /^\/api\/media\/[a-f0-9-]+$/.test(v), "Select an uploaded image from the media library.");
export const credentials = z.object({ email: z.email().max(254).transform(v => v.toLowerCase().trim()), password: z.string().min(12, "Use at least 12 characters.").max(128) });
export const registration = credentials.extend({ name: text(80).min(2), invite: text(128).optional() });
const nodeTypes = new Set(["doc", "paragraph", "text", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "hardBreak", "horizontalRule", "image", "table", "tableRow", "tableCell", "tableHeader"]);
export function validDocument(value: unknown): boolean {
  let count = 0;
  function walk(v: unknown, depth: number): boolean {
    if (++count > 10_000 || depth > 24 || !v || typeof v !== "object") return false;
    const n = v as { type?: string; text?: unknown; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: unknown[] };
    if (!n.type || !nodeTypes.has(n.type) || (n.text !== undefined && typeof n.text !== "string")) return false;
    if (n.attrs !== undefined && (!n.attrs || typeof n.attrs !== "object" || Array.isArray(n.attrs))) return false;
    if (n.type === "heading" && ![1, 2, 3].includes(Number(n.attrs?.level))) return false;
    if (n.type === "image" && (!n.attrs?.src || !mediaUrl.safeParse(n.attrs.src).success)) return false;
    if (n.marks !== undefined && (!Array.isArray(n.marks) || n.marks.some(m => !m || typeof m !== "object" || !["bold", "italic", "underline", "strike", "code", "link", "highlight", "textStyle"].includes(m.type) || (m.type === "link" && !url.safeParse(m.attrs?.href).success) || (m.type === "textStyle" && !validTextStyle(m.attrs))))) return false;
    return n.content === undefined || (Array.isArray(n.content) && n.content.every(child => walk(child, depth + 1)));
  }
  return (value as { type?: string })?.type === "doc" && walk(value, 0);
}
function documentText(value: unknown): string {
  const node = value as { text?: string; content?: unknown[] };
  return node.text || (node.content || []).map(documentText).join(" ");
}
export const contentSchema = z.object({
  id: text(80), kind: z.enum(["job", "post"]), title: text(180).min(3, "Add a title of at least 3 characters."), slug: z.string().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."), status: z.enum(["draft", "published", "archived"]),
  googleJobs: z.boolean().optional().default(false), jobOriginalDate: text(10).optional().default(""), jobCity: text(120).optional().default(""), jobRegion: text(120).optional().default(""), jobCountry: text(2).optional().default(""),
  excerpt: text(600), category: text(80).min(1), cover: mediaUrl, content: z.unknown().refine(validDocument, "Invalid editor document."), seoTitle: text(70), seoDescription: text(170), author: text(80).min(1), featured: z.boolean(), company: text(120), location: text(160), workMode: z.enum(["Remote", "Hybrid", "On-site"]), employmentType: z.enum(["Full-time", "Contract", "Part-time", "Executive"]), experienceMin: z.number().min(0).max(60), experienceMax: z.number().min(0).max(60), salaryMin: z.number().min(0).max(1e9), salaryMax: z.number().min(0).max(1e9), skills: text(1200), expiresAt: z.string().refine(v => !v || Number.isFinite(Date.parse(v)), "Enter a valid expiry date."), applicationUrl: url, version: z.number().int().min(0),
}).superRefine((v, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (v.kind === "job" && v.googleJobs) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.jobOriginalDate) || !Number.isFinite(Date.parse(v.jobOriginalDate)) || new Date(v.jobOriginalDate).toISOString().slice(0,10) !== v.jobOriginalDate || Date.parse(v.jobOriginalDate) > Date.now()) issue("jobOriginalDate", "Enter the employer’s original posting date, today or earlier.");
    if (!/^[A-Z]{2}$/.test(v.jobCountry)) issue("jobCountry", "Enter a two-letter country code such as IN.");
    if (v.workMode !== "Remote" && !v.jobCity) issue("jobCity", "Enter the actual work city for Google Jobs.");
  }
  if (v.kind === "job") { if (!v.company) issue("company", "Add the hiring company."); if (!v.location) issue("location", "Add the job location."); if (v.experienceMin > v.experienceMax) issue("experienceMin", "Minimum experience must not exceed maximum."); if (v.salaryMin > v.salaryMax) issue("salaryMin", "Minimum salary must not exceed maximum."); if (v.status === "published" && v.expiresAt && Date.parse(v.expiresAt) <= Date.now()) issue("expiresAt", "Published jobs must have a future closing date."); }
  if (v.status === "published") { if (!validDocument(v.content) || documentText(v.content).trim().length < 20) issue("content", "Write the content before publishing."); if (!v.excerpt) issue("excerpt", "Add a short summary before publishing."); }
});
export const settingsSchema = z.object({ siteName: text(100).min(2), tagline: text(180), contactEmail: z.email(), siteUrl: url.refine(v => !!v, "Enter your website URL."), defaultAuthor: text(80).min(2) });

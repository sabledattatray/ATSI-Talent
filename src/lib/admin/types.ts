export type Role = "owner" | "editor";
export type Status = "draft" | "published" | "archived";
export type AdminUser = { id: string; name: string; email: string; role: Role; createdAt: string };
export type RichNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: RichNode[] };
export type ContentRecord = {
  id: string; kind: "job" | "post"; title: string; slug: string; status: Status;
  excerpt: string; category: string; cover: string; content: RichNode;
  seoTitle: string; seoDescription: string; author: string; featured: boolean;
  company: string; location: string; workMode: string; employmentType: string;
  experienceMin: number; experienceMax: number; salaryMin: number; salaryMax: number;
  salaryCurrency?: string; salaryPeriod?: "YEAR" | "MONTH" | "WEEK" | "DAY" | "HOUR"; employerVerified?: boolean;
  skills: string; expiresAt: string; applicationUrl: string;
  googleJobs?: boolean; jobOriginalDate?: string; jobCity?: string; jobRegion?: string; jobCountry?: string;
  employerPublishedAt?: string; importedAt?: string; lastVerifiedAt?: string;
  isIndependentCurated?: boolean; legalDisclaimer?: string; requisitionId?: string;
  isExpired?: boolean;
  createdAt: string; updatedAt: string; publishedAt: string | null; version: number;
};
export type MediaRecord = { id: string; name: string; type: string; size: number; createdAt: string; url: string };
export type AuditRecord = { id: string; actor: string; action: string; detail: string; createdAt: string };
export type SiteSettings = { siteName: string; tagline: string; contactEmail: string; siteUrl: string; defaultAuthor: string };
export type WorkspaceData = { user: AdminUser; records: ContentRecord[]; media: MediaRecord[]; users: AdminUser[]; activity: AuditRecord[]; settings: SiteSettings };
export function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
export function blankRecord(kind: "job" | "post", author: string): ContentRecord {
  const today = new Date().toISOString().slice(0, 10);
  return { id: "", kind, title: "", slug: "", status: "draft", excerpt: "", category: kind === "job" ? "Technology" : "Career insights", cover: "", content: { type: "doc", content: [{ type: "paragraph" }] }, seoTitle: "", seoDescription: "", author, featured: false, company: "", location: "", workMode: "Hybrid", employmentType: "Full-time", experienceMin: 0, experienceMax: 5, salaryMin: 0, salaryMax: 0, skills: "", expiresAt: "", jobOriginalDate: kind === "job" ? today : "", employerPublishedAt: kind === "job" ? `${today}T00:00:00Z` : "", isExpired: false, applicationUrl: "", createdAt: "", updatedAt: "", publishedAt: null, version: 0 };
}

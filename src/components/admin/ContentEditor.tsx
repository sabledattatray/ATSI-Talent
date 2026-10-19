"use client";

import { CURRENCIES, INDUSTRIES } from "@/lib/ats-types";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, ChevronDown, ExternalLink, Globe2, ImagePlus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { slugify, type ContentRecord, type MediaRecord, type RichNode } from "@/lib/admin/types";
import { toCountryCode } from "@/lib/countries";
import { normalizeWorkModeValue, normalizeEmploymentTypeValue } from "@/lib/admin/validation";
import { RichEditor } from "./RichEditor";
import { RichContent } from "./RichContent";

function sanitizeDocumentText(text: string): string {
  if (!text) return "";
  if (!/<[a-z/]|class=|data-qa=/i.test(text)) return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<br\s*[\/]?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|lt|gt|#39|#x27);/gi, m => {
      const map: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&#39;": "'", "&#x27;": "'" };
      return map[m.toLowerCase()] || " ";
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(?:class|data-qa|data-[\w-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function sanitizeRichNodes(node: RichNode): RichNode | null {
  if (!node) return node;
  if (node.type === "text") {
    const raw = typeof node.text === "string" ? node.text : "";
    if (/<[a-z/]|class=|data-qa=/i.test(raw)) {
      const cleaned = sanitizeDocumentText(raw);
      if (!cleaned || /^(?:class=|data-qa=|<div|<span)/i.test(cleaned)) {
        return null;
      }
      return { ...node, text: cleaned };
    }
    return node;
  }

  if (Array.isArray(node.content)) {
    const newContent: RichNode[] = [];
    for (const child of node.content) {
      const sanitized = sanitizeRichNodes(child);
      if (sanitized) {
        if ((sanitized.type === "paragraph" || sanitized.type === "heading") && Array.isArray(sanitized.content) && sanitized.content.length === 0) {
          continue;
        }
        newContent.push(sanitized);
      }
    }
    return { ...node, content: newContent };
  }

  return node;
}

export function sanitizeRecordForEditor(r: ContentRecord): ContentRecord {
  const isJob = r.kind === "job";
  const jobCountry = isJob && r.jobCountry ? toCountryCode(r.jobCountry, "IN") : (r.jobCountry || "");
  const workMode = isJob ? normalizeWorkModeValue(r.workMode) : (r.workMode || "Hybrid");
  const employmentType = isJob ? normalizeEmploymentTypeValue(r.employmentType) : (r.employmentType || "Full-time");
  const content = r.content ? ((sanitizeRichNodes(r.content) as RichNode) || r.content) : r.content;
  const seoTitle = r.seoTitle ? (r.seoTitle.length > 70 ? r.seoTitle.slice(0, 70).trim() : r.seoTitle) : (r.seoTitle || "");
  const seoDescription = r.seoDescription ? (r.seoDescription.length > 170 ? r.seoDescription.slice(0, 170).trim() : r.seoDescription) : (r.seoDescription || "");
  return {
    ...r,
    seoTitle,
    seoDescription,
    jobCountry,
    workMode,
    employmentType,
    content
  };
}

export function isRecordExpired(r: { kind?: string; expiresAt?: string; isExpired?: boolean }): boolean {
  if (r.kind && r.kind !== "job") return false;
  if (r.isExpired === true) return true;
  return Boolean(r.expiresAt && Number.isFinite(Date.parse(r.expiresAt)) && Date.parse(r.expiresAt) <= Date.now());
}

export function Badge({ status, isExpired }: { status: string; isExpired?: boolean }) {
  if (isExpired) return <span className="cms-badge cms-badge-expired"><i />Expired</span>;
  return <span className={`cms-badge cms-badge-${status}`}><i />{status[0].toUpperCase() + status.slice(1)}</span>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="cms-field">{label}{children}{hint && <small>{hint}</small>}</label>;
}

async function defaultSaveApi(path: string, body?: unknown, method = "POST") {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Something went wrong.");
  }
  return result;
}

export interface ContentEditorProps {
  record: ContentRecord;
  media: MediaRecord[];
  onUpload: (f: File) => Promise<MediaRecord | null>;
  onClose: () => void;
  onPreview: (r: ContentRecord) => void;
  onSaved: (r: ContentRecord) => Promise<void>;
  onSave?: (value: ContentRecord, status: ContentRecord["status"]) => Promise<ContentRecord>;
  saveEndpoint?: string;
}

export function ContentEditor({ record, media, onUpload, onClose, onPreview, onSaved, onSave, saveEndpoint }: ContentEditorProps) {
  const [value, setValue] = useState(() => sanitizeRecordForEditor(record));
  const [saved, setSaved] = useState(() => JSON.stringify(sanitizeRecordForEditor(record)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverPicker, setCoverPicker] = useState(false);
  const [tab, setTab] = useState("content");

  const dirty = JSON.stringify(value) !== saved;

  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    const navigate = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.("a[href]");
      if (dirty && a && !window.confirm("You have unsaved changes. Leave this editor?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);

  const set = useCallback(<K extends keyof ContentRecord>(key: K, v: ContentRecord[K]) => setValue(old => ({ ...old, [key]: v })), []);

  async function save(status: ContentRecord["status"]) {
    setSaving(true);
    setError("");
    try {
      const cleanRecord = sanitizeRecordForEditor(value);
      const payload: ContentRecord = {
        ...cleanRecord,
        slug: cleanRecord.slug || slugify(cleanRecord.title),
        status
      };
      let savedRecord: ContentRecord;
      if (onSave) {
        savedRecord = await onSave(payload, status);
      } else {
        const r = await defaultSaveApi(saveEndpoint || "content", payload);
        savedRecord = r.record;
      }
      const sanitizedSaved = sanitizeRecordForEditor(savedRecord);
      setValue(sanitizedSaved);
      setSaved(JSON.stringify(sanitizedSaved));
      await onSaved(sanitizedSaved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const isJob = value.kind === "job";

  function leave() {
    if (!dirty || window.confirm("You have unsaved changes. Leave this editor?")) onClose();
  }

  return (
    <div className="cms-compose">
      <div className="cms-compose-top">
        <button className="cms-back-link" onClick={leave}>
          <ArrowLeft size={16} />{isJob ? "Job postings" : "Blog & insights"}
        </button>
        <span className="cms-save-status">
          <span className={dirty ? "cms-dirty-dot" : "cms-live-dot"} />
          {saving ? "Saving…" : dirty ? "Unsaved changes" : value.id ? `Saved ${new Date(value.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "New draft"}
        </span>
      </div>

      <div className="cms-page-heading">
        <div>
          <div className="cms-eyebrow">{isJob ? "MAKE YOUR NEXT GREAT CONNECTION" : "YOUR IDEAS DESERVE A GREAT HOME"}</div>
          <h1>{value.id ? isJob ? "Edit job posting" : "Edit article" : isJob ? "Create a job posting" : "Write something great"}<span className="cms-title-dot">.</span></h1>
        </div>
        <div className="cms-heading-actions">
          <button className="cms-btn cms-secondary" onClick={() => onPreview(value)}>
            <ExternalLink size={16} />Preview
          </button>
          <button className="cms-btn cms-secondary" disabled={saving} onClick={() => {
            if (value.status !== "published" || window.confirm("Unpublish this content and save it as a private draft?")) void save("draft");
          }}>
            {value.status === "published" ? "Unpublish to draft" : "Save draft"}
          </button>
          <button className="cms-btn cms-primary" disabled={saving} onClick={() => void save("published")}>
            {saving ? "Saving…" : value.status === "published" ? "Update published" : "Publish"}<ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {error && <div className="cms-alert" role="alert">{error}</div>}

      <div className="cms-compose-layout">
        <div className="cms-compose-main">
          <section className="cms-panel cms-title-panel">
            <Field label={isJob ? "Job title" : "Article title"}>
              <input
                className="cms-title-input"
                value={value.title}
                maxLength={180}
                onChange={e => {
                  const title = e.target.value;
                  setValue(old => ({
                    ...old,
                    title,
                    slug: old.id || old.slug !== slugify(old.title) ? old.slug : slugify(title)
                  }));
                }}
                placeholder={isJob ? "e.g. Senior Data Analyst" : "Give your story a memorable title…"}
              />
            </Field>
            <div className="cms-slug-field">
              <Globe2 size={14} />
              <span>/{isJob ? "jobs" : "blog"}/</span>
              <input aria-label="URL slug" value={value.slug} onChange={e => set("slug", e.target.value)} placeholder="your-url-slug" />
            </div>
          </section>

          {isJob && (
            <section className="cms-panel cms-form-panel">
              <h2>The role, at a glance</h2>
              <div className="cms-two-cols">
                <Field label="Hiring company">
                  <input value={value.company} onChange={e => set("company", e.target.value)} placeholder="Company name" />
                </Field>
                <Field label="Location">
                  <input value={value.location} onChange={e => set("location", e.target.value)} placeholder="City, region, country" />
                </Field>
                <Field label="Work arrangement">
                  <select value={value.workMode} onChange={e => set("workMode", e.target.value)}>
                    {["Remote", "Hybrid", "On-site"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Employment type">
                  <select value={value.employmentType} onChange={e => set("employmentType", e.target.value)}>
                    {["Full-time", "Contract", "Part-time", "Executive", "Temporary", "Internship", "Volunteer"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Minimum experience (years)">
                  <input type="number" min={0} max={60} value={value.experienceMin} onChange={e => set("experienceMin", +e.target.value)} />
                </Field>
                <Field label="Maximum experience (years)">
                  <input type="number" min={0} max={60} value={value.experienceMax} onChange={e => set("experienceMax", +e.target.value)} />
                </Field>
                <Field label="Currency">
                  <select value={value.salaryCurrency || "INR"} onChange={e => set("salaryCurrency", e.target.value)}>
                    {CURRENCIES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Pay period">
                  <select value={value.salaryPeriod || "YEAR"} onChange={e => set("salaryPeriod", e.target.value as ContentRecord["salaryPeriod"])}>
                    {["YEAR", "MONTH", "WEEK", "DAY", "HOUR"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Minimum compensation">
                  <input type="number" min={0} value={value.salaryMin} onChange={e => set("salaryMin", +e.target.value)} />
                </Field>
                <Field label="Maximum compensation">
                  <input type="number" min={0} value={value.salaryMax} onChange={e => set("salaryMax", +e.target.value)} />
                </Field>
              </div>

              <Field label="Skills" hint="Separate skills with commas.">
                <input value={value.skills} onChange={e => set("skills", e.target.value)} placeholder="Add skills relevant to this role" />
              </Field>

              <Field label="Application URL" hint="Optional. Link to your hiring platform’s application form.">
                <input type="url" value={value.applicationUrl} onChange={e => set("applicationUrl", e.target.value)} placeholder="https://your-company.com/apply" />
              </Field>

              <div className="cms-two-cols">
                <Field label="Posting date" hint="Date when this job was officially posted or opened.">
                  <input
                    type="date"
                    value={(value.employerPublishedAt || value.jobOriginalDate || (value.publishedAt ? value.publishedAt.slice(0, 10) : "") || "").slice(0, 10)}
                    onChange={e => {
                      const d = e.target.value;
                      setValue(old => ({
                        ...old,
                        employerPublishedAt: d ? `${d}T00:00:00Z` : "",
                        jobOriginalDate: d || "",
                        publishedAt: old.publishedAt || (d ? `${d}T00:00:00Z` : null)
                      }));
                    }}
                  />
                </Field>
                <Field label="Expiry date / Application deadline" hint="Date after which this job is marked as Expired.">
                  <input
                    type="date"
                    value={value.expiresAt ? value.expiresAt.slice(0, 10) : ""}
                    onChange={e => {
                      const d = e.target.value;
                      set("expiresAt", d ? `${d}T23:59:59+05:30` : "");
                    }}
                  />
                </Field>
              </div>

              {isRecordExpired(value) && (
                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px" }}>
                  <span className="cms-badge cms-badge-expired"><i />Expired</span>
                  <span>The expiry date has passed. This job posting is marked with the <strong>Expired</strong> tag.</span>
                </div>
              )}
            </section>
          )}

          <section className="cms-panel cms-writing-panel">
            <div className="cms-writing-head">
              <h2>{isJob ? "Job description" : "The story"}</h2>
              <div className="cms-segment">
                <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>Write</button>
                <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>Preview</button>
              </div>
            </div>
            {tab === "content" ? (
              <RichEditor value={value.content} onChange={v => set("content", v)} media={media} onUpload={onUpload} />
            ) : (
              <div className="cms-inline-preview"><RichContent document={value.content} /></div>
            )}
          </section>

          {isJob && (
            <section className="cms-panel cms-form-panel">
              <h2>Google Jobs details</h2>
              <p className="cms-muted">Use confirmed employer facts only. For shared external vacancies, use the original employer posting date. Remote means fully remote. These details must match the visible job description.</p>
              <label className="cms-check">
                <input type="checkbox" checked={!!value.googleJobs} onChange={e => set("googleJobs", e.target.checked)} />
                Enable Google Jobs structured data — I have confirmed these job details
              </label>
              <div className="cms-two-cols">
                <Field label="Original employer posting date">
                  <input type="date" value={value.jobOriginalDate || ""} onChange={e => set("jobOriginalDate", e.target.value)} />
                </Field>
                <Field label="Country code" hint="Two letters, e.g. IN for India. For remote jobs, the eligible applicant country.">
                  <input maxLength={2} value={value.jobCountry || ""} onChange={e => set("jobCountry", e.target.value.toUpperCase())} placeholder="IN" />
                </Field>
                <Field label="Work city">
                  <input value={value.jobCity || ""} onChange={e => set("jobCity", e.target.value)} placeholder="Bengaluru" />
                </Field>
                <Field label="State / region">
                  <input value={value.jobRegion || ""} onChange={e => set("jobRegion", e.target.value)} placeholder="Karnataka" />
                </Field>
              </div>
            </section>
          )}

          <section className="cms-panel cms-form-panel">
            <div className="cms-panel-head">
              <div>
                <h2>Search engine preview</h2>
                <p>Help the right people find your content.</p>
              </div>
              <Search size={20} />
            </div>
            <Field label="SEO title" hint={`${value.seoTitle.length}/70 characters`}>
              <input maxLength={70} value={value.seoTitle} onChange={e => set("seoTitle", e.target.value)} placeholder={value.title || "Page title"} />
            </Field>
            <Field label="Meta description" hint={`${value.seoDescription.length}/170 characters`}>
              <textarea rows={3} maxLength={170} value={value.seoDescription} onChange={e => set("seoDescription", e.target.value)} placeholder="A useful, concise summary for search results." />
            </Field>
            <div className="cms-seo-preview">
              <span>atsai.pro › {isJob ? "jobs" : "blog"} › {value.slug || "your-slug"}</span>
              <strong>{value.seoTitle || value.title || "Your page title"}</strong>
              <p>{value.seoDescription || value.excerpt || "Your page description will appear here."}</p>
            </div>
          </section>
        </div>

        <aside className="cms-compose-aside">
          <section className="cms-panel cms-form-panel">
            <div className="cms-panel-head">
              <h2>Publishing</h2>
              <Badge status={value.status} isExpired={isRecordExpired(value)} />
            </div>
            <Field label="Category / department">
              <input value={value.category} onChange={e => set("category", e.target.value)} list="cms-categories" />
              <datalist id="cms-categories">
                {(isJob ? INDUSTRIES : ["Career insights", "Hiring guides", "Industry trends", "Interview tips", "Company news"]).map(v => <option key={v} value={v} />)}
              </datalist>
            </Field>
            <Field label="Author">
              <input value={value.author} onChange={e => set("author", e.target.value)} maxLength={80} />
            </Field>
            <label className="cms-checkbox">
              <input type="checkbox" checked={value.featured} onChange={e => set("featured", e.target.checked)} />
              <span>Feature this {isJob ? "opportunity" : "article"}</span>
            </label>
            <div className="cms-publishing-note">
              <ShieldCheck size={16} />
              <span>{value.status === "published" ? "Published content is visible on your website." : "Drafts are private until you publish."}</span>
            </div>
          </section>

          <section className="cms-panel cms-form-panel">
            <h2>Cover image</h2>
            <p>Make a thoughtful first impression.</p>
            {value.cover ? (
              <div className="cms-cover-choice">
                <img src={value.cover} alt="Selected cover" />
                <button className="cms-icon-btn" aria-label="Remove cover" onClick={() => set("cover", "")}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="cms-cover-empty">
                <ImagePlus size={27} />
                <span>A visual worth a second look</span>
              </div>
            )}
            <button className="cms-btn cms-secondary cms-full" onClick={() => setCoverPicker(!coverPicker)}>
              Choose from library <ChevronDown size={15} />
            </button>
            <label className="cms-upload-mini">
              Or upload an image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const m = await onUpload(file);
                    if (m) set("cover", m.url);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {coverPicker && (
              <div className="cms-media-picker">
                {media.map(m => (
                  <button key={m.id} type="button" title={m.name} onClick={() => { set("cover", m.url); setCoverPicker(false); }}>
                    <img src={m.url} alt={m.name} />
                  </button>
                ))}
                {!media.length && <small>Upload your first image above.</small>}
              </div>
            )}
          </section>

          <section className="cms-panel cms-form-panel">
            <h2>Short summary</h2>
            <p>{isJob ? "Give candidates a clear introduction." : "A little context to draw readers in."}</p>
            <textarea
              aria-label="Short summary"
              rows={5}
              maxLength={600}
              value={value.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              placeholder="What should someone know at a glance?"
            />
            <small className="cms-character-count">{value.excerpt.length}/600 characters</small>
          </section>

          <div className="cms-editor-tip">
            <Sparkles size={18} />
            <p>
              <strong>A small tip</strong>
              {isJob ? "Be specific about the role, expectations, and what makes the opportunity meaningful." : "Write for one person. Keep it useful, clear, and unmistakably yours."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

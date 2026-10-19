"use client";

import { matchSkills } from "@/lib/skill-match";
import { currencyForCountry } from "@/lib/countries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FilePenLine,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X
} from "lucide-react";
import {
  STAGES,
  STAGE_LABELS,
  type EmployerWorkspace as Workspace,
  type Applicant,
  type ApplicantDocument
} from "@/lib/ats-types";
import { blankRecord, type ContentRecord, type MediaRecord } from "@/lib/admin/types";
import BrandLogo from "@/components/common/BrandLogo";
import "./ats.css";
import "@/components/admin/admin.css";
import { ApplicationStatusEditor } from "./ApplicationStatusEditor";
import { EmailDelivery } from "./EmailDelivery";
import { subscribeToApplicationUpdates } from "@/lib/application-live";
import { ContentEditor, Badge as ContentBadge, isRecordExpired } from "@/components/admin/ContentEditor";
import { RichContent } from "@/components/admin/RichContent";
import { JobIntelligence } from "@/components/admin/JobIntelligence";

async function api(path: string, body?: unknown) {
  const r = await fetch(`/api/ats/${path}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Please try again.");
  return data;
}

const stamp = (value: string, zone?: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    ...(zone ? { timeZone: zone } : {})
  }).format(new Date(value));

const nav = [
  { key: "overview", name: "Overview", icon: LayoutDashboard },
  { key: "jobs", name: "Jobs", icon: BriefcaseBusiness },
  { key: "job-intelligence", name: "Job Intelligence", icon: Sparkles },
  { key: "pipeline", name: "Hiring pipeline", icon: Users },
  { key: "interviews", name: "Interviews", icon: CalendarDays },
  { key: "team", name: "Team & settings", icon: Settings2 }
];

export function EmployerWorkspace({ initial }: { initial: Workspace }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<ContentRecord | null>(null);
  const [preview, setPreview] = useState<ContentRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState("");
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    setData(await api("workspace"));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToApplicationUpdates(
      "employer",
      () => {
        if (!busy) void refresh().catch(() => {});
      },
      setConnected
    );
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !busy) void refresh().catch(() => {});
    }, 15000);
    const focus = () => {
      if (!busy) void refresh().catch(() => {});
    };
    window.addEventListener("focus", focus);
    return () => {
      unsubscribe();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, busy]);

  const modalOpen = Boolean(selected || preview);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>(".ats-modal, .cms-modal");
    dialog?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setPreview(null);
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]'
        )
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [modalOpen]);

  async function mutate(path: string, body: unknown, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api(path, body);
      await refresh();
      setMessage(success);
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const applications = useMemo(
    () =>
      data.applications.filter(
        a =>
          (!jobFilter || a.jobId === jobFilter) &&
          `${a.name} ${a.email} ${a.jobTitle}`.toLowerCase().includes(search.toLowerCase())
      ),
    [data.applications, jobFilter, search]
  );
  const app = data.applications.find(a => a.id === selected);

  function openApplicant(a: Applicant) {
    setSelected(a.id);
    setNote("");
    setError("");
  }

  function openJob(job?: ContentRecord) {
    setError("");
    if (job) {
      setEdit(job);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const blank = blankRecord("job", data.user.name);
      setEdit({
        ...blank,
        company: data.user.company,
        jobCountry: data.user.country || "IN",
        salaryCurrency: currencyForCountry(data.user.country) || "INR",
        jobOriginalDate: today,
        employerPublishedAt: today,
        author: data.user.name
      });
    }
  }

  async function uploadMedia(file: File): Promise<MediaRecord | null> {
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Image upload failed.");
      setData(d => ({ ...d, media: [result.media, ...(d.media || [])] }));
      setMessage("Image added to library");
      return result.media;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }

  async function saveJobRecord(val: ContentRecord, status: ContentRecord["status"]) {
    const res = await api("jobs/save", { ...val, status });
    return res.record;
  }

  function csv() {
    const rows = [
      ["Reference", "Candidate", "Email", "Job", "Stage", "Applied", "Updated"],
      ...applications.map(a => [a.id, a.name, a.email, a.jobTitle, a.status, a.createdAt, a.updatedAt])
    ];
    const content = rows
      .map(row => row.map(v => '"' + String(v).replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "atsai-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const active = data.applications.filter(a => !["hired", "rejected", "withdrawn"].includes(a.status));

  const displayedJobs = useMemo(() => {
    return data.jobs.filter(j => {
      const matchesSearch = `${j.title} ${j.category} ${j.location}`.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (jobStatusFilter === "all") return true;
      if (jobStatusFilter === "expired") return isRecordExpired(j);
      return j.status === jobStatusFilter;
    });
  }, [data.jobs, jobStatusFilter, search]);

  const jobSearch = (
    <div className="ats-toolbar">
      <label className="ats-search">
        <Search size={17} />
        <input
          aria-label="Search candidates or jobs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search names, email or job titles…"
        />
      </label>
      <select aria-label="Filter by job" value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
        <option value="">All jobs</option>
        {data.jobs.map(j => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>
      <button className="ats-secondary" onClick={csv}>
        <Download size={16} />
        Export CSV
      </button>
    </div>
  );

  return (
    <div className="ats-workspace">
      <aside className="ats-sidebar">
        <div style={{ padding: "0 6px 24px" }}>
          <BrandLogo theme="dark" size="md" href="/" badge="PORTAL" subtitle="EMPLOYER ATS" />
        </div>
        <div className="ats-company">
          <span>{data.user.company.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{data.user.company}</strong>
            <small>Hiring workspace</small>
          </div>
        </div>
        <nav aria-label="Employer workspace">
          {nav.map(item => (
            <button
              key={item.key}
              className={tab === item.key ? "active" : ""}
              onClick={() => {
                setTab(item.key);
                setError("");
              }}
            >
              <item.icon size={18} />
              {item.name}
              {item.key === "pipeline" && <b>{active.length}</b>}
              {item.key === "jobs" && !!data.jobs.length && <b>{data.jobs.length}</b>}
            </button>
          ))}
        </nav>
        <div className="ats-sidebar-bottom"><Link href="/employer/security">Account security</Link>
          <Link href="/jobs" target="_blank">
            <ArrowUpRight size={16} />
            View job board
          </Link>
          <small>
            {data.user.name}
            <br />
            {data.user.role === "owner" ? "Company owner" : "Recruiter"}
          </small>
          <button
            onClick={async () => {
              try {
                await api("auth/logout", {});
                router.replace("/employer/login");
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="ats-main">
        <header className="ats-topbar">
          <span>
            Workspace <ChevronRight size={13} />
            <strong>{nav.find(n => n.key === tab)?.name}</strong>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#059669",
                background: "#ecfdf5",
                padding: "3px 9px",
                borderRadius: "20px",
                border: "1px solid #d1fae5"
              }}
            >
              <span className="ats-tracker-pulse-dot" style={{ width: "6px", height: "6px" }} />{" "}
              {connected ? "Live updates connected" : "Automatic refresh enabled"}
            </span>
            <Link href="/" style={{ color: "#315de8", fontWeight: 600 }}>
              ATSAI Talent Solutions <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>

        <div className="ats-content">
          {edit ? (
            <ContentEditor
              record={edit}
              media={data.media || []}
              onUpload={uploadMedia}
              onClose={() => setEdit(null)}
              onPreview={setPreview}
              onSave={saveJobRecord}
              onSaved={async r => {
                await refresh();
                setEdit(null);
                setMessage(r.status === "published" ? "Opportunity published — now live on ATSAI" : "Your draft has been saved");
              }}
            />
          ) : (
            <>
              <div className="ats-page-heading">
                <div>
                  <span className="ats-kicker">YOUR NEXT GREAT HIRE STARTS HERE</span>
                  <h1>{tab === "overview" ? "Hiring, in focus." : nav.find(n => n.key === tab)?.name}</h1>
                  <p>
                    {tab === "overview"
                      ? "A clear view of your jobs, people, and next steps."
                      : tab === "jobs"
                      ? "Create opportunities, manage posting & expiry dates, and publish roles."
                      : tab === "job-intelligence"
                      ? "AI-powered job import, factual verification, and automated deduplication."
                      : tab === "pipeline"
                      ? "Move people forward, with every decision recorded."
                      : tab === "interviews"
                      ? "Keep your conversations organized across time zones."
                      : "Build your team and manage your account."}
                  </p>
                </div>
                {["overview", "jobs"].includes(tab) && (
                  <button
                    className="ats-primary"
                    onClick={() => {
                      setSelected(null);
                      openJob();
                    }}
                  >
                    <Plus size={17} />
                    Create job
                  </button>
                )}
              </div>

              {error && (
                <div className="ats-error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="ats-success" role="status">
                  <Check size={16} />
                  {message}
                </div>
              )}

              {tab === "overview" && (
                <>
                  <div className="ats-metrics">
                    {[
                      {
                        label: "Published jobs",
                        value: data.jobs.filter(j => j.status === "published" && !isRecordExpired(j)).length,
                        icon: BriefcaseBusiness
                      },
                      {
                        label: "Active applicants",
                        value: active.length,
                        icon: Users
                      },
                      {
                        label: "Upcoming interviews",
                        value: data.interviews.filter(i => i.status === "scheduled" && Date.parse(i.startsAt) > Date.now()).length,
                        icon: CalendarDays
                      },
                      {
                        label: "Hired",
                        value: data.applications.filter(a => a.status === "hired").length,
                        icon: Check
                      }
                    ].map(m => (
                      <article key={m.label}>
                        <m.icon size={19} />
                        <strong>{m.value}</strong>
                        <span>{m.label}</span>
                      </article>
                    ))}
                  </div>
                  <div className="ats-overview-grid">
                    <section className="ats-panel">
                      <div className="ats-panel-heading">
                        <div>
                          <h2>Your hiring funnel</h2>
                          <p>Current applications by stage</p>
                        </div>
                        <button className="ats-link" onClick={() => setTab("pipeline")}>
                          Open pipeline <ChevronRight size={15} />
                        </button>
                      </div>
                      <div className="ats-funnel">
                        {STAGES.filter(s => !["rejected", "withdrawn"].includes(s)).map(s => (
                          <div key={s}>
                            <span>{STAGE_LABELS[s]}</span>
                            <div>
                              <i
                                style={{
                                  width: `${Math.max(
                                    0,
                                    (data.applications.filter(a => a.status === s).length /
                                      Math.max(1, data.applications.length)) *
                                      100
                                  )}%`
                                }}
                              />
                            </div>
                            <strong>{data.applications.filter(a => a.status === s).length}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="ats-panel">
                      <div className="ats-panel-heading">
                        <div>
                          <h2>Recent applications</h2>
                          <p>New people in your pipeline</p>
                        </div>
                      </div>
                      {data.applications.slice(0, 5).map(a => (
                        <button key={a.id} className="ats-person-row" onClick={() => openApplicant(a)}>
                          <span className="ats-avatar">{a.name.slice(0, 2).toUpperCase()}</span>
                          <span>
                            <strong>{a.name}</strong>
                            <small>{a.jobTitle}</small>
                          </span>
                          <span className={`ats-badge ats-stage-${a.status}`}>{STAGE_LABELS[a.status]}</span>
                        </button>
                      ))}
                      {!data.applications.length && (
                        <div className="ats-empty">
                          <Users />
                          <h3>Make room for great people.</h3>
                          <p>Publish your first job. Applications submitted on ATSAI will arrive here.</p>
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}

              {tab === "jobs" && (
                <section className="ats-panel">
                  <div className="ats-panel-heading" style={{ flexWrap: "wrap", gap: "14px" }}>
                    <h2>
                      Job postings <span>{data.jobs.length}</span>
                    </h2>
                    <div className="cms-tabs" style={{ display: "flex", gap: "8px" }}>
                      {["all", "published", "draft", "expired", "archived"].map(s => (
                        <button
                          key={s}
                          className={jobStatusFilter === s ? "active" : ""}
                          onClick={() => setJobStatusFilter(s)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            background: jobStatusFilter === s ? "#1e293b" : "#fff",
                            color: jobStatusFilter === s ? "#fff" : "#475569",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {s === "all" ? "All content" : s === "expired" ? "Expired" : s[0].toUpperCase() + s.slice(1)}
                          <span
                            style={{
                              background: jobStatusFilter === s ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                              padding: "1px 6px",
                              borderRadius: "10px",
                              fontSize: "11px"
                            }}
                          >
                            {
                              data.jobs.filter(r =>
                                s === "all" ? true : s === "expired" ? isRecordExpired(r) : r.status === s
                              ).length
                            }
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!displayedJobs.length ? (
                    <div className="ats-empty">
                      <BriefcaseBusiness />
                      <h3>
                        {jobStatusFilter !== "all" || search
                          ? "No jobs match your filter."
                          : "Your first great hire starts with a role."}
                      </h3>
                      <p>
                        {jobStatusFilter !== "all" || search
                          ? "Try switching to All content or adjusting your search."
                          : "Create a job with our rich editor, set posting and expiry dates, and publish."}
                      </p>
                      <button className="ats-primary" onClick={() => openJob()}>
                        Create a job
                      </button>
                    </div>
                  ) : (
                    <div className="ats-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Job</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Dates</th>
                            <th>Applicants</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedJobs.map(j => {
                            const expired = isRecordExpired(j);
                            return (
                              <tr key={j.id}>
                                <td>
                                  <strong>{j.title}</strong>
                                  <small>
                                    {j.category} · {j.employmentType}
                                  </small>
                                </td>
                                <td>
                                  {j.location}
                                  <small>
                                    {j.workMode} · {j.jobCountry}
                                  </small>
                                </td>
                                <td>
                                  <ContentBadge status={j.status} isExpired={expired} />
                                </td>
                                <td>
                                  <small style={{ display: "block", color: "#64748b" }}>
                                    Posted: {j.employerPublishedAt ? j.employerPublishedAt.slice(0, 10) : j.jobOriginalDate || "—"}
                                  </small>
                                  <small style={{ display: "block", color: expired ? "#dc2626" : "#64748b" }}>
                                    Expires: {j.expiresAt ? j.expiresAt.slice(0, 10) : "Open"}
                                  </small>
                                </td>
                                <td>
                                  <button
                                    className="ats-link"
                                    onClick={() => {
                                      setJobFilter(j.id);
                                      setTab("pipeline");
                                    }}
                                  >
                                    {data.applications.filter(a => a.jobId === j.id).length} applicants
                                  </button>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <button
                                      className="ats-secondary"
                                      title="Edit job"
                                      onClick={() => openJob(j)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="ats-secondary"
                                      title="Preview job"
                                      onClick={() => setPreview(j)}
                                    >
                                      Preview
                                    </button>
                                    {j.status === "published" && (
                                      <Link href={`/jobs/${j.slug}`} target="_blank" className="ats-link">
                                        View <ArrowUpRight size={14} />
                                      </Link>
                                    )}
                                    {j.status !== "archived" && (
                                      <button
                                        className="ats-link"
                                        title="Archive job"
                                        onClick={async () => {
                                          if (
                                            window.confirm(
                                              `Archive “${j.title}”? It will be closed to new applications.`
                                            )
                                          ) {
                                            await mutate(
                                              "jobs/save",
                                              { ...j, status: "archived" },
                                              "Job archived."
                                            );
                                          }
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {tab === "job-intelligence" && (
                <div style={{ marginTop: "6px" }}>
                  <JobIntelligence userRole={data.user.role} />
                </div>
              )}

              {tab === "pipeline" && (
                <>
                  {jobSearch}
                  <div className="ats-board" aria-label="Applicant tracking pipeline">
                    {STAGES.map(s => (
                      <section key={s} className="ats-column">
                        <header>
                          <i className={`ats-dot ats-stage-${s}`} />
                          <h2>{STAGE_LABELS[s]}</h2>
                          <b>{applications.filter(a => a.status === s).length}</b>
                        </header>
                        {applications
                          .filter(a => a.status === s)
                          .map(a => (
                            <button key={a.id} className="ats-applicant-card" onClick={() => openApplicant(a)}>
                              <span className="ats-avatar">{a.name.slice(0, 2).toUpperCase()}</span>
                              <strong>{a.name}</strong>
                              <span>{a.jobTitle}</span>
                              <small>Applied {new Date(a.createdAt).toLocaleDateString()}</small>
                              <span className="ats-card-action">
                                View application <ChevronRight size={14} />
                              </span>
                            </button>
                          ))}
                        {!applications.some(a => a.status === s) && (
                          <div className="ats-column-empty">No applications</div>
                        )}
                      </section>
                    ))}
                  </div>
                </>
              )}

              {tab === "interviews" && (
                <section className="ats-panel">
                  <div className="ats-panel-heading">
                    <div>
                      <h2>Interview schedule</h2>
                      <p>Dates display in each interview’s selected time zone.</p>
                    </div>
                  </div>
                  {data.interviews.map(i => (
                    <article className="ats-interview" key={i.id}>
                      <CalendarDays size={22} />
                      <div>
                        <h3>{i.title}</h3>
                        <p>
                          {data.applications.find(a => a.id === i.applicationId)?.name} ·{" "}
                          {stamp(i.startsAt, i.timeZone)}
                        </p>
                        <small>
                          {i.timeZone} · {i.location}
                        </small>
                      </div>
                      <span className="ats-badge">{i.status}</span>
                      {i.status === "scheduled" && (
                        <button
                          className="ats-secondary"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              "interviews/cancel",
                              { id: i.id },
                              "Interview cancelled. The candidate’s timeline has been updated."
                            )
                          }
                        >
                          Cancel
                        </button>
                      )}
                    </article>
                  ))}
                  {!data.interviews.length && (
                    <div className="ats-empty">
                      <CalendarDays />
                      <h3>Good conversations start here.</h3>
                      <p>Open an application to schedule an interview.</p>
                    </div>
                  )}
                </section>
              )}

              {tab === "team" && (
                <div className="ats-settings-grid">
                  <section className="ats-panel ats-padded">
                    <h2>Your hiring team</h2>
                    {data.team.map(member => (
                      <div className="ats-team-row" key={member.id}>
                        <div>
                          <strong>{member.name}</strong>
                          <small>
                            {member.email} · {member.role}
                          </small>
                        </div>
                        {data.user.role === "owner" && member.id !== data.user.id && (
                          <button
                            disabled={busy}
                            className="ats-link"
                            onClick={() => {
                              if (confirm(`Remove ${member.name} from your team?`))
                                void mutate("team/remove", { id: member.id }, "Team member removed.");
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {data.user.role === "owner" && (
                      <form
                        className="ats-form"
                        onSubmit={async e => {
                          e.preventDefault();
                          const email = new FormData(e.currentTarget).get("email");
                          const result = await mutate(
                            "team/invite",
                            { email },
                            "Invitation created. Share the private link with your colleague."
                          );
                          if (result)
                            setInvite(`${window.location.origin}/employer/accept?token=${result.token}`);
                        }}
                      >
                        <label>
                          Invite a recruiter
                          <input type="email" name="email" required placeholder="colleague@company.com" />
                        </label>
                        <button className="ats-primary" disabled={busy}>
                          Create invitation
                        </button>
                        <small>Invitations expire in 48 hours. Share this link yourself; no email is sent.</small>
                        {invite && (
                          <label>
                            Private invitation link
                            <input readOnly value={invite} onFocus={e => e.target.select()} />
                          </label>
                        )}
                      </form>
                    )}
                  </section>
                  <section className="ats-panel ats-padded">
                    <h2>Account security</h2>
                    <p>Update your password. Other sessions will be signed out.</p>
                    <form
                      className="ats-form"
                      onSubmit={async e => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const result = await mutate(
                          "password",
                          Object.fromEntries(new FormData(form)),
                          "Password updated."
                        );
                        if (result) form.reset();
                      }}
                    >
                      <label>
                        Current password
                        <input type="password" autoComplete="current-password" name="currentPassword" required />
                      </label>
                      <label>
                        New password
                        <input
                          type="password"
                          autoComplete="new-password"
                          name="password"
                          required
                          minLength={12}
                          maxLength={128}
                        />
                      </label>
                      <button className="ats-primary" disabled={busy}>
                        Update password
                      </button>
                    </form>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {preview && (
        <div className="cms-modal-backdrop">
          <section className="cms-modal cms-preview-modal" role="dialog" aria-modal="true" aria-label="Job preview">
            <div className="cms-panel-head">
              <div>
                <span className="cms-eyebrow">JOB PREVIEW</span>
                <p>{preview.status === "published" ? "Published opportunity" : "Private preview · not published"}</p>
              </div>
              <button className="cms-icon-btn" aria-label="Close preview" onClick={() => setPreview(null)}>
                <X size={21} />
              </button>
            </div>
            <span className="cms-editor-category">{preview.category}</span>
            <h1>{preview.title || "Untitled"}</h1>
            <p className="cms-preview-excerpt">{preview.excerpt}</p>
            <div className="cms-preview-byline">
              By {preview.author} · {preview.company} · {preview.location}
            </div>
            {preview.cover && (
              <div className="cms-preview-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.cover} alt={preview.title} />
              </div>
            )}
            <RichContent document={preview.content} />
          </section>
        </div>
      )}

      {/* Application Detail Modal */}
      {app && (
        <div className="ats-modal-backdrop">
          <section
            className="ats-modal ats-application-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicant-name"
          >
            <header>
              <div>
                <span className="ats-kicker">APPLICATION · {app.id.slice(0, 8)}</span>
                <h2 id="applicant-name">{app.name}</h2>
                <p>{app.jobTitle}</p>
              </div>
              <button className="ats-icon-button" aria-label="Close application" onClick={() => setSelected(null)}>
                <X />
              </button>
            </header>
            {error && (
              <div className="ats-error" role="alert">
                {error}
              </div>
            )}
            <ApplicantProfile application={app} job={data.jobs.find(j => j.id === app.jobId)} />
            <section className="ats-detail-section">
              <h3>Hiring decision</h3>
              <ApplicationStatusEditor key={app.id} application={app} scope="employer" onUpdated={refresh} />
              <EmailDelivery key={app.id + app.updatedAt} applicationId={app.id} scope="employer" />
            </section>
            <section className="ats-detail-section">
              <h3>Private team note</h3>
              <form
                className="ats-form"
                onSubmit={async e => {
                  e.preventDefault();
                  const result = await mutate("applications/note", { id: app.id, message: note }, "Internal note added.");
                  if (result) setNote("");
                }}
              >
                <label>
                  Only visible to your hiring team
                  <textarea required rows={3} maxLength={4000} value={note} onChange={e => setNote(e.target.value)} />
                </label>
                <button className="ats-secondary" disabled={busy}>
                  Add note
                </button>
              </form>
            </section>
            {!["hired", "rejected", "withdrawn"].includes(app.status) && (
              <section className="ats-detail-section">
                <h3>Schedule an interview</h3>
                <form
                  className="ats-form"
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      values = Object.fromEntries(new FormData(form));
                    const result = await mutate(
                      "interviews/save",
                      {
                        ...values,
                        applicationId: app.id,
                        startsAt: new Date(String(values.startsAt)).toISOString()
                      },
                      "Interview scheduled. It is now visible in the candidate’s workspace."
                    );
                    if (result) form.reset();
                  }}
                >
                  <label>
                    Interview title
                    <input name="title" required minLength={3} maxLength={160} placeholder="Hiring manager conversation" />
                  </label>
                  <label>
                    Date and time (your local time)
                    <input type="datetime-local" name="startsAt" required />
                  </label>
                  <label>
                    Display time zone
                    <input
                      name="timeZone"
                      required
                      defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                      placeholder="Europe/London"
                    />
                  </label>
                  <label>
                    Meeting link or location
                    <input name="location" required maxLength={1500} placeholder="https://… or office address" />
                  </label>
                  <small>
                    This schedules the interview in ATSAI. The interview details are added to the candidate timeline and queued for email.
                  </small>
                  <button className="ats-primary" disabled={busy}>
                    Schedule interview
                  </button>
                </form>
              </section>
            )}
            <section className="ats-detail-section">
              <h3>Application history</h3>
              <div className="ats-timeline">
                <article>
                  <i />
                  <div>
                    <strong>Application received</strong>
                    <small>{stamp(app.createdAt)}</small>
                  </div>
                </article>
                {data.events
                  .filter(e => e.applicationId === app.id)
                  .map(e => (
                    <article key={e.id}>
                      <i />
                      <div>
                        <strong>
                          {e.kind === "note"
                            ? "Private team note"
                            : e.kind === "interview"
                            ? "Interview update"
                            : "Stage updated"}
                        </strong>
                        <p>{e.message}</p>
                        <small>{stamp(e.createdAt)}</small>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          </section>
        </div>
      )}
    </div>
  );
}

function ApplicantProfile({ application, job }: { application: Applicant; job?: ContentRecord }) {
  let document: ApplicantDocument;
  try {
    document = JSON.parse(application.document);
  } catch {
    return <p>Profile snapshot unavailable.</p>;
  }
  const p = document.profile;
  const { required: jobSkills, matched, score: matchScore } = matchSkills(job?.skills || "", p.skills || "");
  return (
    <section className="ats-detail-section">
      <h3>Application snapshot</h3>
      <p>
        <a href={`mailto:${document.email}`}>{document.email}</a>
        {p.phone && <> · {p.phone}</>}
      </p>
      <p>
        {p.headline}
        {p.location && <> · {p.location}</>}
      </p>
      <p>
        {p.experience} years experience · {p.skills}
      </p>
      {p.bio && <p>{p.bio}</p>}
      {p.resumeUrl && (
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <a
            href={p.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="ats-primary"
            style={{ display: "inline-flex", gap: 8, alignItems: "center", textDecoration: "none" }}
          >
            <Download size={15} />
            <span>Download Candidate Resume / CV</span>
          </a>
        </div>
      )}
      {jobSkills.length > 0 && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", margin: "14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 12, color: "#1e293b" }}>Listed skill overlap: {matchScore}%</strong>
            <span style={{ fontSize: 11, color: matched.length ? "#16a34a" : "#64748b", fontWeight: 600 }}>
              {matched.length} of {jobSkills.length} skills aligned
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {jobSkills.map(s => {
              const isMatch = matched.includes(s);
              return (
                <span
                  key={s}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: isMatch ? "#dcfce7" : "#f1f5f9",
                    color: isMatch ? "#15803d" : "#64748b",
                    border: `1px solid ${isMatch ? "#bbf7d0" : "#e2e8f0"}`
                  }}
                >
                  {isMatch ? "✓ " : ""}
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className="ats-profile-links">
        {[
          ["Resume", p.resumeUrl],
          ["LinkedIn", p.linkedinUrl],
          ["Portfolio", p.portfolioUrl]
        ]
          .filter(([, url]) => url)
          .map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noreferrer">
              {name} <ArrowUpRight size={14} />
            </a>
          ))}
      </div>
      {p.workHistory?.map(w => (
        <article key={w.id}>
          <strong>
            {w.title} · {w.company}
          </strong>
          <small>
            {w.startDate} – {w.current ? "Present" : w.endDate}
          </small>
          <p className="ats-preserve">{w.description}</p>
        </article>
      ))}
      {p.educationHistory?.map(e => (
        <p key={e.id}>
          {e.degree} · {e.institution} {e.graduationYear}
        </p>
      ))}
      {document.coverLetter && (
        <>
          <h3>Cover note</h3>
          <p className="ats-preserve">{document.coverLetter}</p>
        </>
      )}
    </section>
  );
}

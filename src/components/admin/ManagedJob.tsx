import { compensation } from "@/lib/ats-types";
import { StructuredData } from "@/components/common/StructuredData";
import { breadcrumbs, jobPosting } from "@/lib/structured-data";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Building2, MapPin, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { ContentRecord } from "@/lib/admin/types";
import { RichContent } from "./RichContent";
import { JobActions } from "@/components/recruitment/RecruitmentClient";
import "./admin.css";
import "./public.css";

export async function ManagedJob({ job: j }: { job: ContentRecord }) {
  const isIndependent = Boolean(j.isIndependentCurated ?? (!j.employerVerified || (j.author && j.author.includes("Job Intelligence"))));
  const hasExperience = (j.experienceMax > 0) || (j.experienceMin > 0);
  const rawPostingDate = j.employerPublishedAt || j.jobOriginalDate;
  const isExpired = Boolean(j.isExpired || (j.expiresAt && Date.parse(j.expiresAt) <= Date.now()));

  return (
    <div className="cms-public cms-managed-job">
      <StructuredData data={breadcrumbs([{ name: "Jobs", path: "/jobs" }, { name: j.title, path: `/jobs/${j.slug}` }])} />
      <StructuredData data={jobPosting(j)} />
      <Link href="/jobs" className="cms-public-back">
        <ArrowLeft size={16} />
        All opportunities
      </Link>
      <div className="cms-managed-job-layout">
        <article>
          {/* Source Attribution Notice */}
          {isIndependent ? (
            <div
              className="cms-job-attribution-banner"
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                padding: "14px 18px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#334155",
                lineHeight: 1.55
              }}
            >
              <ShieldAlert size={18} style={{ color: "#64748b", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#0f172a" }}>Independent Public Career Summary:</strong>{" "}
                {j.legalDisclaimer ||
                  "This vacancy is independently summarized from the employer's public career listing. ATSAI is not affiliated with or recruiting on behalf of the employer. Apply directly through the official employer website."}
              </div>
            </div>
          ) : (
            <div
              className="cms-job-attribution-banner"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#166534"
              }}
            >
              <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>Verified Career Listing: Sourced directly with verified employer authorization.</span>
            </div>
          )}

          <header>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span className="cms-public-eyebrow">
                {j.category} / {j.employmentType}
              </span>
              {isExpired && (
                <span className="cms-badge cms-badge-expired">
                  <i />Expired / Applications Closed
                </span>
              )}
            </div>
            <h1>{j.title}</h1>
            <div className="cms-job-meta">
              <span>
                <Building2 size={17} />
                {j.company}
              </span>
              <span>
                <MapPin size={17} />
                {j.location}
              </span>
              <span>
                <BriefcaseBusiness size={17} />
                {j.workMode}
              </span>
            </div>
            {j.excerpt && <p>{j.excerpt}</p>}
          </header>

          {j.skills && (
            <div className="cms-job-skills">
              {j.skills
                .split(",")
                .filter(Boolean)
                .map((s) => (
                  <span key={s}>{s.trim()}</span>
                ))}
            </div>
          )}

          <RichContent document={j.content} />
        </article>

        <aside>
          <span className="cms-public-eyebrow">YOUR NEXT CHAPTER</span>
          <h2>Make your next move.</h2>
          <p>Find the work that brings out your best.</p>
          <dl>
            {rawPostingDate && (
              <>
                <dt>Employer posted</dt>
                <dd>
                  {new Date(rawPostingDate + (rawPostingDate.includes("T") ? "" : "T00:00:00Z")).toLocaleDateString(
                    "en-IN",
                    { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }
                  )}
                </dd>
              </>
            )}
            {j.lastVerifiedAt && (
              <>
                <dt>Last verified by ATSAI</dt>
                <dd>
                  {new Date(j.lastVerifiedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </dd>
              </>
            )}
            {j.googleJobs && j.workMode === "Remote" && j.jobCountry && (
              <>
                <dt>Eligible applicant country</dt>
                <dd>{j.jobCountry}</dd>
              </>
            )}
            {j.requisitionId && (
              <>
                <dt>Requisition ID</dt>
                <dd>
                  <code style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    {j.requisitionId}
                  </code>
                </dd>
              </>
            )}
            {hasExperience && (
              <>
                <dt>Experience</dt>
                <dd>
                  {j.experienceMin > 0
                    ? j.experienceMax > j.experienceMin
                      ? `${j.experienceMin}–${j.experienceMax} years`
                      : `${j.experienceMin}+ years`
                    : `Up to ${j.experienceMax} years`}
                </dd>
              </>
            )}
            <dt>Employment</dt>
            <dd>{j.employmentType}</dd>
            {j.salaryMax > 0 && (
              <>
                <dt>Compensation</dt>
                <dd>{compensation(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod)}</dd>
              </>
            )}
            {j.expiresAt && (
              <>
                <dt>Application deadline</dt>
                <dd style={{ color: isExpired ? "#dc2626" : undefined, fontWeight: isExpired ? 600 : undefined }}>
                  {new Date(j.expiresAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                  {isExpired && " (Expired)"}
                </dd>
              </>
            )}
          </dl>
          {isExpired ? (
            <button
              type="button"
              disabled
              className="cms-btn cms-secondary cms-full"
              style={{ opacity: 0.75, cursor: "not-allowed", borderColor: "#fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 600 }}
            >
              Applications Closed (Expired)
            </button>
          ) : (
            <a
              className="cms-btn cms-primary cms-full"
              href={j.applicationUrl || `/candidate/apply/${j.slug}`}
              target={j.applicationUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
            >
              {j.applicationUrl ? "Apply on official employer site" : "Apply for this role"}
              <ArrowUpRight size={16} />
            </a>
          )}
          <JobActions id={j.id} />
          <small>
            {isExpired
              ? "This job posting has reached its application deadline and is no longer accepting new submissions."
              : j.applicationUrl
                ? "Opens the employer's official career destination."
                : "Use your free candidate account to apply and track your progress."}
          </small>
          <div className="cms-job-fee-note">ATS AI does not charge candidates recruitment fees.</div>
        </aside>
      </div>
    </div>
  );
}

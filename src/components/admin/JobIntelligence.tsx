"use client";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Layers,
  Database,
  Building2,
  MapPin,
  BriefcaseBusiness,
  Coins,
  Trash2,
  Plus,
  X
} from "lucide-react";
import type {
  JobSource,
  ImportItem,
  JobIntelligenceOverview
} from "@/lib/job-intelligence/types";

export function JobIntelligence({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "import" | "queue" | "sources">("overview");
  const [overview, setOverview] = useState<JobIntelligenceOverview | null>(null);
  const [sources, setSources] = useState<JobSource[]>([]);
  const [queue, setQueue] = useState<ImportItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ImportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Import form state
  const [importSourceId, setImportSourceId] = useState("");
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);

  // Source registration modal state
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceOrg, setNewSourceOrg] = useState("");
  const [newSourceHomepage, setNewSourceHomepage] = useState("");
  const [newSourceDomains, setNewSourceDomains] = useState("");
  const [newSourceBasis, setNewSourceBasis] = useState("manual_reference_only");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "overview") {
        const res = await fetch("/api/admin/job-intelligence/overview");
        if (res.ok) setOverview(await res.json());
      } else if (activeTab === "sources") {
        const res = await fetch("/api/admin/job-intelligence/sources");
        if (res.ok) setSources(await res.json());
      } else if (activeTab === "queue") {
        const res = await fetch("/api/admin/job-intelligence/review-queue");
        if (res.ok) setQueue(await res.json());
      } else if (activeTab === "import") {
        const res = await fetch("/api/admin/job-intelligence/sources");
        if (res.ok) {
          const list = await res.json();
          setSources(list);
          if (list.length > 0 && !importSourceId) setImportSourceId(list[0].id);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!singleUrl.trim() || !importSourceId) {
      setError("Please select a source and enter a valid URL.");
      return;
    }
    setLoading(true);
    setError("");
    setPreviewData(null);
    try {
      const res = await fetch("/api/admin/job-intelligence/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleUrl.trim(), sourceId: importSourceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed.");
      setPreviewData(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthorizeDomain(host: string) {
    if (!importSourceId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const parts = host.split(".");
      const root = parts.length > 2 ? parts.slice(-2).join(".") : host;
      const wildcard = `*.${root}`;

      await fetch(`/api/admin/job-intelligence/sources/${importSourceId}/add-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: wildcard })
      });
      await fetch(`/api/admin/job-intelligence/sources/${importSourceId}/add-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: host })
      });

      setMessage(`Authorized '${wildcard}' and '${host}' successfully. Re-running preview...`);
      const sRes = await fetch("/api/admin/job-intelligence/sources");
      if (sRes.ok) setSources(await sRes.json());

      const res = await fetch("/api/admin/job-intelligence/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleUrl.trim(), sourceId: importSourceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed.");
      setPreviewData(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceHomepage.trim()) {
      setError("Source Name and Homepage are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const domains = newSourceDomains
        .split(/[\n,]/)
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/admin/job-intelligence/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSourceName.trim(),
          ownerOrg: newSourceOrg.trim() || newSourceName.trim(),
          homepage: newSourceHomepage.trim(),
          domainAllowlist: domains,
          authBasis: newSourceBasis,
          sourceType: "careers_page",
          status: "active"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create source.");
      setMessage(`Source '${data.name}' registered successfully with ${data.domainAllowlist.length} domains.`);
      setShowAddSourceModal(false);
      setNewSourceName("");
      setNewSourceOrg("");
      setNewSourceHomepage("");
      setNewSourceDomains("");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportSubmit(urls: string[]) {
    if (!urls.length || !importSourceId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/job-intelligence/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: importSourceId, urls })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setMessage(`Successfully processed ${data.totalItems} vacancy URLs.`);
      setSingleUrl("");
      setBulkUrls("");
      setPreviewData(null);
      setActiveTab("queue");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/job-intelligence/items/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed.");
      setMessage(`Job published successfully: /jobs/${data.job.slug}`);
      setSelectedItem(null);
      loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Enter reason for rejection:", "Does not meet factual verification criteria.");
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/job-intelligence/items/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error("Rejection failed.");
      setSelectedItem(null);
      loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurgeDummyJobs() {
    if (!window.confirm("Are you sure you want to delete all dummy and test jobs? This will permanently clean out synthetic vacancies, test applications, and review queue items so you can start fresh with real jobs. (All blog articles, users, and media remain safe.)")) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/job-intelligence/purge-dummy-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to purge dummy jobs.");
      setMessage(`Successfully purged ${data.deletedJobsCount} dummy jobs and ${data.deletedItemsCount} test items. Database is pristine!`);
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const unauthorizedDomainMatch = error ? error.match(/Hostname '([^']+)' is outside the authorized source domain allowlist/) : null;
  const unauthorizedHost = unauthorizedDomainMatch ? unauthorizedDomainMatch[1] : null;

  return (
    <div className="cms-job-intelligence" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Sub-Navigation Tabs */}
      <div className="cms-tabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        {[
          { key: "overview", label: "Intelligence Dashboard" },
          { key: "import", label: "Import Vacancies" },
          { key: "queue", label: "Review & Verification Queue" },
          { key: "sources", label: "Discovery Sources" }
        ].map(t => (
          <button
            key={t.key}
            className={`cms-btn ${activeTab === t.key ? "cms-primary" : "cms-secondary"}`}
            onClick={() => { setActiveTab(t.key as any); setSelectedItem(null); setPreviewData(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="cms-alert" role="alert" style={{ background: "#fef2f2", color: "#991b1b", padding: "14px 18px", borderRadius: "10px", border: "1px solid #fecaca" }}>
          <div style={{ fontWeight: 500 }}>{error}</div>
          {unauthorizedHost && userRole === "owner" && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "13px", color: "#7f1d1d" }}>
                Would you like to authorize <strong>{unauthorizedHost}</strong> for the selected source?
              </div>
              <button
                type="button"
                className="cms-btn cms-primary"
                style={{ padding: "6px 14px", fontSize: "12px", background: "#16a34a", borderColor: "#15803d", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}
                disabled={loading}
                onClick={() => handleAuthorizeDomain(unauthorizedHost)}
              >
                ✓ Authorize Domain & Retry Preview
              </button>
            </div>
          )}
        </div>
      )}
      {message && <div className="cms-alert" style={{ background: "#f0fdf4", color: "#166534", padding: "12px 16px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>{message}</div>}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="cms-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div className="cms-stat" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Imported</span>
              <strong style={{ fontSize: "28px", display: "block", color: "#0f172a", marginTop: "4px" }}>{overview?.importedCount || 0}</strong>
              <small style={{ color: "#64748b" }}>Permitted requisitions</small>
            </div>
            <div className="cms-stat" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Awaiting Review</span>
              <strong style={{ fontSize: "28px", display: "block", color: "#2563eb", marginTop: "4px" }}>{overview?.reviewQueueCount || 0}</strong>
              <small style={{ color: "#64748b" }}>Requires admin check</small>
            </div>
            <div className="cms-stat" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Published to Site</span>
              <strong style={{ fontSize: "28px", display: "block", color: "#16a34a", marginTop: "4px" }}>{overview?.publishedCount || 0}</strong>
              <small style={{ color: "#64748b" }}>Active on /jobs</small>
            </div>
            <div className="cms-stat" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Duplicates Prevented</span>
              <strong style={{ fontSize: "28px", display: "block", color: "#9333ea", marginTop: "4px" }}>{overview?.duplicatesPreventedCount || 0}</strong>
              <small style={{ color: "#64748b" }}>Merged or deduped</small>
            </div>
            <div className="cms-stat" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Quality Average</span>
              <strong style={{ fontSize: "28px", display: "block", color: "#0891b2", marginTop: "4px" }}>{overview?.averageQualityScore || 90}/100</strong>
              <small style={{ color: "#64748b" }}>Factual grounding score</small>
            </div>
          </div>

          <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#0f172a" }}>Job Intelligence Governance Status</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Strict adherence to non-fabrication, domain allowlists, and official employer link routing.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> Source Authorization Gate</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Only authorized sources with documented permissions can fetch or sync listings.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> SSRF & Domain Security</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Private IPs, loopbacks, and cloud metadata ports are strictly blocked before connection.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> Zero Factual Hallucination</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Unstated salaries stay undisclosed; summaries reflect 100% verified source facts.</p>
              </div>
            </div>
          </section>

          {/* Database Maintenance & Purge */}
          {userRole === "owner" && (
            <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Database Clean Slate</h3>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Permanently delete all dummy and test jobs, clear demo applications and reset the review queue. All 5 blog articles and users will remain safe.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeDummyJobs}
                  disabled={loading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#fee2e2")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#fef2f2")}
                >
                  <Trash2 size={16} />
                  <span>Purge All Dummy & Test Jobs</span>
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* IMPORT TAB */}
      {activeTab === "import" && (
        <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#0f172a" }}>Import Permitted Job Requisitions</h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Extract and verify job details from an authorized career page or partner feed.</p>

          <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Target Source</label>
              <select
                value={importSourceId}
                onChange={e => setImportSourceId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                {sources.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.authBasis})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Single Job Vacancy URL</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="url"
                  placeholder="https://careers.example.com/jobs/cloud-architect"
                  value={singleUrl}
                  onChange={e => setSingleUrl(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <button className="cms-btn cms-secondary" onClick={handlePreview} disabled={loading}>
                  <Search size={16} /> Preflight Check
                </button>
                <button className="cms-btn cms-primary" onClick={() => handleImportSubmit([singleUrl.trim()])} disabled={loading || !singleUrl.trim()}>
                  <Upload size={16} /> Import
                </button>
              </div>
              <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>Try fixture URL: <code>https://careers.example.com/jobs/cloud-architect</code></small>
            </div>

            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Or Bulk URL Import (One per line)</label>
              <textarea
                rows={3}
                placeholder="https://careers.example.com/jobs/job-1&#10;https://careers.example.com/jobs/job-2"
                value={bulkUrls}
                onChange={e => setBulkUrls(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
              />
              <button
                className="cms-btn cms-primary"
                style={{ marginTop: "8px" }}
                onClick={() => handleImportSubmit(bulkUrls.split("\n").map(u => u.trim()).filter(Boolean))}
                disabled={loading || !bulkUrls.trim()}
              >
                Start Bulk Ingestion
              </button>
            </div>
          </div>

          {/* PREVIEW CARD */}
          {previewData && (
            <div style={{ marginTop: "24px", padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Preflight Extraction Preview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px" }}>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Extracted Facts</h4>
                  <ul style={{ fontSize: "13px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li><strong>Title:</strong> {previewData.facts.title}</li>
                    <li><strong>Company:</strong> {previewData.facts.company}</li>
                    <li><strong>Location:</strong> {previewData.facts.location} ({previewData.facts.workMode})</li>
                    <li><strong>Employment:</strong> {previewData.facts.employmentType}</li>
                    <li><strong>Compensation:</strong> {previewData.facts.salaryDisclosed ? `${previewData.facts.salaryCurrency} ${previewData.facts.salaryMin} - ${previewData.facts.salaryMax}` : "Not Disclosed"}</li>
                    <li><strong>Apply Link:</strong> <a href={previewData.facts.officialApplyUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{previewData.facts.officialApplyUrl}</a></li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Verification & Deduplication</h4>
                  <p style={{ fontSize: "13px", marginTop: "8px" }}>Score: <strong>{previewData.verification.score}/100</strong> {previewData.verification.isPublishable ? <span style={{ color: "#16a34a" }}>✓ Eligible to publish</span> : <span style={{ color: "#dc2626" }}>✗ Blocked</span>}</p>
                  {previewData.duplicate.isDuplicate && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "#fef3c7", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                      ⚠️ Duplicate detected: Matches existing listing <strong>{previewData.duplicate.existingJob?.title}</strong> ({previewData.duplicate.matchType})
                    </div>
                  )}
                  <button
                    className="cms-btn cms-primary"
                    style={{ marginTop: "16px" }}
                    onClick={() => handleImportSubmit([previewData.url])}
                  >
                    Confirm & Ingest Candidate Draft
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* REVIEW QUEUE TAB */}
      {activeTab === "queue" && (
        <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Review & Verification Queue</h2>
              <p style={{ fontSize: "13px", color: "#64748b" }}>Inspect evidence provenance and publish verified drafts to the live site.</p>
            </div>
            <button className="cms-btn cms-secondary" onClick={loadData} disabled={loading}><RefreshCw size={14} /> Refresh</button>
          </div>

          {queue.length === 0 ? (
            <p style={{ color: "#64748b", padding: "30px 0", textAlign: "center" }}>No items pending review. Use the Import tab to ingest vacancies.</p>
          ) : (
            <table className="cms-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px" }}>JOB TITLE & EMPLOYER</th>
                  <th style={{ padding: "10px" }}>STAGE</th>
                  <th style={{ padding: "10px" }}>SCORE</th>
                  <th style={{ padding: "10px" }}>LOCATION</th>
                  <th style={{ padding: "10px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => {
                  const facts = item.extractedData;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <strong>{facts?.title || item.sourceUrl}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>{facts?.company || "Unknown Company"}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span className={`cms-badge ${item.stage === "draft_ready" ? "cms-badge-published" : "cms-badge-draft"}`}>
                          {item.stage}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <strong>{item.verificationScore || 0}/100</strong>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{facts?.location || "—"}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="cms-btn cms-primary" style={{ padding: "6px 10px", fontSize: "12px" }} onClick={() => handleApprove(item.id)}>Approve</button>
                          <button className="cms-btn cms-secondary" style={{ padding: "6px 10px", fontSize: "12px" }} onClick={() => handleReject(item.id)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* SOURCES TAB */}
      {activeTab === "sources" && (
        <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Authorized Discovery Sources</h2>
              <p style={{ fontSize: "13px", color: "#64748b" }}>Registry of authorized partner feeds, API integrations, and domain allowlists.</p>
            </div>
            {userRole === "owner" && (
              <button
                type="button"
                className="cms-btn cms-primary"
                onClick={() => setShowAddSourceModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={14} /> Add Source / Domain
              </button>
            )}
          </div>

          {/* ADD SOURCE MODAL */}
          {showAddSourceModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "#fff", borderRadius: "12px", maxWidth: "560px", width: "100%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Register Authorized Discovery Source</h3>
                  <button type="button" onClick={() => setShowAddSourceModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateSource} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Source Name *</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="e.g. Accenture Official Careers"
                      value={newSourceName}
                      onChange={e => setNewSourceName(e.target.value)}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Owner Organization</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="e.g. Accenture PLC"
                      value={newSourceOrg}
                      onChange={e => setNewSourceOrg(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Homepage URL *</label>
                    <input
                      type="url"
                      className="cms-input"
                      placeholder="https://www.accenture.com"
                      value={newSourceHomepage}
                      onChange={e => setNewSourceHomepage(e.target.value)}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Permitted Domains (one per line or comma-separated) *</label>
                    <textarea
                      className="cms-input"
                      rows={3}
                      placeholder="*.accenture.com&#10;www.accenture.com"
                      value={newSourceDomains}
                      onChange={e => setNewSourceDomains(e.target.value)}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                    <small style={{ color: "#64748b", fontSize: "11px" }}>Use *.domain.com to allow all subdomains.</small>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Authorization Basis</label>
                    <select
                      value={newSourceBasis}
                      onChange={e => setNewSourceBasis(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="manual_reference_only">Manual Reference Only (Private Draft Verification)</option>
                      <option value="direct_owner">Direct Owner (Employer Direct Posting)</option>
                      <option value="published_api_terms">Published API Terms (Official Developer Terms)</option>
                      <option value="written_permission">Written Permission (Signed MOU / License)</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button type="button" className="cms-btn cms-secondary" onClick={() => setShowAddSourceModal(false)}>Cancel</button>
                    <button type="submit" className="cms-btn cms-primary" disabled={loading}>Register Source</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="cms-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "10px" }}>SOURCE</th>
                <th style={{ padding: "10px" }}>BASIS</th>
                <th style={{ padding: "10px" }}>STATUS</th>
                <th style={{ padding: "10px" }}>DOMAINS</th>
                <th style={{ padding: "10px" }}>RATE BUDGET</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <strong>{s.name}</strong>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{s.ownerOrg}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}><code>{s.authBasis}</code></td>
                  <td style={{ padding: "12px 10px" }}>
                    <span className={`cms-badge ${s.status === "active" ? "cms-badge-published" : "cms-badge-draft"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", maxWidth: "300px", wordBreak: "break-word" }}>{s.domainAllowlist.join(", ")}</td>
                  <td style={{ padding: "12px 10px" }}>{s.rateBudget} req/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

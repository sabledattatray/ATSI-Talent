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
  X,
  FileText,
  Clock,
  ShieldCheck,
  Wrench
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
      if (data.failedItems > 0 && data.items) {
        const firstError = data.items.find((i: any) => i.error)?.error || "Some items failed validation.";
        setError(`Import notice: ${data.failedItems} item(s) failed: ${firstError}`);
      } else {
        setMessage(`Successfully processed ${data.totalItems} vacancy URLs. Placed in Review Queue.`);
      }
      setSingleUrl("");
      setBulkUrls("");
      setPreviewData(null);
      setActiveTab("queue");
      const qRes = await fetch("/api/admin/job-intelligence/review-queue");
      if (qRes.ok) setQueue(await qRes.json());
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

  async function handleAuditAndRepairJobs() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/job-intelligence/repair-all-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit & repair failed.");
      setMessage(`Audit & repair complete: Scanned ${data.scannedCount} jobs, repaired ${data.repairedCount} listings, removed ${data.unsupportedClaimsRemoved} unsupported claims.`);
      await loadData();
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
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> 3-Score Validation Gate</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Independent scoring of Source Authenticity, Content Completeness (0-100%), and Publication Rights.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> SSRF & Domain Security</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Private IPs, loopbacks, and cloud metadata ports are strictly blocked before connection.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}><CheckCircle2 size={16} color="#16a34a" /> Zero Factual Hallucination</strong>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Unstated salaries stay undisclosed; summaries reflect 100% verified source facts without artificial defaults.</p>
              </div>
            </div>
          </section>

          {/* Database Maintenance & Repair */}
          {userRole === "owner" && (
            <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Database Maintenance & Integrity</h3>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Audit existing job listings, normalize date provenance, remove unsupported claims, or purge dummy test items.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAuditAndRepairJobs}
                    disabled={loading}
                    className="cms-btn cms-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      fontSize: "13px"
                    }}
                  >
                    <Wrench size={16} />
                    <span>Audit & Repair Existing Listings</span>
                  </button>
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
                    <span>Purge All Dummy Jobs</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* IMPORT TAB */}
      {activeTab === "import" && (
        <section className="cms-panel" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#0f172a" }}>Import Permitted Job Requisitions</h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Extract and verify job details from an authorized career page or partner feed with the 3-Score Validation Gate.</p>

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
              <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                Supports Greenhouse, Lever, Ashby, Workday, and standard Schema.org / HTML career pages.
              </small>
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

          {/* 3-SCORE PREVIEW CARD */}
          {previewData && (
            <div style={{ marginTop: "24px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{previewData.facts.title}</h3>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
                    {previewData.facts.company} · {previewData.facts.location} ({previewData.facts.workMode})
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="cms-btn cms-primary"
                    onClick={() => handleImportSubmit([previewData.url])}
                    disabled={loading}
                  >
                    Confirm & Ingest Candidate Draft
                  </button>
                </div>
              </div>

              {/* THREE INDEPENDENT SCORES */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "20px" }}>
                {/* 1. Source Authenticity */}
                <div style={{ background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Source Authenticity</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    {previewData.verification.authenticityStatus === "Verified" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: "13px" }}>
                        <ShieldCheck size={15} /> Verified
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", background: "#fef3c7", color: "#b45309", fontWeight: 700, fontSize: "13px" }}>
                        <ShieldAlert size={15} /> Unverified (Public)
                      </span>
                    )}
                  </div>
                  <small style={{ display: "block", color: "#64748b", marginTop: "6px", fontSize: "12px" }}>
                    {previewData.verification.authenticityStatus === "Verified"
                      ? "Direct employer license or verified partnership."
                      : "Public career summary with independent attribution."}
                  </small>
                </div>

                {/* 2. Content Completeness */}
                <div style={{ background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Content Completeness</span>
                    <strong style={{ fontSize: "15px", color: previewData.verification.completeness?.isComplete ? "#15803d" : "#b45309" }}>
                      {previewData.verification.completeness?.score ?? previewData.verification.score}%
                    </strong>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${previewData.verification.completeness?.score ?? previewData.verification.score}%`,
                        background: previewData.verification.completeness?.isComplete ? "#16a34a" : "#f59e0b",
                        transition: "width 0.3s ease"
                      }}
                    />
                  </div>
                  <small style={{ display: "block", color: "#64748b", marginTop: "6px", fontSize: "12px" }}>
                    {previewData.verification.completeness?.isComplete ? "✓ Rich role substance extracted" : "⚠️ Incomplete (Sent to review queue)"}
                  </small>
                </div>

                {/* 3. Publication Rights */}
                <div style={{ background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Publication Rights</div>
                  <div style={{ marginTop: "6px" }}>
                    {previewData.verification.publicationRights === "Authorized" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: "13px" }}>
                        ✓ Authorized
                      </span>
                    )}
                    {previewData.verification.publicationRights === "Review" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", background: "#e0e7ff", color: "#4338ca", fontWeight: 700, fontSize: "13px" }}>
                        📋 Review Required
                      </span>
                    )}
                    {previewData.verification.publicationRights === "Blocked" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: "13px" }}>
                        ⛔ Blocked
                      </span>
                    )}
                  </div>
                  <small style={{ display: "block", color: "#64748b", marginTop: "6px", fontSize: "12px" }}>
                    {previewData.verification.publicationRights === "Authorized"
                      ? "Eligible for auto-publishing."
                      : previewData.verification.publicationRights === "Review"
                      ? "Admin manual sign-off required."
                      : "Fails mandatory security or date criteria."}
                  </small>
                </div>
              </div>

              {/* MISSING FIELDS WARNING */}
              {previewData.verification.completeness?.missingFields?.length > 0 && (
                <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "8px", background: "#fffbeb", border: "1px solid #fef3c7", fontSize: "13px", color: "#92400e" }}>
                  <strong>Missing Details:</strong> {previewData.verification.completeness.missingFields.join(", ")}
                </div>
              )}

              {/* DUPLICATE WARNING */}
              {previewData.duplicate?.isDuplicate && (
                <div style={{ marginTop: "12px", padding: "12px 16px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "13px", color: "#92400e" }}>
                  ⚠️ <strong>Duplicate Warning:</strong> Matches existing job <em>{previewData.duplicate.existingJob?.title}</em> ({previewData.duplicate.matchType})
                </div>
              )}

              {/* EXTRACTED FACTS GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                <div style={{ background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase" }}>Core Metadata</h4>
                  <ul style={{ fontSize: "13px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", listStyle: "none", padding: 0 }}>
                    <li><strong>Requisition ID:</strong> {previewData.facts.externalJobId || "Not provided"}</li>
                    <li><strong>Employment Type:</strong> {previewData.facts.employmentType}</li>
                    <li><strong>Compensation:</strong> {previewData.facts.salaryDisclosed ? `${previewData.facts.salaryCurrency} ${previewData.facts.salaryMin} - ${previewData.facts.salaryMax} / ${previewData.facts.salaryPeriod}` : "Not Disclosed by Employer"}</li>
                    <li><strong>Experience:</strong> {previewData.facts.experience || (previewData.facts.experienceMin ? `${previewData.facts.experienceMin}+ years` : "Not specified by employer")}</li>
                    <li><strong>Education:</strong> {previewData.facts.education || "Not specified by employer"}</li>
                    <li><strong>Employer Posted:</strong> {previewData.facts.datePosted || "Not indicated"}</li>
                    <li><strong>Deadline:</strong> {previewData.facts.validThrough || "Not indicated"}</li>
                    <li>
                      <strong>Official Destination:</strong>{" "}
                      <a href={previewData.facts.officialApplyUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", wordBreak: "break-all" }}>
                        {previewData.facts.officialApplyUrl} <ExternalLink size={12} style={{ display: "inline" }} />
                      </a>
                    </li>
                  </ul>
                </div>

                <div style={{ background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase" }}>Extracted Content Sections</h4>
                  <div style={{ fontSize: "13px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <strong>Key Responsibilities ({previewData.facts.responsibilities?.length || 0} items):</strong>
                      {previewData.facts.responsibilities?.length > 0 ? (
                        <ul style={{ margin: "4px 0 0 16px", fontSize: "12px", color: "#475569" }}>
                          {previewData.facts.responsibilities.slice(0, 3).map((r: string, idx: number) => (
                            <li key={idx}>{r}</li>
                          ))}
                          {previewData.facts.responsibilities.length > 3 && (
                            <li style={{ fontStyle: "italic" }}>+ {previewData.facts.responsibilities.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>None extracted</div>
                      )}
                    </div>

                    <div>
                      <strong>Qualifications ({previewData.facts.qualifications?.length || 0} items):</strong>
                      {previewData.facts.qualifications?.length > 0 ? (
                        <ul style={{ margin: "4px 0 0 16px", fontSize: "12px", color: "#475569" }}>
                          {previewData.facts.qualifications.slice(0, 3).map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                          {previewData.facts.qualifications.length > 3 && (
                            <li style={{ fontStyle: "italic" }}>+ {previewData.facts.qualifications.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>None extracted</div>
                      )}
                    </div>

                    {previewData.facts.skills?.length > 0 && (
                      <div>
                        <strong>Extracted Skills:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {previewData.facts.skills.map((s: string) => (
                            <span key={s} style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", color: "#334155" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
              <p style={{ fontSize: "13px", color: "#64748b" }}>Inspect evidence provenance, review 3-score metrics, and approve verified drafts.</p>
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
                  <th style={{ padding: "10px" }}>AUTHENTICITY</th>
                  <th style={{ padding: "10px" }}>COMPLETENESS</th>
                  <th style={{ padding: "10px" }}>RIGHTS</th>
                  <th style={{ padding: "10px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => {
                  const facts = item.extractedData;
                  const v = item.verificationDetails as any;
                  const compScore = v?.completeness?.score ?? item.verificationScore ?? 0;
                  const authStatus = v?.authenticityStatus || (item.stage === "failed" ? "Failed" : "Unverified");
                  const rights = item.stage === "failed" ? "Failed" : v?.publicationRights || (item.stage === "draft_ready" ? "Authorized" : item.stage === "duplicate" ? "Duplicate" : "Review");

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <strong>{facts?.title || item.sourceUrl}</strong>
                        {item.error ? (
                          <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "2px" }}>
                            ⚠️ {item.error}
                          </div>
                        ) : (
                          <div style={{ color: "#64748b", fontSize: "12px" }}>{facts?.company || "Unknown Company"} · {facts?.location || "—"}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: authStatus === "Verified" ? "#dcfce7" : authStatus === "Failed" ? "#fee2e2" : "#fef3c7", color: authStatus === "Verified" ? "#15803d" : authStatus === "Failed" ? "#b91c1c" : "#b45309" }}>
                          {authStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong>{compScore}%</strong>
                          <span style={{ fontSize: "11px", color: compScore >= 65 ? "#16a34a" : "#d97706" }}>
                            {compScore >= 65 ? "✓ Complete" : "⚠️ Incomplete"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: rights === "Authorized" ? "#dcfce7" : rights === "Blocked" || rights === "Failed" ? "#fee2e2" : "#e0e7ff", color: rights === "Authorized" ? "#15803d" : rights === "Blocked" || rights === "Failed" ? "#b91c1c" : "#4338ca" }}>
                          {rights}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {facts && (
                            <button
                              className="cms-btn cms-secondary"
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                              onClick={() => setSelectedItem(item)}
                            >
                              Inspect
                            </button>
                          )}
                          {item.stage !== "failed" && (
                            <button
                              className="cms-btn cms-primary"
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                              onClick={() => handleApprove(item.id)}
                              disabled={rights === "Blocked"}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            className="cms-btn cms-secondary"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => handleReject(item.id)}
                          >
                            {item.stage === "failed" ? "Dismiss" : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ITEM INSPECTION MODAL */}
          {selectedItem && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "#fff", borderRadius: "12px", maxWidth: "720px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                      {selectedItem.extractedData?.title || "Job Inspection"}
                    </h3>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      {selectedItem.extractedData?.company} · {selectedItem.extractedData?.location}
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px" }}>
                  <div style={{ padding: "12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <strong>Official Application URL:</strong>{" "}
                    <a href={selectedItem.extractedData?.officialApplyUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", wordBreak: "break-all" }}>
                      {selectedItem.extractedData?.officialApplyUrl} <ExternalLink size={12} style={{ display: "inline" }} />
                    </a>
                  </div>

                  <div>
                    <strong>Summary / Role Overview:</strong>
                    <p style={{ marginTop: "4px", color: "#475569", lineHeight: 1.5 }}>
                      {selectedItem.extractedData?.summary || selectedItem.extractedData?.descriptionSummary || "No overview extracted"}
                    </p>
                  </div>

                  <div>
                    <strong>Key Responsibilities:</strong>
                    <ul style={{ margin: "4px 0 0 16px", color: "#475569" }}>
                      {selectedItem.extractedData?.responsibilities?.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      )) || <li>None extracted</li>}
                    </ul>
                  </div>

                  <div>
                    <strong>Qualifications:</strong>
                    <ul style={{ margin: "4px 0 0 16px", color: "#475569" }}>
                      {selectedItem.extractedData?.qualifications?.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      )) || <li>None extracted</li>}
                    </ul>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                    <button type="button" className="cms-btn cms-secondary" onClick={() => setSelectedItem(null)}>Close</button>
                    <button type="button" className="cms-btn cms-secondary" style={{ color: "#dc2626" }} onClick={() => handleReject(selectedItem.id)}>Reject</button>
                    <button type="button" className="cms-btn cms-primary" onClick={() => handleApprove(selectedItem.id)}>Approve & Publish</button>
                  </div>
                </div>
              </div>
            </div>
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

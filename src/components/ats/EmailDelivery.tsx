"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Mail, AlertTriangle } from "lucide-react";

type Notification = { id: string; status: string; attempts: number; lastError: string; createdAt: string; sentAt: string | null };
type Data = { configuration: { configured: boolean; message: string }; notifications: Notification[] };
const labels: Record<string, string> = { pending: "Queued", sending: "Sending", sent: "Accepted by email provider", failed: "Retry needed", blocked: "Waiting for email setup" };

export function EmailDelivery({ applicationId, scope }: { applicationId: string; scope: "admin" | "employer" }) {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const root = scope === "admin" ? "/api/recruitment/admin/notifications" : "/api/ats/notifications";
  const refresh = useCallback(() => fetch(`${root}?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" }).then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error); return body as Data; }).then(setData).catch(e => setError(e.message)), [root, applicationId]);
  useEffect(() => { void refresh(); const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 10000); return () => clearInterval(timer); }, [refresh]);
  async function retry(id: string) { setBusy(true); setError(""); try { const r = await fetch(`${root}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, applicationId }) }); const body = await r.json(); if (!r.ok) throw new Error(body.error); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }

  const count = data?.notifications.length || 0;
  const hasIssues = data?.notifications.some(n => ["failed", "blocked"].includes(n.status));

  return (
    <section className="ats-email-delivery" style={{ marginTop: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
      <div 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={16} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
            Candidate email updates
            <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: hasIssues ? "#fee2e2" : "#e0e7ff", color: hasIssues ? "#b91c1c" : "#4338ca", fontSize: 11, fontWeight: 700 }}>
              {count} {count === 1 ? "email" : "emails"}
            </span>
          </span>
        </div>
        <button 
          type="button" 
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: hasIssues ? "#dc2626" : "#2563eb", background: "none", border: "none", cursor: "pointer" }}
        >
          {hasIssues ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={13} /> Action needed
            </span>
          ) : (
            <span>{expanded ? "Hide log" : "View delivery log"}</span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {error && <p role="alert" style={{ color: "#ef4444", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
      {data && !data.configuration.configured && (
        <p className="ats-email-warning" style={{ fontSize: 12, margin: "8px 0 0", color: "#b45309" }}>
          {data.configuration.message} Updates remain queued; no email is marked as sent.
        </p>
      )}

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
          {!data && !error && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Checking delivery…</p>}
          {data?.notifications.map(n => (
            <div key={n.id} className="ats-email-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span>
                <strong style={{ fontSize: 12, color: n.status === "sent" ? "#047857" : "#b45309" }}>
                  {labels[n.status] || n.status}
                </strong>
                <small style={{ display: "block", fontSize: 11, color: "#64748b" }}>
                  {new Date(n.createdAt).toLocaleString()}
                  {n.lastError ? ` · ${n.lastError}` : ""}
                </small>
              </span>
              {["failed", "blocked"].includes(n.status) && data.configuration.configured && (
                <button type="button" className="ats-secondary" disabled={busy} onClick={() => void retry(n.id)}>
                  Retry email
                </button>
              )}
            </div>
          ))}
          {data && !data.notifications.length && (
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>No email updates have been queued for this application yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

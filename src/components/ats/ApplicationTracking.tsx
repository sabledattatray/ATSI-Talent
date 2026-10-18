"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  STAGE_LABELS,
  type Stage,
  type Interview,
  type TrackingEvent,
} from "@/lib/ats-types";
import {
  Check,
  CheckCircle2,
  Calendar,
  Video,
  MapPin,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import "./ats.css";
import { subscribeToApplicationUpdates } from "@/lib/application-live";

type Tracking = {
  status: Stage;
  events: TrackingEvent[];
  interviews: Interview[];
};

const PIPELINE_STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: "submitted", label: "Applied", hint: "Logged in ATS" },
  { key: "review", label: "In Review", hint: "Recruiter screening" },
  { key: "shortlisted", label: "Shortlisted", hint: "Hiring team queue" },
  { key: "interview", label: "Interview", hint: "Interview stage" },
  { key: "interviewed", label: "Interviewed", hint: "Interview completed" },
  { key: "selected", label: "Selected", hint: "Selected for next steps" },
  { key: "offer", label: "Offer", hint: "Offer stage" },
  { key: "hired", label: "Hired", hint: "Hiring decision recorded" },
];

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  submitted: "Your application was received. Updates recorded by the hiring team will appear here.",
  review: "The hiring team marked your application as in review.",
  shortlisted: "The hiring team shortlisted your application. Interview details will appear below when scheduled.",
  interview: "Your application is at the interview stage. Review any scheduled appointments below.",
  interviewed: "The hiring team recorded your interview as completed. Updates on their decision will appear here.",
  selected: "The hiring team selected your application. Review their message for the next steps.",
  offer: "The hiring team moved your application to the offer stage. Refer to their messages for the actual offer details.",
  hired: "The hiring team marked your application as hired. Contact them for your start date and onboarding steps.",
  rejected: "The hiring team marked this application as not selected. You can still apply for other published opportunities.",
  withdrawn: "You withdrew this application and it is no longer active for this role.",
};

export function ApplicationTracking({ id }: { id: string }) {
  const [snapshot, setSnapshot] = useState<{ id: string; tracking: Tracking } | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const data = snapshot?.id === id ? snapshot.tracking : null;
  const error = failure?.id === id ? failure.message : "";
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("");

  const request = useRef<{ controller: AbortController; id: string } | null>(null);
  const load = useCallback(() => {
    request.current?.controller.abort();
    const controller = new AbortController();
    request.current = { controller, id };
    return fetch(`/api/recruitment/tracking?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not retrieve tracking status.");
      return body as Tracking;
    }).then(body => {
      if (controller.signal.aborted || request.current?.controller !== controller) return;
      setSnapshot({ id, tracking: body });
      setFailure(null);
      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }).catch((error: unknown) => {
      if (controller.signal.aborted || request.current?.controller !== controller) return;
      setFailure({ id, message: (error as Error).message });
    }).finally(() => {
      if (!controller.signal.aborted && request.current?.controller === controller) setRefreshing(false);
    });
  }, [id]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToApplicationUpdates("candidate", () => { void load(); }, setConnected);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 12000);
    return () => {
      request.current?.controller.abort();
      clearInterval(timer);
      unsubscribe();
    };
  }, [load]);

  if (error) {
    return (
      <div className="ats-tracker-container" style={{ borderColor: "#fecaca", background: "#fef2f2" }}>
        <p role="alert" style={{ color: "#991b1b", fontSize: "12px", margin: 0 }}>
          Tracking error: {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ats-tracker-container">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
          <RefreshCw size={14} className="animate-spin" />
          <span>Loading your application updates…</span>
        </div>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === data.status);
  const isTerminal = data.status === "rejected" || data.status === "withdrawn";

  const currentStepRef = useRef<HTMLDivElement | null>(null);
  const stepperWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentStepRef.current && stepperWrapRef.current) {
      const wrap = stepperWrapRef.current;
      const item = currentStepRef.current;
      const scrollLeft = item.offsetLeft - (wrap.clientWidth / 2) + (item.clientWidth / 2);
      wrap.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
    }
  }, [data?.status]);

  return (
    <div className="ats-tracker-container">
      {/* Top Header */}
      <div className="ats-tracker-header">
        <div className="ats-tracker-status-row">
          <span className={`ats-tracker-badge ats-badge-${data.status}`}>
            {STAGE_LABELS[data.status]}
          </span>
          <span className="ats-tracker-live-pill">
            <span className="ats-tracker-pulse-dot" />
            {connected ? "Live updates" : "Auto refresh"}
          </span>
          {lastSynced && (
            <span className="ats-tracker-synced-time">
              Synced {lastSynced}
            </span>
          )}
        </div>

        <div className="ats-tracker-actions">
          <button
            type="button"
            className="ats-tracker-refresh-btn"
            onClick={() => { setRefreshing(true); void load(); }}
            disabled={refreshing}
            title="Check live updates immediately"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Checking…" : "Refresh"}</span>
          </button>
          <button
            type="button"
            className="ats-tracker-toggle-btn"
            onClick={() => setExpanded(!expanded)}
          >
            <span>{expanded ? "Hide details" : "Timeline & interviews"}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile Stage Progress Indicator (Shown prominently on small screens) */}
      {!isTerminal && (
        <div className="ats-mobile-stage-bar">
          <div className="ats-mobile-stage-info">
            <span className="ats-mobile-stage-step">Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}</span>
            <span className="ats-mobile-stage-current">{STAGE_LABELS[data.status]}</span>
          </div>
          <div className="ats-mobile-stage-meter">
            <div 
              className="ats-mobile-stage-meter-fill" 
              style={{ width: `${Math.round(((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100)}%` }} 
            />
          </div>
        </div>
      )}

      {/* Visual Stepper Track for Active Stages */}
      {!isTerminal ? (
        <div className="ats-stepper-wrap" ref={stepperWrapRef}>
          <div className="ats-stepper-track">
            {PIPELINE_STAGES.map((s, idx) => {
              const isCompleted = currentStageIndex > idx && data.events.some(event => event.stage === s.key);
              const isCurrent = currentStageIndex === idx;
              return (
                <div
                  key={s.key}
                  ref={isCurrent ? currentStepRef : undefined}
                  className={`ats-stepper-item ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                >
                  <div className="ats-stepper-node">
                    {isCompleted ? <Check size={14} /> : idx + 1}
                  </div>
                  <span className="ats-stepper-label">{s.label}</span>
                  <span className="ats-stepper-hint">{s.hint}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ats-tracker-terminal">
          <AlertCircle size={20} color="#64748b" />
          <div>
            <strong>Application {STAGE_LABELS[data.status]}</strong>
            <p>
              {data.status === "rejected"
                ? "The hiring team marked this application as not selected. Your account remains available for other applications."
                : "You withdrew your application for this role."}
            </p>
          </div>
        </div>
      )}

      {/* Stage Explanatory Box */}
      <div className="ats-tracker-guidance">
        <Sparkles size={16} />
        <div>
          <strong>Current stage: {STAGE_LABELS[data.status]}</strong>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#1e40af" }}>
            {STAGE_DESCRIPTIONS[data.status] || "Your application is active in the employer's applicant tracking pipeline."}
          </p>
        </div>
      </div>

      {/* Expanded Section: Interviews & Events Feed */}
      {expanded && (
        <>
          {/* Scheduled Interviews */}
          {data.interviews.length > 0 && (
            <div className="ats-tracker-interviews">
              <div className="ats-tracker-interviews-title">
                <Calendar size={14} color="#16a34a" />
                <span>Interview appointments ({data.interviews.length})</span>
              </div>
              {data.interviews.map((i) => {
                const isUrl = /^https?:\/\//i.test(i.location);
                return (
                  <div key={i.id} className="ats-tracker-interview-card">
                    <div className="ats-tracker-interview-header">
                      <strong>{i.title}</strong>
                      <span className="ats-tracker-badge ats-badge-interview">
                        {i.status}
                      </span>
                    </div>
                    <div className="ats-tracker-interview-time">
                      <span>
                        📅 {new Date(i.startsAt).toLocaleString(undefined, {
                          dateStyle: "full",
                          timeStyle: "short",
                          timeZone: i.timeZone,
                        })}{" "}
                        ({i.timeZone})
                      </span>
                    </div>
                    {isUrl && i.status === "scheduled" ? (
                      <a
                        href={i.location}
                        target="_blank"
                        rel="noreferrer"
                        className="ats-tracker-interview-link"
                      >
                        <Video size={13} />
                        <span>Join Video Meeting</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <div style={{ fontSize: "11px", color: "#1e293b", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} color="#64748b" />
                        <span>{i.status === "cancelled" ? "This interview was cancelled." : `Location: ${i.location}`}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hiring Team Activity Stream */}
          <div className="ats-tracker-timeline">
            <div className="ats-tracker-timeline-title">
              <span>Hiring Team Activity Feed</span>
            </div>
            {data.events.length > 0 ? (
              <div className="ats-tracker-timeline-events">
                {data.events.map((e) => (
                  <div key={e.id} className="ats-tracker-timeline-item">
                    <CheckCircle2 size={15} />
                    <div className="ats-tracker-timeline-item-content">
                      <p>{e.message}</p>
                      <small>
                        {new Date(e.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                No custom messages posted yet. Updates made by the hiring team will appear here after the next refresh.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

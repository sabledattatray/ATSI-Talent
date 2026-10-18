"use client";

import { useEffect, useState, useCallback } from "react";
import {
  STAGE_LABELS,
  type Stage,
  type Interview,
  type TrackingEvent,
} from "@/lib/ats-types";
import {
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  Video,
  MapPin,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Users2,
  Sparkles,
  Award,
  AlertCircle,
  ShieldCheck,
  Radio,
} from "lucide-react";
import "./ats.css";

type Tracking = {
  status: Stage;
  events: TrackingEvent[];
  interviews: Interview[];
};

const PIPELINE_STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: "submitted", label: "Applied", hint: "Logged in ATS" },
  { key: "review", label: "In Review", hint: "Recruiter screening" },
  { key: "shortlisted", label: "Shortlisted", hint: "Hiring team queue" },
  { key: "interview", label: "Interview", hint: "Scheduled rounds" },
  { key: "offer", label: "Offer", hint: "Package & agreement" },
  { key: "hired", label: "Hired", hint: "Onboarding complete" },
];

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  submitted: "Your application and profile credentials are cataloged in the employer's ATS. A talent acquisition recruiter conducts preliminary resume calibration.",
  review: "Your application is under active review. The hiring team is evaluating your technical skill depth, project history, and compensation alignment.",
  shortlisted: "Congratulations! Your profile has been shortlisted and forwarded to the hiring manager and engineering leadership for interview scheduling.",
  interview: "You are currently in the interview process. Review your scheduled interview appointments below. Times and video links are synchronized in real time.",
  offer: "Congratulations! An offer or pre-offer communication has been issued for this requisition. Review any notes below or check your inbox.",
  hired: "Hired! Candidate onboarding process has been initiated. Welcome to your new role!",
  rejected: "The hiring team has concluded review for this opening and proceeded with other candidates. Your profile remains active in the ATS talent network for future openings.",
  withdrawn: "This application was withdrawn at your request. No further action will be taken by the hiring team.",
};

export function ApplicationTracking({ id }: { id: string }) {
  const [data, setData] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("");

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetch(`/api/recruitment/tracking?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not retrieve tracking status.");
      setData(body);
      setError("");
      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 12000);
    return () => {
      active = false;
      clearInterval(timer);
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
          <span>Connecting to real-time ATS pipeline…</span>
        </div>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === data.status);
  const isTerminal = data.status === "rejected" || data.status === "withdrawn";

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
            Live ATS Sync
          </span>
          {lastSynced && (
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
              Synced {lastSynced}
            </span>
          )}
        </div>

        <div className="ats-tracker-actions">
          <button
            type="button"
            className="ats-tracker-refresh-btn"
            onClick={() => void load(true)}
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

      {/* Visual Stepper Track for Active Stages */}
      {!isTerminal ? (
        <div className="ats-stepper-wrap">
          <div className="ats-stepper-track">
            {PIPELINE_STAGES.map((s, idx) => {
              const isCompleted = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;
              return (
                <div
                  key={s.key}
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
                ? "The hiring team concluded review for this role. Your profile remains active for other worldwide openings."
                : "This requisition has been withdrawn from consideration."}
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
                <span>Scheduled Interviews ({data.interviews.length})</span>
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
                    {isUrl ? (
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
                        <span>Location: {i.location}</span>
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
                No custom messages posted yet. Any updates made by the hiring team will appear here in real time.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";
import { ResumeLibrary } from "@/components/ats/ResumeLibrary";
import { ApplicationStatusEditor } from "@/components/ats/ApplicationStatusEditor";
import { EmailDelivery } from "@/components/ats/EmailDelivery";
import { STAGE_LABELS, type Stage } from "@/lib/ats-types";
import { subscribeToApplicationUpdates } from "@/lib/application-live";
import { ApplicationTracking } from "@/components/ats/ApplicationTracking";
import { mergeResumeProfile } from "@/lib/resumeMerge";
/* eslint-disable @next/next/no-img-element -- Uploaded candidate profile photos use native images. */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef, type FormEvent } from "react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
  Sparkles,
  Award,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Building2,
  GraduationCap,
  MapPin,
  Clock,
  FileText,
  Globe,
  Edit3,
  UploadCloud,
  FileUp,
  Clipboard,
  Loader2,
  Check,
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import type { Candidate, CandidateProfile, Application, Inquiry, Recruiter, WorkExperience, Education } from "@/lib/recruitment";
import type { ParsedResume } from "@/lib/resumeParser";

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/recruitment/${path}`, { method: body === undefined ? "GET" : "POST", cache: "no-store", headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Please try again."), { status: response.status });
  return result;
}

async function apiUpload(path: string, formData: FormData) {
  const response = await fetch(`/api/recruitment/${path}`, {
    method: "POST",
    cache: "no-store",
    body: formData,
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Failed to process file."), { status: response.status });
  return result;
}
const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const label = (value: string) => value.replaceAll("-", " ");
function Notice({ error, message }: { error?: string; message?: string }) { return error ? <div className="talent-alert" role="alert">{error}</div> : message ? <div className="talent-success" role="status"><CheckCircle2 size={19} />{message}</div> : null; }
function Consent({ label: content }: { label: React.ReactNode }) { return <label className="talent-consent"><input type="checkbox" name="consent" required /><span>{content}</span></label>; }

export function CandidateAuth({ signup }: { signup: boolean }) {
  const router = useRouter(); const params = useSearchParams();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`auth/${signup ? "signup" : "login"}`, { ...fields, consent: fields.consent === "on" });
      const next = params.get("next") || "";
      router.replace(/^\/candidate\/(dashboard|apply\/[a-z0-9-]+)$/.test(next) ? next : "/candidate/dashboard"); router.refresh();
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <div className="talent-auth"><aside><span className="talent-eyebrow">YOUR CAREER, WITH CLARITY</span><h1>A new account.<br /><em>A world of opportunity.</em></h1><p>Keep your profile, saved roles, and applications together. Take your next step at your own pace.</p><ul><li><Bookmark size={18} />Save roles that feel right</li><li><BriefcaseBusiness size={18} />Track your applications</li><li><ShieldCheck size={18} />Choose when to share your profile</li></ul><small>No candidate registration or application fees.</small></aside><section className="talent-card"><span className="talent-icon"><UserRound /></span><span className="talent-eyebrow">CANDIDATE ACCOUNT</span><h2>{signup ? "Start your next chapter." : "Welcome back."}</h2><p>{signup ? "Create your free job-seeker account." : "Sign in to manage your career search."}</p><Notice error={error} /><form className="talent-form" onSubmit={submit}>{signup && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={12} maxLength={128} />{signup && <small>Use at least 12 characters.</small>}</label>{signup && <><input name="website" className="talent-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" /><Consent label={<>I agree to the <Link href="/legal/candidate-terms">candidate terms</Link> and <Link href="/legal/privacy-policy">privacy notice</Link>, and consent to storing my account details.</>} /></>}<button className="talent-button" disabled={busy}>{busy ? "Please wait…" : signup ? "Create free account" : "Sign in"}<ArrowRight size={17} /></button></form><p>{signup ? "Already registered?" : "New to ATSAI?"} <Link href={`/candidate/${signup ? "login" : "signup"}${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}>{signup ? "Sign in" : "Create a free account"}</Link></p>{!signup && <Link href="/forgot-password">Need help accessing your account?</Link>}<div className="talent-auth-bottom"><Link href="/jobs">Browse jobs</Link><Link href="/admin/login">Staff sign in</Link></div></section></div>;
}

export function InquiryForm({ kind = "contact" }: { kind?: "contact" | "employer" | "report" | "privacy" | "account" }) {
  const [error, setError] = useState(""); const [reference, setReference] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(form));
    try { const result = await api("inquiries", { ...values, kind, consent: values.consent === "on" }); setReference(result.reference); form.reset(); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  if (reference) return <section className="talent-success-panel" role="status"><CheckCircle2 size={36} /><h2>Your request is saved.</h2><p>Reference <strong>{reference}</strong></p><p>The ATSAI team can review it in their inbox. Keep this reference for follow-up. No email confirmation has been sent.</p><button className="talent-button talent-secondary" onClick={() => setReference("")}>Send another request</button></section>;
  return <form className="talent-form" onSubmit={submit}><Notice error={error} /><div className="talent-form-grid"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div><div className="talent-form-grid"><label><span>Phone number <small>(optional)</small></span><input name="phone" type="tel" autoComplete="tel" maxLength={35} /></label><label>{kind === "employer" ? "Company name" : "Company or organisation (optional)"}<input name="company" autoComplete="organization" required={kind === "employer"} maxLength={160} /></label></div><label>{kind === "employer" ? "Role or hiring requirement" : kind === "report" ? "Person, company, or job reference" : "Subject"}<input name="subject" required minLength={3} maxLength={180} /></label><label>{kind === "employer" ? "Tell us about the roles, location, skills, budget, and timeline" : kind === "report" ? "Describe what happened" : kind === "privacy" ? "Describe your data request" : "Your message"}<textarea name="message" required minLength={20} maxLength={6000} rows={6} /></label><input name="website" className="talent-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" /><Consent label={<>I consent to ATSAI storing these details to respond to this request, as described in the <Link href="/legal/privacy-policy">privacy notice</Link>.</>} /><button className="talent-button" disabled={busy}>{busy ? "Saving…" : kind === "employer" ? "Submit hiring brief" : "Send request"}<ArrowRight size={17} /></button><small>Saved securely for the team to review. Please do not include passwords, identity documents, or financial details.</small></form>;
}

type Dashboard = { user: Candidate; applications: Application[]; savedJobs: { id: string; title: string; slug: string; company: string; location: string }[] };

export function CandidatePortal({ initial, defaultTab }: { initial: Dashboard; defaultTab?: string }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const validTabs = ["applications", "saved", "profile", "preview", "account"];
  const [tab, setTab] = useState(defaultTab && validTabs.includes(defaultTab) ? defaultTab : "applications");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (tab !== "applications") return;
    let active = true;
    const sync = () => { if (!busy && document.visibilityState === "visible") void api("dashboard").then(fresh => { if (active) setData(fresh); }).catch(() => {}); };
    const unsubscribe = subscribeToApplicationUpdates("candidate", sync);
    const timer = setInterval(sync, 15000); window.addEventListener("focus", sync);
    return () => { active = false; unsubscribe(); clearInterval(timer); window.removeEventListener("focus", sync); };
  }, [tab, busy]);

  // Complete profile state
  const [name, setName] = useState(initial.user.name || "");
  const [photoUrl, setPhotoUrl] = useState(initial.user.profile.photoUrl || "");
  const [phone, setPhone] = useState(initial.user.profile.phone || "");
  const [location, setLocation] = useState(initial.user.profile.location || "");
  const [headline, setHeadline] = useState(initial.user.profile.headline || "");
  const [bio, setBio] = useState(initial.user.profile.bio || "");
  const [skills, setSkills] = useState(initial.user.profile.skills || "");
  const [experience, setExperience] = useState(initial.user.profile.experience ?? 0);
  const [certifications, setCertifications] = useState(initial.user.profile.certifications || "");
  const [targetRole, setTargetRole] = useState(initial.user.profile.targetRole || "");
  const [employmentType, setEmploymentType] = useState(initial.user.profile.employmentType || "Full-time");
  const [preferredLocation, setPreferredLocation] = useState(initial.user.profile.preferredLocation || "");
  const [noticePeriod, setNoticePeriod] = useState(initial.user.profile.noticePeriod || "");
  const [expectedSalary, setExpectedSalary] = useState(initial.user.profile.expectedSalary || "");
  const [openToRelocation, setOpenToRelocation] = useState(initial.user.profile.openToRelocation ?? false);
  const [resumeUrl, setResumeUrl] = useState(initial.user.profile.resumeUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial.user.profile.linkedinUrl || "");
  const [githubUrl, setGithubUrl] = useState(initial.user.profile.githubUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(initial.user.profile.portfolioUrl || "");
  const [workHistory, setWorkHistory] = useState<WorkExperience[]>(initial.user.profile.workHistory || []);
  const [educationHistory, setEducationHistory] = useState<Education[]>(initial.user.profile.educationHistory || []);

  // Photo & Resume Parsing states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsingBusy, setParsingBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedResume | null>(null);
  const [replaceFromResume, setReplaceFromResume] = useState(false);
  const [parsedSource, setParsedSource] = useState("");
  const [lastSyncedFile, setLastSyncedFile] = useState("");

  // Helper to run actions and update fresh data
  async function run(task: () => Promise<void>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      await task();
      const fresh = await api("dashboard");
      setData(fresh);
      setName(fresh.user.name || "");
      setPhotoUrl(fresh.user.profile.photoUrl || "");
      setPhone(fresh.user.profile.phone || "");
      setLocation(fresh.user.profile.location || "");
      setHeadline(fresh.user.profile.headline || "");
      setBio(fresh.user.profile.bio || "");
      setSkills(fresh.user.profile.skills || "");
      setExperience(fresh.user.profile.experience ?? 0);
      setCertifications(fresh.user.profile.certifications || "");
      setTargetRole(fresh.user.profile.targetRole || "");
      setEmploymentType(fresh.user.profile.employmentType || "Full-time");
      setPreferredLocation(fresh.user.profile.preferredLocation || "");
      setNoticePeriod(fresh.user.profile.noticePeriod || "");
      setExpectedSalary(fresh.user.profile.expectedSalary || "");
      setOpenToRelocation(fresh.user.profile.openToRelocation ?? false);
      setResumeUrl(fresh.user.profile.resumeUrl || "");
      setLinkedinUrl(fresh.user.profile.linkedinUrl || "");
      setGithubUrl(fresh.user.profile.githubUrl || "");
      setPortfolioUrl(fresh.user.profile.portfolioUrl || "");
      setWorkHistory(fresh.user.profile.workHistory || []);
      setEducationHistory(fresh.user.profile.educationHistory || []);
      setMessage(success);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Dynamically calculate completeness
  const completeness = useMemo(() => {
    const checks = [
      { id: "photo", label: "Profile Photo", ok: !!photoUrl.trim(), weight: 5 },
      { id: "contact", label: "Phone & Location", ok: !!phone.trim() && !!location.trim(), weight: 10 },
      { id: "headline", label: "Professional Headline", ok: !!headline.trim(), weight: 15 },
      { id: "bio", label: "Summary / Bio", ok: !!bio.trim(), weight: 10 },
      { id: "skills", label: "Core Skills", ok: !!skills.trim(), weight: 15 },
      { id: "experience", label: "Experience Years", ok: Number(experience) > 0, weight: 10 },
      { id: "preferences", label: "Target Role & Notice Period", ok: !!targetRole.trim() || !!expectedSalary.trim(), weight: 10 },
      { id: "workHistory", label: "Work Experience", ok: workHistory.length > 0 && !!workHistory[0].title.trim(), weight: 10 },
      { id: "education", label: "Education", ok: educationHistory.length > 0 && !!educationHistory[0].degree.trim(), weight: 5 },
      { id: "resume", label: "Resume Link", ok: !!resumeUrl.trim(), weight: 10 },
    ];
    const score = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
    const missing = checks.filter(c => !c.ok).map(c => c.label);
    return { score, missing };
  }, [photoUrl, phone, location, headline, bio, skills, experience, targetRole, expectedSalary, workHistory, educationHistory, resumeUrl]);


  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("profile", {
        name,
        photoUrl,
        phone,
        location,
        headline,
        bio,
        skills,
        experience: Number(experience) || 0,
        certifications,
        targetRole,
        employmentType,
        preferredLocation,
        noticePeriod,
        expectedSalary,
        openToRelocation,
        resumeUrl,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        workHistory,
        educationHistory,
      });
    }, "Your complete profile has been saved successfully.");
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    await run(async () => {
      await api("password", values);
      form.reset();
    }, "Your password is updated. Other sessions have been signed out.");
  }

  function addWork() {
    setWorkHistory(prev => [
      ...prev,
      {
        id: `work_${Date.now()}`,
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
    ]);
  }

  function updateWork(index: number, patch: Partial<WorkExperience>) {
    setWorkHistory(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeWork(index: number) {
    setWorkHistory(prev => prev.filter((_, i) => i !== index));
  }

  function addEducation() {
    setEducationHistory(prev => [
      ...prev,
      {
        id: `edu_${Date.now()}`,
        degree: "",
        field: "",
        institution: "",
        graduationYear: "",
      },
    ]);
  }

  function updateEducation(index: number, patch: Partial<Education>) {
    setEducationHistory(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeEducation(index: number) {
    setEducationHistory(prev => prev.filter((_, i) => i !== index));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5 MB. Please choose a smaller photo.");
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiUpload("photo", formData);
      if (res.ok && res.photoUrl) {
        setPhotoUrl(res.photoUrl);
        setMessage("Profile photo uploaded! Click Save Complete Profile to persist changes.");
      } else {
        setError(res.error || "Failed to upload photo.");
      }
    } catch (err) {
      setError((err as Error).message || "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleFileUpload(file: File) {
    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt", ".md"];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some(ext => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setError("Please choose a valid resume file (PDF, Word .docx/.doc, TXT, MD).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Resume file exceeds the 8 MB size limit.");
      return;
    }

    setParsingBusy(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiUpload("parse-resume", formData);
      if (res.ok && res.parsed) {
        setReplaceFromResume(false);
        setParsedResult(res.parsed);
        setParsedSource(file.name);
        setSyncModalOpen(true);
      } else {
        setError(res.error || "Could not extract resume details.");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to parse resume file.");
    } finally {
      setParsingBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  }

  async function handlePasteSubmit() {
    if (!pastedText.trim() || pastedText.trim().length < 30) {
      setPasteError("Please paste resume text with at least 30 characters.");
      return;
    }

    setParsingBusy(true);
    setPasteError("");
    try {
      const res = await api("parse-resume", { text: pastedText, filename: "pasted_resume.txt" });
      if (res.ok && res.parsed) {
        setReplaceFromResume(false);
        setParsedResult(res.parsed);
        setParsedSource("Pasted Resume Text");
        setPasteModalOpen(false);
        setPastedText("");
        setSyncModalOpen(true);
      } else {
        setPasteError(res.error || "Could not extract resume details.");
      }
    } catch (err) {
      setPasteError((err as Error).message || "Failed to analyze resume text.");
    } finally {
      setParsingBusy(false);
    }
  }

  async function applyParsedResume(autoSave = false) {
    if (!parsedResult) return;
    const p = parsedResult;

    const merged = mergeResumeProfile({ name, photoUrl, headline, phone, location, bio, skills, experience, certifications, targetRole, employmentType, preferredLocation, noticePeriod, expectedSalary, openToRelocation, resumeUrl, linkedinUrl, githubUrl, portfolioUrl, workHistory, educationHistory }, p, replaceFromResume);
    const updatedName = merged.name;
    const updatedPhotoUrl = merged.photoUrl || "";
    const updatedHeadline = merged.headline || "";
    const updatedPhone = merged.phone;
    const updatedLocation = merged.location;
    const updatedBio = merged.bio || "";
    const updatedSkills = merged.skills;
    const updatedExperience = merged.experience;
    const updatedCertifications = merged.certifications || "";
    const updatedTargetRole = merged.targetRole || "";
    const updatedNoticePeriod = merged.noticePeriod || "";
    const updatedExpectedSalary = merged.expectedSalary || "";
    const updatedOpenToRelocation = merged.openToRelocation ?? false;
    const updatedResumeUrl = merged.resumeUrl;
    const updatedLinkedinUrl = merged.linkedinUrl || "";
    const updatedGithubUrl = merged.githubUrl || "";
    const updatedPortfolioUrl = merged.portfolioUrl || "";
    const updatedWorkHistory = merged.workHistory || [];
    const updatedEducationHistory = merged.educationHistory || [];

    setName(updatedName);
    setPhotoUrl(updatedPhotoUrl);
    setHeadline(updatedHeadline);
    setPhone(updatedPhone);
    setLocation(updatedLocation);
    setBio(updatedBio);
    setSkills(updatedSkills);
    setExperience(updatedExperience);
    setCertifications(updatedCertifications);
    setTargetRole(updatedTargetRole);
    setNoticePeriod(updatedNoticePeriod);
    setExpectedSalary(updatedExpectedSalary);
    setOpenToRelocation(updatedOpenToRelocation);
    setResumeUrl(updatedResumeUrl);
    setLinkedinUrl(updatedLinkedinUrl);
    setGithubUrl(updatedGithubUrl);
    setPortfolioUrl(updatedPortfolioUrl);
    setWorkHistory(updatedWorkHistory);
    setEducationHistory(updatedEducationHistory);

    setSyncModalOpen(false);
    setLastSyncedFile(parsedSource);

    if (autoSave) {
      await run(async () => {
        await api("profile", {
          name: updatedName,
          photoUrl: updatedPhotoUrl,
          phone: updatedPhone,
          location: updatedLocation,
          headline: updatedHeadline,
          bio: updatedBio,
          skills: updatedSkills,
          experience: Number(updatedExperience) || 0,
          certifications: updatedCertifications,
          targetRole: updatedTargetRole,
          employmentType,
          preferredLocation,
          noticePeriod: updatedNoticePeriod,
          expectedSalary: updatedExpectedSalary,
          openToRelocation: updatedOpenToRelocation,
          resumeUrl: updatedResumeUrl,
          linkedinUrl: updatedLinkedinUrl,
          githubUrl: updatedGithubUrl,
          portfolioUrl: updatedPortfolioUrl,
          workHistory: updatedWorkHistory,
          educationHistory: updatedEducationHistory,
        });
      }, `Resume data from "${parsedSource}" applied and saved directly to your profile!`);
    } else {
      setMessage(`Resume data from "${parsedSource}" imported into your profile! Review the sections below and click "Save Complete Profile" when ready.`);
    }
  }

  const skillChips = useMemo(() => {
    return skills.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  }, [skills]);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "CA";
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div className="talent-container">
      {/* Workspace Header */}
      <div className="talent-page-title">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={name} style={{ width: 62, height: 62, borderRadius: "20px", objectFit: "cover", boxShadow: "0 6px 18px rgba(37,99,235,0.2)", border: "2px solid #fff", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 62, height: 62, borderRadius: "20px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0, boxShadow: "0 6px 18px rgba(37,99,235,0.2)", border: "2px solid #fff" }}>
              {initials}
            </div>
          )}
          <div>
            <span className="talent-eyebrow">CANDIDATE WORKSPACE</span>
            <h1>Hello, {name.split(" ")[0] || "Candidate"}.</h1>
            <p>Manage your applications, job shortlist, and your complete verified candidate profile.</p>
          </div>
        </div>
        <div className="talent-actions">
          <Link className="talent-button" href="/jobs">
            Explore jobs <ArrowRight size={17} />
          </Link>
          <button
            className="talent-button talent-secondary"
            onClick={async () => {
              try {
                await api("auth/logout", {});
                router.replace("/candidate/login");
                router.refresh();
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Prominent Profile Completeness Banner */}
      {completeness.score < 100 ? (
        <div className="talent-completeness-banner">
          <div className="talent-completeness-content">
            <div className="talent-completeness-header">
              <Sparkles size={20} color="#6ee7b7" />
              <span className="talent-completeness-score">{completeness.score}%</span>
              <span className="talent-completeness-label">
                {completeness.score >= 80 ? "Almost complete · High visibility" : completeness.score >= 50 ? "Profile in progress" : "Complete your profile"}
              </span>
            </div>
            <p style={{ margin: "4px 0 8px", fontSize: "14px", color: "#cbd5e1" }}>
              A complete profile stands out to hiring managers and enables 1-click express applications across all ATSAI roles.
            </p>
            <div className="talent-progress-track">
              <div className="talent-progress-fill" style={{ width: `${Math.max(completeness.score, 6)}%` }} />
            </div>
            <div className="talent-completeness-tips">
              {completeness.missing.slice(0, 3).map(tip => (
                <span key={tip} className="talent-tip-chip">+ Add {tip}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="talent-button"
              onClick={() => { setTab("profile"); setMessage(""); setError(""); }}
              style={{ whiteSpace: "nowrap" }}
            >
              Create / Edit Complete Profile <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="talent-button talent-button-on-dark"
              onClick={() => {
                setTab("profile");
                setMessage("");
                setError("");
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              style={{ whiteSpace: "nowrap" }}
            >
              <FileUp size={16} /> Auto-Fill with Resume ⚡
            </button>
          </div>
        </div>
      ) : (
        <div className="talent-completeness-banner" style={{ background: "linear-gradient(135deg, #064e3b, #065f46)" }}>
          <div className="talent-completeness-content">
            <div className="talent-completeness-header">
              <Award size={20} color="#6ee7b7" />
              <span className="talent-completeness-score">100%</span>
              <span className="talent-completeness-label">All-Star Profile · Recruiter Ready</span>
            </div>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#d1fae5" }}>
              Your profile is 100% complete. Recruiters and hiring partners have full visibility into your skills, experience, and career goals.
            </p>
          </div>
          <button
            type="button"
            className="talent-button talent-secondary"
            onClick={() => { setTab("preview"); setMessage(""); setError(""); }}
            style={{ whiteSpace: "nowrap" }}
          >
            <Eye size={16} /> Preview Candidate Profile
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="talent-stats">
        <article>
          <span>Applications</span>
          <strong>{data.applications.length}</strong>
        </article>
        <article>
          <span>Saved opportunities</span>
          <strong>{data.savedJobs.length}</strong>
        </article>
        <article>
          <span>Profile Completeness</span>
          <strong style={{ color: completeness.score >= 80 ? "#059669" : completeness.score >= 50 ? "#2563eb" : "#d97706" }}>
            {completeness.score}%
          </strong>
        </article>
        <article>
          <span>Notice / Availability</span>
          <strong>{noticePeriod || "Not specified"}</strong>
        </article>
      </div>

      {/* Navigation Tabs */}
      <div className="talent-tabs-wrapper">
        <div className="talent-tabs">
          <button className={tab === "applications" ? "active" : ""} onClick={() => { setTab("applications"); setMessage(""); setError(""); }}>
            Applications <span className="talent-tab-badge">{data.applications.length}</span>
          </button>
          <button className={tab === "saved" ? "active" : ""} onClick={() => { setTab("saved"); setMessage(""); setError(""); }}>
            Saved Jobs <span className="talent-tab-badge">{data.savedJobs.length}</span>
          </button>
          <button className={tab === "profile" ? "active" : ""} onClick={() => { setTab("profile"); setMessage(""); setError(""); }}>
            Complete Profile <span className="talent-tab-badge" style={{ background: completeness.score === 100 ? "#059669" : "#2563eb" }}>{completeness.score}%</span>
          </button>
          <button className={tab === "preview" ? "active" : ""} onClick={() => { setTab("preview"); setMessage(""); setError(""); }}>
            <Eye size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} /> Preview Profile
          </button>
          <button className={tab === "account" ? "active" : ""} onClick={() => { setTab("account"); setMessage(""); setError(""); }}>
            Account & Privacy
          </button>
        </div>
      </div>

      <Notice error={error} message={message} />

      {/* TAB 1: APPLICATIONS */}
      {tab === "applications" && (
        <section className="talent-card">
          <h2>Your applications</h2>
          {data.applications.length ? (
            data.applications.map(app => (
              <article className="talent-candidate-app-card" key={app.id}>
                <div className="talent-candidate-app-head">
                  <div className="talent-candidate-app-info">
                    <Link href={`/jobs/${app.jobId}`} className="talent-candidate-app-title-link">
                      <h3 className="talent-candidate-app-title">{app.jobTitle}</h3>
                    </Link>
                    <div className="talent-candidate-app-sub">
                      <span>{app.company}</span>
                      <span className="talent-dot-sep">·</span>
                      <span>Applied {date(app.createdAt)}</span>
                      <span className="talent-dot-sep">·</span>
                      <span className="talent-app-ref">APP-{app.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="talent-candidate-app-badge-actions">
                    <span className="talent-status">{label(app.status)}</span>
                    {!["withdrawn", "hired", "rejected"].includes(app.status) && (
                      <button
                        className="talent-text-button talent-withdraw-btn"
                        disabled={busy}
                        onClick={() => {
                          if (confirm("Withdraw this application? This will inform the team you no longer wish to proceed.")) {
                            void run(async () => { await api("withdraw", { id: app.id }); }, "Application withdrawn.");
                          }
                        }}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                <div className="talent-candidate-app-tracker">
                  <ApplicationTracking id={app.id} />
                </div>
              </article>
            ))
          ) : (
            <div className="talent-empty">
              <BriefcaseBusiness size={32} />
              <h3>Your next chapter starts here.</h3>
              <p>Applications you submit through ATSAI will appear here. Applications on external employer sites are managed by that employer.</p>
              <Link href="/jobs">Explore current openings →</Link>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SAVED JOBS */}
      {tab === "saved" && (
        <section className="talent-card">
          <h2>Saved for your next step</h2>
          {data.savedJobs.length ? (
            data.savedJobs.map(job => (
              <article className="talent-list-item" key={job.id}>
                <div>
                  <Link href={`/jobs/${job.slug}`}>
                    <h3>{job.title}</h3>
                  </Link>
                  <p>{job.company} · {job.location}</p>
                </div>
                <button
                  className="talent-text-button"
                  disabled={busy}
                  onClick={() => void run(async () => { await api("saved", { jobId: job.id }); }, "Removed from saved jobs.")}
                >
                  Remove
                </button>
              </article>
            ))
          ) : (
            <div className="talent-empty">
              <Bookmark size={32} />
              <h3>A shortlist of your own.</h3>
              <p>Save a job to return to it later. Closed and expired roles are removed from this list.</p>
              <Link href="/jobs">Find a role to save →</Link>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: COMPLETE PROFILE EDITOR */}
      {tab === "profile" && (
        <section className="talent-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2>Create your complete profile</h2>
              <p style={{ margin: "4px 0 0" }}>
                Keep your details updated. When you apply, a profile snapshot is bundled with your application.
              </p>
            </div>
            <button
              type="button"
              className="talent-button talent-secondary"
              onClick={() => { setTab("preview"); setMessage(""); setError(""); }}
              style={{ minHeight: "38px", padding: "8px 16px" }}
            >
              <Eye size={15} /> Preview As Recruiter
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="talent-file-input"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileChange}
          />

          {/* Professional Resume Sync Card */}
          <div
            className={`talent-resume-sync-card ${isDragging ? "dragging" : ""}`}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFileUpload(file);
            }}
          >
            <div className="talent-sync-icon-circle">
              {parsingBusy ? <Loader2 size={26} className="talent-spin" /> : <UploadCloud size={26} />}
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>
              Auto-Fill Profile with Resume / CV
            </h3>
            <p style={{ margin: "0 auto", maxWidth: "600px", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Upload your resume in <strong>PDF, Word (.docx / .doc), TXT, or Markdown</strong> format, or paste your resume text. Import your contact details, skills, work experience and education, then review them before saving. Existing profile details are kept unless you choose to replace them.
            </p>

            <div className="talent-sync-actions">
              <button
                type="button"
                className="talent-button"
                disabled={parsingBusy || busy}
                onClick={() => fileInputRef.current?.click()}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                {parsingBusy ? (
                  <>
                    <Loader2 size={16} className="talent-spin" />
                    Analyzing resume…
                  </>
                ) : (
                  <>
                    <FileUp size={16} />
                    Upload Resume (PDF / Word)
                  </>
                )}
              </button>
              <button
                type="button"
                className="talent-button talent-secondary"
                disabled={parsingBusy || busy}
                onClick={() => { setPasteModalOpen(true); setPasteError(""); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Clipboard size={16} />
                Paste Resume Text
              </button>
            </div>
            <small style={{ display: "block", marginTop: 12, color: "#64748b", fontSize: "12px" }}>
              Supports up to 8 MB · Instant semantic field mapping · You can review or adjust all fields before saving
            </small>
          </div>

          {lastSyncedFile && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={17} color="#16a34a" />
                <span>Profile details synced from <strong>{lastSyncedFile}</strong>. All fields have been populated below.</span>
              </div>
              <span className="talent-sync-badge">✓ Synced</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="talent-form" style={{ maxWidth: "100%" }}>
            {/* Section 1: Identity & Professional Headline */}
            <div className="talent-section-card">
              <h3><UserRound size={18} color="#2563eb" /> Identity & Headline</h3>
              <p className="sub">This headline and photo are the first things hiring managers and recruiters see.</p>

              {/* Profile Photo Upload */}
              <div className="talent-photo-uploader">
                <div className="talent-photo-avatar-wrap">
                  {photoUrl ? (
                    <img src={photoUrl} alt={name || "Profile Photo"} className="talent-photo-avatar-img" />
                  ) : (
                    <div className="talent-photo-avatar-initials">{initials}</div>
                  )}
                  {uploadingPhoto && (
                    <div className="talent-photo-loading-overlay">
                      <Loader2 size={22} className="talent-spin" />
                    </div>
                  )}
                </div>
                <div className="talent-photo-details">
                  <div className="talent-photo-title">Profile Photo</div>
                  <p className="talent-photo-desc">
                    Upload a clear headshot or avatar. Supported formats: JPG, PNG, WebP (max 5 MB).
                  </p>
                  <div className="talent-photo-actions">
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      className="talent-button talent-secondary"
                      style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12px" }}
                      disabled={uploadingPhoto || busy}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Camera size={14} /> {photoUrl ? "Change photo" : "Upload photo"}
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        className="talent-text-button"
                        style={{ color: "#ef4444", margin: 0, textDecoration: "none", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: 4 }}
                        disabled={uploadingPhoto || busy}
                        onClick={() => { setPhotoUrl(""); setMessage("Profile photo removed. Save your profile to confirm."); }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="talent-form-grid">
                <label>
                  Full name *
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="e.g. Alex Morgan"
                  />
                </label>
                <label>
                  Professional headline
                  <input
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. Senior Full-Stack Engineer | Next.js, Node.js & Cloud"
                  />
                  <small>Max 160 characters. Highlight your main title and key tech stack.</small>
                </label>
              </div>
              <label style={{ marginTop: 14 }}>
                Executive summary / Bio
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Summarize your experience, leadership, key milestones, and what problems you love solving..."
                />
              </label>
            </div>

            {/* Section 2: Contact Details */}
            <div className="talent-section-card">
              <h3><MapPin size={18} color="#2563eb" /> Contact & Location</h3>
              <p className="sub">Recruiters will use these details to contact you regarding interviews.</p>
              <div className="talent-form-grid">
                <label>
                  Phone number
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={35}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label>
                  Current location (City, Country)
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. London, United Kingdom or Nairobi, Kenya"
                  />
                </label>
              </div>
            </div>

            {/* Section 3: Career Preferences & Availability */}
            <div className="talent-section-card">
              <h3><Clock size={18} color="#2563eb" /> Career Preferences & Availability</h3>
              <p className="sub">Helps match you with opportunities aligned with your expectations.</p>
              <div className="talent-form-grid">
                <label>
                  Target role / Desired job title
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Lead Frontend Engineer or Staff Architect"
                  />
                </label>
                <label>
                  Notice period / Availability
                  <select
                    value={noticePeriod}
                    onChange={e => setNoticePeriod(e.target.value)}
                  >
                    <option value="">Not specified</option>
                    {!!noticePeriod && !["Immediate", "15 Days", "30 Days", "60 Days", "90 Days", "Serving Notice"].includes(noticePeriod) && <option value={noticePeriod}>{noticePeriod}</option>}
                    <option value="Immediate">Immediate (Available now)</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days (1 Month)</option>
                    <option value="60 Days">60 Days (2 Months)</option>
                    <option value="90 Days">90 Days (3 Months)</option>
                    <option value="Serving Notice">Currently Serving Notice</option>
                  </select>
                </label>
              </div>

              <div className="talent-form-grid" style={{ marginTop: 14 }}>
                <label>
                  Preferred employment type
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value)}
                  >
                    <option value="Full-time">Full-time Permanent</option>
                    <option value="Contract">Contract / Consulting</option>
                    <option value="Remote">Remote Only</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Any">Open to Any</option>
                  </select>
                </label>
                <label>
                  Expected CTC / Salary
                  <input
                    value={expectedSalary}
                    onChange={e => setExpectedSalary(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. EUR 55,000 / year or USD 35 / hour"
                  />
                </label>
              </div>

              <div className="talent-form-grid" style={{ marginTop: 14 }}>
                <label>
                  Preferred job locations
                  <input
                    value={preferredLocation}
                    onChange={e => setPreferredLocation(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. Remote, Toronto, Dubai or Berlin"
                  />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 24 }}>
                  <input
                    type="checkbox"
                    checked={openToRelocation}
                    onChange={e => setOpenToRelocation(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#2563eb", margin: 0 }}
                  />
                  <span>Open to relocation for the right opportunity</span>
                </label>
              </div>
            </div>

            {/* Section 4: Skills & Total Experience */}
            <div className="talent-section-card">
              <h3><Award size={18} color="#2563eb" /> Skills & Experience</h3>
              <p className="sub">Highlight your core technical skills, frameworks, and domain expertise.</p>
              <div className="talent-form-grid">
                <label>
                  Total years of professional experience *
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={0.5}
                    value={experience}
                    onChange={e => setExperience(Number(e.target.value) || 0)}
                    required
                  />
                </label>
                <label>
                  Certifications & credentials
                  <input
                    value={certifications}
                    onChange={e => setCertifications(e.target.value)}
                    maxLength={2500}
                    placeholder="e.g. AWS Solutions Architect, PMP, CKA"
                  />
                </label>
              </div>

              <label style={{ marginTop: 14 }}>
                Key skills (comma or newline separated)
                <textarea
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  rows={3}
                  maxLength={2500}
                  placeholder="e.g. Project management, Patient care, Sales, Python, Customer service"
                />
              </label>

              {skillChips.length > 0 && (
                <div className="talent-skill-tags">
                  {skillChips.map((skill, index) => (
                    <span key={index} className="talent-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Work Experience */}
            <div className="talent-section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3><Building2 size={18} color="#2563eb" /> Work Experience</h3>
                  <p className="sub" style={{ margin: 0 }}>Add your previous and current roles.</p>
                </div>
                <button type="button" className="talent-add-btn" onClick={addWork}>
                  <Plus size={16} /> Add Experience
                </button>
              </div>

              {workHistory.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#64748b" }}>No work experience added yet.</p>
                  <button type="button" className="talent-add-btn" onClick={addWork}>
                    <Plus size={15} /> Add your first experience
                  </button>
                </div>
              ) : (
                <div className="talent-repeatable-list">
                  {workHistory.map((item, idx) => (
                    <div key={item.id || idx} className="talent-repeatable-item">
                      <div className="talent-repeatable-head">
                        <h4>Role #{idx + 1}: {item.title || "Job Title"} {item.company ? `at ${item.company}` : ""}</h4>
                        <button type="button" className="talent-delete-btn" onClick={() => removeWork(idx)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      <div className="talent-form-grid">
                        <label>
                          Job title / Role *
                          <input
                            value={item.title}
                            onChange={e => updateWork(idx, { title: e.target.value })}
                            placeholder="e.g. Lead Frontend Engineer"
                            maxLength={120}
                          />
                        </label>
                        <label>
                          Company / Organization *
                          <input
                            value={item.company}
                            onChange={e => updateWork(idx, { company: e.target.value })}
                            placeholder="e.g. Acme Tech Solutions"
                            maxLength={120}
                          />
                        </label>
                      </div>
                      <div className="talent-form-grid" style={{ marginTop: 12 }}>
                        <label>
                          Location
                          <input
                            value={item.location || ""}
                            onChange={e => updateWork(idx, { location: e.target.value })}
                            placeholder="e.g. Remote / Bengaluru"
                            maxLength={120}
                          />
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <label>
                            Start date
                            <input
                              value={item.startDate}
                              onChange={e => updateWork(idx, { startDate: e.target.value })}
                              placeholder="e.g. Jan 2022"
                              maxLength={50}
                            />
                          </label>
                          <label>
                            End date
                            <input
                              value={item.current ? "Present" : item.endDate || ""}
                              disabled={item.current}
                              onChange={e => updateWork(idx, { endDate: e.target.value })}
                              placeholder="e.g. Dec 2024"
                              maxLength={50}
                            />
                          </label>
                        </div>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={item.current ?? false}
                          onChange={e => updateWork(idx, { current: e.target.checked, endDate: e.target.checked ? "" : item.endDate })}
                          style={{ width: "16px", height: "16px", accentColor: "#2563eb", margin: 0 }}
                        />
                        <span>I currently work here</span>
                      </label>
                      <label style={{ marginTop: 12 }}>
                        Responsibilities & key accomplishments
                        <textarea
                          value={item.description || ""}
                          onChange={e => updateWork(idx, { description: e.target.value })}
                          rows={3}
                          maxLength={2500}
                          placeholder="Describe your contributions, impact on metrics, and leadership responsibilities..."
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 6: Education & Qualifications */}
            <div className="talent-section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3><GraduationCap size={18} color="#2563eb" /> Education & Degrees</h3>
                  <p className="sub" style={{ margin: 0 }}>List your educational qualifications, degrees, or certifications.</p>
                </div>
                <button type="button" className="talent-add-btn" onClick={addEducation}>
                  <Plus size={16} /> Add Education
                </button>
              </div>

              {educationHistory.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#64748b" }}>No education records added yet.</p>
                  <button type="button" className="talent-add-btn" onClick={addEducation}>
                    <Plus size={15} /> Add Education
                  </button>
                </div>
              ) : (
                <div className="talent-repeatable-list">
                  {educationHistory.map((item, idx) => (
                    <div key={item.id || idx} className="talent-repeatable-item">
                      <div className="talent-repeatable-head">
                        <h4>Qualification #{idx + 1}: {item.degree || "Degree"}</h4>
                        <button type="button" className="talent-delete-btn" onClick={() => removeEducation(idx)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      <div className="talent-form-grid">
                        <label>
                          Degree / Diploma *
                          <input
                            value={item.degree}
                            onChange={e => updateEducation(idx, { degree: e.target.value })}
                            placeholder="e.g. B.Tech / B.E. / M.S. / MBA"
                            maxLength={120}
                          />
                        </label>
                        <label>
                          Field of study / Major
                          <input
                            value={item.field || ""}
                            onChange={e => updateEducation(idx, { field: e.target.value })}
                            placeholder="e.g. Computer Science & Engineering"
                            maxLength={120}
                          />
                        </label>
                      </div>
                      <div className="talent-form-grid" style={{ marginTop: 12 }}>
                        <label>
                          College / University *
                          <input
                            value={item.institution}
                            onChange={e => updateEducation(idx, { institution: e.target.value })}
                            placeholder="e.g. University, college or training institute"
                            maxLength={160}
                          />
                        </label>
                        <label>
                          Graduation year
                          <input
                            value={item.graduationYear || ""}
                            onChange={e => updateEducation(idx, { graduationYear: e.target.value })}
                            placeholder="e.g. 2021"
                            maxLength={30}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ResumeLibrary current={resumeUrl} onDelete={url => { if (url === resumeUrl) setResumeUrl(""); }} />
            {/* Section 7: Resume, Portfolio & Social Profiles */}
            <div className="talent-section-card">
              <h3><FileText size={18} color="#2563eb" /> Resume & Professional Links</h3>
              <p className="sub">Import your resume above to store it privately, or use a complete HTTPS link.</p>
              <div className="talent-form-grid">
                <label>
                  Resume / CV link or private uploaded file
                  <input
                    type="text"
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    maxLength={1500}
                    placeholder="https://drive.google.com/..."
                  />
                  <small>
                    Use your imported file, or an HTTPS link you control.{" "}
                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                        Test link ↗
                      </a>
                    )}
                  </small>
                </label>
                <label>
                  LinkedIn profile link (HTTPS)
                  <input
                    type="url"
                    pattern="https://.*"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    maxLength={1500}
                    placeholder="https://linkedin.com/in/username"
                  />
                </label>
              </div>

              <div className="talent-form-grid" style={{ marginTop: 14 }}>
                <label>
                  GitHub profile link (HTTPS)
                  <input
                    type="url"
                    pattern="https://.*"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    maxLength={1500}
                    placeholder="https://github.com/username"
                  />
                </label>
                <label>
                  Portfolio / Personal website (HTTPS)
                  <input
                    type="url"
                    pattern="https://.*"
                    value={portfolioUrl}
                    onChange={e => setPortfolioUrl(e.target.value)}
                    maxLength={1500}
                    placeholder="https://yourname.dev"
                  />
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
              <button className="talent-button" disabled={busy} type="submit" style={{ minWidth: "180px" }}>
                {busy ? "Saving profile…" : "Save Complete Profile"}
                <CheckCircle2 size={17} />
              </button>
              <button
                type="button"
                className="talent-button talent-secondary"
                onClick={() => { setTab("preview"); setMessage(""); setError(""); }}
              >
                <Eye size={16} /> Preview As Recruiter
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 4: PROFILE PREVIEW (HOW RECRUITERS SEE IT) */}
      {tab === "preview" && (
        <section className="talent-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
            <div>
              <span className="talent-eyebrow">RECRUITER PERSPECTIVE</span>
              <h2>Candidate Profile Preview</h2>
              <p style={{ margin: "4px 0 0" }}>
                This is how your verified profile appears to ATSAI recruitment partners and employers.
              </p>
            </div>
            <button
              type="button"
              className="talent-button"
              onClick={() => { setTab("profile"); setMessage(""); setError(""); }}
            >
              <Edit3 size={15} /> Edit Profile Details
            </button>
          </div>

          <div style={{ background: "#fbfcfe", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "32px" }}>
            {/* Candidate Dossier Header */}
            <div className="talent-preview-hero">
              <div className="talent-avatar" style={{ overflow: "hidden" }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  initials
                )}
              </div>
              <div className="talent-preview-info" style={{ flex: 1 }}>
                <h3>{name}</h3>
                {headline ? (
                  <p className="talent-preview-headline">{headline}</p>
                ) : (
                  <p style={{ color: "#94a3b8", fontStyle: "italic", margin: "0 0 8px", fontSize: "14px" }}>
                    No headline set yet. <button type="button" onClick={() => setTab("profile")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}>Add headline</button>
                  </p>
                )}
                <div className="talent-preview-meta">
                  {location && <span><MapPin size={15} color="#64748b" /> {location}</span>}
                  {phone && <span>📞 {phone}</span>}
                  <span>✉️ {data.user.email} (Verified)</span>
                </div>

                {/* Badges */}
                <div className="talent-preview-badges">
                  <span className="talent-pill talent-pill-highlight">
                    <Award size={14} /> {experience} Years Experience
                  </span>
                  <span className="talent-pill">
                    <Clock size={14} /> Notice: {noticePeriod || "Not specified"}
                  </span>
                  {expectedSalary && (
                    <span className="talent-pill">
                      💰 Expected: {expectedSalary}
                    </span>
                  )}
                  {employmentType && (
                    <span className="talent-pill">
                      💼 {employmentType}
                    </span>
                  )}
                  {openToRelocation && (
                    <span className="talent-pill talent-pill-success">
                      ✈️ Open to Relocation
                    </span>
                  )}
                </div>

                {/* External links */}
                <div className="talent-links-row">
                  {resumeUrl && (
                    <a className="talent-link-btn primary" href={resumeUrl} target="_blank" rel="noreferrer">
                      <FileText size={15} /> View Resume / CV <ExternalLink size={13} />
                    </a>
                  )}
                  {linkedinUrl && (
                    <a className="talent-link-btn" href={linkedinUrl} target="_blank" rel="noreferrer">
                      <Globe size={15} /> LinkedIn <ExternalLink size={13} />
                    </a>
                  )}
                  {githubUrl && (
                    <a className="talent-link-btn" href={githubUrl} target="_blank" rel="noreferrer">
                      <Globe size={15} /> GitHub <ExternalLink size={13} />
                    </a>
                  )}
                  {portfolioUrl && (
                    <a className="talent-link-btn" href={portfolioUrl} target="_blank" rel="noreferrer">
                      <Globe size={15} /> Portfolio <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* About / Bio */}
            {bio && (
              <div className="talent-preview-section">
                <h4><UserRound size={17} color="#2563eb" /> Executive Summary</h4>
                <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#334155", whiteSpace: "pre-wrap", margin: 0 }}>
                  {bio}
                </p>
              </div>
            )}

            {/* Core Skills */}
            {skillChips.length > 0 && (
              <div className="talent-preview-section">
                <h4><Sparkles size={17} color="#2563eb" /> Core Skills & Competencies</h4>
                <div className="talent-skill-tags">
                  {skillChips.map((skill, index) => (
                    <span key={index} className="talent-skill-tag" style={{ fontSize: "13px", padding: "6px 13px" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work History */}
            {workHistory.length > 0 && (
              <div className="talent-preview-section">
                <h4><Building2 size={17} color="#2563eb" /> Experience History</h4>
                <div className="talent-timeline-list">
                  {workHistory.map((work, idx) => (
                    <div key={work.id || idx} className="talent-timeline-card">
                      <h5>{work.title || "Role"}</h5>
                      <div className="talent-timeline-company">{work.company} {work.location ? `· ${work.location}` : ""}</div>
                      <div className="talent-timeline-dates">
                        {work.startDate} — {work.current ? "Present" : work.endDate || "Present"}
                      </div>
                      {work.description && <div className="talent-timeline-desc">{work.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education History */}
            {educationHistory.length > 0 && (
              <div className="talent-preview-section">
                <h4><GraduationCap size={17} color="#2563eb" /> Education & Academic Credentials</h4>
                <div className="talent-repeatable-list">
                  {educationHistory.map((edu, idx) => (
                    <div key={edu.id || idx} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "16px 20px", borderRadius: "12px" }}>
                      <strong style={{ fontSize: "15px", color: "#0f172a" }}>{edu.degree}</strong>
                      {edu.field && <span style={{ color: "#2563eb", marginLeft: 6 }}>in {edu.field}</span>}
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                        {edu.institution} {edu.graduationYear ? `· Class of ${edu.graduationYear}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications && (
              <div className="talent-preview-section">
                <h4><Award size={17} color="#2563eb" /> Certifications & Licenses</h4>
                <p style={{ fontSize: "14px", color: "#334155", margin: 0, whiteSpace: "pre-wrap" }}>
                  {certifications}
                </p>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <small style={{ color: "#64748b" }}>
                ✓ This profile snapshot is attached automatically to applications you submit through ATSAI.
              </small>
              <button
                type="button"
                className="talent-button"
                onClick={() => { setTab("profile"); setMessage(""); setError(""); }}
              >
                <Edit3 size={15} /> Edit Profile
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: ACCOUNT & SECURITY */}
      {tab === "account" && (
        <section className="talent-card">
          <h2>Account & privacy</h2>
          <p>Account email: <strong>{data.user.email}</strong></p>
          <form className="talent-form" onSubmit={handlePassword}>
            <label>
              Current password
              <input name="currentPassword" type="password" required autoComplete="current-password" maxLength={128} />
            </label>
            <label>
              New password
              <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
            </label>
            <button className="talent-button" disabled={busy}>Change password</button>
          </form>
          <hr />
          <h3>Request access, correction, or account deletion</h3>
          <p>Send a data request and the team will review it with you.</p>
          <Link className="talent-button talent-secondary" href="/privacy-request">
            Make a privacy request
          </Link>
        </section>
      )}

      {/* SYNC CONFIRMATION MODAL */}
      {syncModalOpen && parsedResult && (
        <div className="talent-sync-modal-backdrop" onClick={() => setSyncModalOpen(false)}>
          <div className="talent-sync-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span className="talent-eyebrow" style={{ color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} /> INTELLIGENT RESUME SYNC
                </span>
                <h2 style={{ fontSize: "22px", margin: "4px 0 2px", color: "#0f172a" }}>Review Extracted Profile Data</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Source: <strong>{parsedSource}</strong> · Parsed & mapped to candidate profile fields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <input type="checkbox" checked={replaceFromResume} onChange={e => setReplaceFromResume(e.target.checked)} />
              Replace existing details with detected resume details
            </label>
            <p style={{ fontSize: 13, color: "#475569" }}>{replaceFromResume ? "Detected values will replace matching profile details. Fields missing from the resume keep their existing values." : "We fill empty fields and add new skills, roles and education while preserving your existing details."} Your account email stays unchanged.</p>
            {parsedResult.warnings?.map(warning => <p key={warning} style={{ fontSize: 13, color: "#92400e" }}>{warning}</p>)}
            <div className="talent-sync-preview-grid">
              <div className="talent-sync-stat">
                <span>Extracted Name</span>
                <strong>{parsedResult.name || name || "(Unchanged)"}</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Headline / Title</span>
                <strong title={parsedResult.headline} style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}>{parsedResult.headline || headline || "(Unchanged)"}</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Phone Number</span>
                <strong>{parsedResult.phone || phone || "(None detected)"}</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Location</span>
                <strong>{parsedResult.location || location || "(None detected)"}</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Total Experience</span>
                <strong>{parsedResult.experience > 0 ? `${parsedResult.experience} Years` : `${experience} Years`}</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Work History</span>
                <strong>{parsedResult.workHistory?.length || 0} Roles Extracted</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Education</span>
                <strong>{parsedResult.educationHistory?.length || 0} Degrees Extracted</strong>
              </div>
              <div className="talent-sync-stat">
                <span>Links & Portfolios</span>
                <strong>
                  {[parsedResult.linkedinUrl && "LinkedIn", parsedResult.githubUrl && "GitHub", parsedResult.portfolioUrl && "Portfolio"].filter(Boolean).join(", ") || "None"}
                </strong>
              </div>
            </div>

            {!!parsedResult.workHistory.length && <div style={{ marginBottom: 16 }}><strong>Detected work experience</strong>{parsedResult.workHistory.map(role => <p key={role.id}>{role.title || "Role not detected"} · {role.company || "Company not detected"}<br />{role.startDate} – {role.current ? "Present" : role.endDate}</p>)}</div>}
            {!!parsedResult.educationHistory.length && <div style={{ marginBottom: 16 }}><strong>Detected education</strong>{parsedResult.educationHistory.map(item => <p key={item.id}>{item.degree} · {item.institution || "Institution not detected"} {item.graduationYear}</p>)}</div>}
            {parsedResult.skills && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Extracted Skills:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: "90px", overflowY: "auto", padding: "8px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  {parsedResult.skills.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).map((s, idx) => (
                    <span key={idx} className="talent-skill-tag" style={{ fontSize: "11px", padding: "3px 8px" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedResult.bio && (
              <div style={{ marginBottom: 18, background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Summary / Bio Extracted:
                </span>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.5, maxHeight: "80px", overflowY: "auto" }}>
                  {parsedResult.bio}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 22, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                className="talent-button talent-secondary"
                onClick={() => setSyncModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="talent-button talent-secondary"
                disabled={busy}
                onClick={() => applyParsedResume(false)}
                style={{ borderColor: "#2563eb", color: "#2563eb" }}
              >
                Apply to Form & Review
              </button>
              <button
                type="button"
                className="talent-button"
                disabled={busy}
                onClick={() => applyParsedResume(true)}
              >
                <Check size={16} /> Apply & Save Profile Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE RESUME TEXT MODAL */}
      {pasteModalOpen && (
        <div className="talent-sync-modal-backdrop" onClick={() => setPasteModalOpen(false)}>
          <div className="talent-sync-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span className="talent-eyebrow" style={{ color: "#2563eb" }}>PASTE & SYNC</span>
                <h2 style={{ fontSize: "22px", margin: "4px 0 2px", color: "#0f172a" }}>Paste Resume or CV Text</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Copy plain text from any document (Word, Google Doc, LinkedIn export, or text file) and paste it below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            {pasteError && <div className="talent-alert" style={{ margin: "12px 0" }}>{pasteError}</div>}

            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste your full resume text here...&#10;&#10;e.g.:&#10;John Doe&#10;Senior Full-Stack Engineer&#10;Email: john@example.com | Phone: +91 9876543210&#10;&#10;SUMMARY&#10;Over 6 years of experience building web applications...&#10;&#10;SKILLS&#10;React, Next.js, Node.js, TypeScript, PostgreSQL&#10;&#10;EXPERIENCE&#10;Senior Software Engineer | Tech Corp | 2021 - Present&#10;..."
              rows={12}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "13px", lineHeight: 1.6, fontFamily: "inherit", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                className="talent-button talent-secondary"
                onClick={() => { setPasteModalOpen(false); setPastedText(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="talent-button"
                disabled={parsingBusy || !pastedText.trim()}
                onClick={handlePasteSubmit}
              >
                {parsingBusy ? (
                  <>
                    <Loader2 size={16} className="talent-spin" /> Analyzing resume…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Analyze & Extract Fields
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CandidateApply({ job, user }: { job: { id: string; title: string; company: string }; user: Candidate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError("");
    try {
      const response = await api("apply", { jobId: job.id, coverLetter: values.coverLetter, consent: values.consent === "on" });
      setReference(response.reference);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isProfileComplete = !!user.profile.skills && !!user.profile.location && !!user.profile.headline;

  return (
    <div className="talent-container talent-narrow">
      <span className="talent-eyebrow">YOUR NEXT OPPORTUNITY</span>
      <h1>{job.title}</h1>
      <p>{job.company}</p>
      <section className="talent-card">
        {reference ? (
          <>
            <Notice message={`Application saved. Reference ${reference}`} />
            <p>Track updates in your candidate workspace. No email confirmation has been sent.</p>
            <Link className="talent-button" href="/candidate/dashboard">View my applications</Link>
          </>
        ) : (
          <>
            <h2>A thoughtful introduction.</h2>
            <p>Applying as <strong>{user.name}</strong> · {user.email}</p>
            {user.profile.headline && (
              <p style={{ fontWeight: 600, color: "#2563eb", margin: "-6px 0 12px" }}>
                {user.profile.headline}
              </p>
            )}
            <p>
              Your verified profile snapshot will be included with this application.{" "}
              <Link href="/candidate/dashboard?tab=profile">Review or edit your profile first</Link>.
            </p>
            {!isProfileComplete && (
              <div className="talent-alert" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af", display: "flex", gap: 8, alignItems: "center" }}>
                <Sparkles size={18} color="#2563eb" />
                <span>
                  Tip: Adding your headline, work history, and resume link helps employers assess your application faster.{" "}
                  <Link href="/candidate/dashboard?tab=profile" style={{ fontWeight: 600, textDecoration: "underline" }}>Complete Profile</Link>
                </span>
              </div>
            )}
            <Notice error={error} />
            <form className="talent-form" onSubmit={submit}>
              <label>
                Introduce yourself <small>Optional cover note</small>
                <textarea name="coverLetter" rows={6} maxLength={6000} placeholder="Share why this role excites you and what relevant impact you bring..." />
              </label>
              <Consent
                label={
                  <>
                    I want to apply for this role and consent to ATSAI reviewing my profile and application for this opportunity. See the <Link href="/legal/privacy-policy">privacy notice</Link>.
                  </>
                }
              />
              <button className="talent-button" disabled={busy}>
                {busy ? "Submitting…" : "Submit application"}
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export function JobActions({ id }: { id: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <><button className="talent-button talent-secondary" disabled={busy} onClick={async () => { setBusy(true); try { const result = await api("saved", { jobId: id }); setMessage(result.saved ? "Saved to your account." : "Removed from saved jobs."); } catch (error) { if ((error as Error & { status?: number }).status === 401) router.push("/candidate/login"); else setMessage((error as Error).message); } finally { setBusy(false); } }}><Bookmark size={16} />Save this role</button>{message && <p role="status">{message}</p>}</>;
}

export function RecruiterLookup() {
  const [query, setQuery] = useState(""); const [result, setResult] = useState<{ verified: boolean; recruiter: Recruiter | null } | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <section className="talent-card"><form className="talent-form" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(""); setResult(null); try { setResult(await api(`verify?q=${encodeURIComponent(query.trim())}`)); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}><label>Recruiter ID or exact work email<input required value={query} onChange={event => setQuery(event.target.value)} maxLength={254} /></label><button className="talent-button" disabled={busy}>{busy ? "Checking…" : "Check recruiter"}<ShieldCheck size={17} /></button></form><Notice error={error} />{result && <div className={result.verified ? "talent-success-panel" : "talent-empty"}><h2>{result.verified ? "Listed in the ATSAI directory" : "No active directory match"}</h2>{result.recruiter ? <><strong>{result.recruiter.name}</strong><p>{result.recruiter.title} · {result.recruiter.email}</p><small>ID: {result.recruiter.id}</small><p>A directory match does not prove who sent you a message. Confirm through the listed work email.</p></> : <p>Check the email or recruiter ID and try again. If you are uncertain, <Link href="/contact">contact the team</Link> before sharing information. A missing entry alone does not establish fraud.</p>}</div>}</section>;
}

const STAGE_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  submitted: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  review: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  shortlisted: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  interview: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
  interviewed: { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
  selected: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  offer: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  hired: { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" },
  rejected: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  withdrawn: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

type Inbox = { inquiries: Inquiry[]; applications: (Application & { name: string; email: string })[]; candidates: (Omit<Candidate, "profile"> & { profile: string })[]; recruiters: Recruiter[] };
export function RecruitmentInbox() {
  const [data, setData] = useState<Inbox | null>(null);
  const [tab, setTab] = useState("applications");
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);

  // Modals state for Edit and Delete
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "application" | "inquiry" | "candidate" | "recruiter";
    id: string;
    title: string;
  } | null>(null);

  const [editApp, setEditApp] = useState<{
    id: string;
    jobTitle: string;
    candidateName: string;
    candidateEmail: string;
    headline: string;
    skills: string;
    experience: number;
    location: string;
    phone: string;
    noticePeriod: string;
    coverLetter: string;
    resumeUrl: string;
    portfolioUrl: string;
  } | null>(null);

  const [editInquiry, setEditInquiry] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    subject: string;
    message: string;
    status: "new" | "in-progress" | "resolved";
  } | null>(null);

  const [editCandidate, setEditCandidate] = useState<{
    id: string;
    name: string;
    email: string;
    headline: string;
    skills: string;
    experience: number;
    location: string;
    phone: string;
    resumeUrl: string;
  } | null>(null);

  const [editRecruiter, setEditRecruiter] = useState<{
    id: string;
    name: string;
    email: string;
    title: string;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    api("admin")
      .then(result => {
        if (active) {
          setData(result);
          if (result.applications?.length && !expandedId) {
            setExpandedId(result.applications[0].id);
          }
        }
      })
      .catch(error => {
        if (active) setError(error.message);
      });
    return () => { active = false; };
  }, []);

  async function update(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await api(`admin/${path}`, body);
      setData(await api("admin"));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      await api("admin/delete", { kind: deleteTarget.kind, id: deleteTarget.id });
      setData(await api("admin"));
      setActionSuccess(`${deleteTarget.kind.charAt(0).toUpperCase() + deleteTarget.kind.slice(1)} deleted successfully.`);
      setTimeout(() => setActionSuccess(""), 4000);
      setDeleteTarget(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEditApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editApp) return;
    setBusy(true);
    setError("");
    try {
      await api("admin/edit-application", editApp);
      setData(await api("admin"));
      setActionSuccess("Application details updated successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
      setEditApp(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEditInquiry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editInquiry) return;
    setBusy(true);
    setError("");
    try {
      await api("admin/edit-inquiry", editInquiry);
      setData(await api("admin"));
      setActionSuccess("Inquiry updated successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
      setEditInquiry(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEditCandidate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editCandidate) return;
    setBusy(true);
    setError("");
    try {
      await api("admin/edit-candidate", editCandidate);
      setData(await api("admin"));
      setActionSuccess("Candidate profile updated successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
      setEditCandidate(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEditRecruiter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRecruiter) return;
    setBusy(true);
    setError("");
    try {
      await api("admin/edit-recruiter", editRecruiter);
      setData(await api("admin"));
      setActionSuccess("Recruiter entry updated successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
      setEditRecruiter(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function status(id: string, kind: "inquiry" | "application", value: string) {
    return (
      <select
        aria-label={`Status for ${id}`}
        disabled={busy || value === "withdrawn"}
        value={value}
        onChange={event => void update("status", { id, kind, status: event.target.value })}
      >
        {(kind === "inquiry"
          ? ["new", "in-progress", "resolved"]
          : ["submitted", "review", "shortlisted", "interview", "offer", "hired", "rejected", ...(value === "withdrawn" ? ["withdrawn"] : [])]
        ).map(state => (
          <option key={state} value={state}>{label(state)}</option>
        ))}
      </select>
    );
  }

  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];
    return data.applications.filter(item => {
      const matchesStage = stageFilter === "all" || item.status === stageFilter;
      const q = search.trim().toLowerCase();
      if (!q) return matchesStage;
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.jobTitle.toLowerCase().includes(q) ||
        `app-${item.id.slice(0, 8)}`.toLowerCase().includes(q);
      return matchesStage && matchesSearch;
    });
  }, [data?.applications, search, stageFilter]);

  const stageCounts = useMemo(() => {
    if (!data?.applications) return {};
    const counts: Record<string, number> = {};
    for (const a of data.applications) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return counts;
  }, [data?.applications]);

  const activeStages = useMemo(() => {
    return Object.keys(stageCounts);
  }, [stageCounts]);

  return (
    <section className="talent-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Recruitment Inbox</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
            Review candidate applications, manage hiring decisions, edit records, and remove test or completed items.
          </p>
        </div>
      </div>

      <div className="talent-tabs">
        {["applications", "inquiries", "candidates", "recruiters"].map(key => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => { setTab(key); setSearch(""); setStageFilter("all"); }}
          >
            {label(key)} {data ? `(${data[key as keyof Inbox].length})` : ""}
          </button>
        ))}
      </div>

      <Notice error={error} message={actionSuccess} />
      {!data && !error && <p>Loading recruitment inbox…</p>}

      {data && (
        <>
          {tab === "inquiries" && (
            <>
              {!data.inquiries.length && <p>No inquiries yet.</p>}
              {data.inquiries.map(item => {
                const isOpen = expandedInquiryId === item.id;
                return (
                  <article key={item.id} className="talent-app-card" style={{ marginBottom: 10 }}>
                    <div 
                      className="talent-app-card-head"
                      onClick={() => setExpandedInquiryId(isOpen ? null : item.id)}
                    >
                      <div className="talent-app-summary">
                        <div className="talent-app-avatar" style={{ background: "#475569" }}>
                          {(item.name || "I").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="talent-app-meta">
                          <div className="talent-app-title-row">
                            <span className="talent-app-name">{item.subject}</span>
                            <span className="talent-app-ref">{item.kind} · ATS-{item.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="talent-app-subinfo">
                            <span>{item.name}</span>
                            <span>·</span>
                            <a href={`mailto:${item.email}`} onClick={e => e.stopPropagation()}>{item.email}</a>
                            {item.phone && <span>· {item.phone}</span>}
                            <span>· {date(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="talent-app-actions" onClick={e => e.stopPropagation()}>
                        {status(item.id, "inquiry", item.status)}
                        <button
                          type="button"
                          className="talent-action-btn"
                          title="Edit inquiry"
                          onClick={() => setEditInquiry({
                            id: item.id,
                            name: item.name,
                            email: item.email,
                            phone: item.phone || "",
                            company: item.company || "",
                            subject: item.subject,
                            message: item.message,
                            status: (item.status as "new" | "in-progress" | "resolved") || "new"
                          })}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="talent-action-btn talent-action-btn-danger"
                          title="Delete inquiry"
                          onClick={() => setDeleteTarget({
                            kind: "inquiry",
                            id: item.id,
                            title: `Inquiry "${item.subject}" from ${item.name}`
                          })}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="talent-app-toggle-btn"
                          onClick={() => setExpandedInquiryId(isOpen ? null : item.id)}
                        >
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="talent-app-card-body" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Inquiry Message</div>
                        <p className="talent-preserve" style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#1e293b" }}>{item.message}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}

          {tab === "applications" && (
            <>
              {/* Smart Toolbar */}
              <div className="talent-inbox-toolbar">
                <div className="talent-inbox-search">
                  <Search size={15} color="#94a3b8" />
                  <input
                    type="search"
                    aria-label="Search applications"
                    placeholder="Search candidate name, role, email, or reference…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
                    >
                      <X size={14} color="#94a3b8" />
                    </button>
                  )}
                </div>

                <div className="talent-inbox-filters">
                  <button
                    type="button"
                    className={`talent-filter-chip ${stageFilter === "all" ? "active" : ""}`}
                    onClick={() => setStageFilter("all")}
                  >
                    All <span className="count">{data.applications.length}</span>
                  </button>
                  {activeStages.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`talent-filter-chip ${stageFilter === s ? "active" : ""}`}
                      onClick={() => setStageFilter(stageFilter === s ? "all" : s)}
                    >
                      {STAGE_LABELS[s as Stage] || s} <span className="count">{stageCounts[s]}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="talent-app-toggle-btn"
                    onClick={() => setExpandedId(expandedId ? null : (filteredApplications[0]?.id || null))}
                  >
                    {expandedId ? "Collapse open" : "Expand top"}
                  </button>
                </div>
              </div>

              {!filteredApplications.length && (
                <div className="talent-empty" style={{ padding: "32px 20px" }}>
                  <p>No applications match your filter.</p>
                  {(search || stageFilter !== "all") && (
                    <button
                      type="button"
                      className="talent-button talent-secondary"
                      style={{ minHeight: 36, padding: "8px 14px", fontSize: 12, marginTop: 8 }}
                      onClick={() => { setSearch(""); setStageFilter("all"); }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {filteredApplications.map(item => {
                let document: { profile: CandidateProfile; coverLetter: string };
                try {
                  document = JSON.parse(item.document);
                } catch {
                  document = { profile: { phone: "", location: "", skills: "", experience: 0, resumeUrl: "" }, coverLetter: "" };
                }
                const p = document.profile;
                const isExpanded = expandedId === item.id;
                const theme = STAGE_THEMES[item.status] || { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
                const initials = (item.name || "C").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

                const openEditApp = () => setEditApp({
                  id: item.id,
                  jobTitle: item.jobTitle,
                  candidateName: item.name,
                  candidateEmail: item.email,
                  headline: p.headline || "",
                  skills: p.skills || "",
                  experience: p.experience ?? 0,
                  location: p.location || "",
                  phone: p.phone || "",
                  noticePeriod: p.noticePeriod || "",
                  coverLetter: document.coverLetter || "",
                  resumeUrl: p.resumeUrl || "",
                  portfolioUrl: p.portfolioUrl || "",
                });

                const openDeleteApp = () => setDeleteTarget({
                  kind: "application",
                  id: item.id,
                  title: `Application for ${item.name} (${item.jobTitle}) [APP-${item.id.slice(0, 8).toUpperCase()}]`
                });

                return (
                  <article key={item.id} className={`talent-app-card ${isExpanded ? "expanded" : ""}`}>
                    <div 
                      className="talent-app-card-head"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="talent-app-summary">
                        <div className="talent-app-avatar" style={{ background: isExpanded ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : undefined }}>
                          {initials}
                        </div>
                        <div className="talent-app-meta">
                          <div className="talent-app-title-row">
                            <span className="talent-app-name">{item.name}</span>
                            <span style={{ color: "#94a3b8" }}>·</span>
                            <span className="talent-app-role">{item.jobTitle}</span>
                            <span className="talent-app-ref">APP-{item.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="talent-app-subinfo">
                            <a href={`mailto:${item.email}`} onClick={e => e.stopPropagation()}>{item.email}</a>
                            <span>·</span>
                            <span>{p.location ? `${p.location} · ` : ""}{p.experience ?? 0} yrs exp</span>
                            {p.noticePeriod && (
                              <>
                                <span>·</span>
                                <span>Notice: <strong>{p.noticePeriod}</strong></span>
                              </>
                            )}
                            {p.resumeUrl && (
                              <>
                                <span>·</span>
                                <a href={p.resumeUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Resume ↗</a>
                              </>
                            )}
                            {p.portfolioUrl && (
                              <>
                                <span>·</span>
                                <a href={p.portfolioUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Portfolio ↗</a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="talent-app-actions" onClick={e => e.stopPropagation()}>
                        <span 
                          className="talent-app-stage-pill"
                          style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                        >
                          {STAGE_LABELS[item.status as Stage] || item.status}
                        </span>

                        <button
                          type="button"
                          className="talent-action-btn"
                          title="Edit application details"
                          onClick={openEditApp}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="talent-action-btn talent-action-btn-danger"
                          title="Delete application"
                          onClick={openDeleteApp}
                        >
                          <Trash2 size={13} />
                        </button>

                        <button 
                          type="button" 
                          className="talent-app-toggle-btn"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <span>{isExpanded ? "Collapse" : "Manage"}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="talent-app-card-body">
                        {p.headline && (
                          <div style={{ marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{p.headline}</span>
                          </div>
                        )}
                        {p.skills && (
                          <div style={{ marginBottom: 10, fontSize: 13, color: "#475569" }}>
                            <strong style={{ color: "#1e293b" }}>Skills:</strong> {p.skills}
                          </div>
                        )}
                        {p.workHistory && p.workHistory.length > 0 && (
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "10px", margin: "10px 0 14px", fontSize: "13px" }}>
                            <strong style={{ color: "#0f172a" }}>Recent experience:</strong> {p.workHistory[0].title} at {p.workHistory[0].company} ({p.workHistory[0].startDate} - {p.workHistory[0].current ? "Present" : p.workHistory[0].endDate || "Present"})
                          </div>
                        )}
                        {document.coverLetter && (
                          <div style={{ background: "#fafafa", borderLeft: "3px solid #cbd5e1", padding: "10px 14px", margin: "10px 0 14px", fontSize: "13px", color: "#334155" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 4 }}>Candidate Note / Cover Letter</div>
                            <p className="talent-preserve" style={{ margin: 0 }}>{document.coverLetter}</p>
                          </div>
                        )}

                        {/* Status Update Form & Collapsible Email Logs */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", marginTop: 12 }}>
                          <ApplicationStatusEditor application={item} scope="admin" onUpdated={async () => setData(await api("admin"))} />
                          <EmailDelivery key={item.updatedAt} applicationId={item.id} scope="admin" />
                        </div>

                        {/* Bottom Action Bar for Easy Edit / Delete */}
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px dashed #e2e8f0" }}>
                          <button
                            type="button"
                            className="talent-action-btn"
                            onClick={openEditApp}
                          >
                            <Edit3 size={13} />
                            <span>Edit application details</span>
                          </button>
                          <button
                            type="button"
                            className="talent-action-btn talent-action-btn-danger"
                            onClick={openDeleteApp}
                          >
                            <Trash2 size={13} />
                            <span>Delete application</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}

          {tab === "candidates" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {!data.candidates.length && <p>No registered candidates yet.</p>}
              {data.candidates.map(item => {
                let profile: CandidateProfile;
                try {
                  profile = JSON.parse(item.profile);
                } catch {
                  profile = { phone: "", location: "", skills: "", experience: 0, resumeUrl: "" };
                }
                const initials = (item.name || "C").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
                return (
                  <article className="talent-app-card" key={item.id} style={{ margin: 0, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div className="talent-app-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.name}</h4>
                        <a href={`mailto:${item.email}`} style={{ fontSize: 12, color: "#64748b" }}>{item.email}</a>
                      </div>
                    </div>
                    {profile.headline && <p style={{ fontWeight: 600, color: "#2563eb", margin: "0 0 6px", fontSize: 12 }}>{profile.headline}</p>}
                    <p style={{ fontSize: 12, color: "#475569", margin: "4px 0" }}>
                      {profile.location ? `${profile.location} · ` : ""}{profile.experience ?? 0} yrs experience
                    </p>
                    {profile.skills && (
                      <p style={{ fontSize: 11, color: "#64748b", margin: "6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {profile.skills}
                      </p>
                    )}
                    {profile.resumeUrl && (
                      <div style={{ marginTop: 8 }}>
                        <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                          View resume / portfolio ↗
                        </a>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                      <button
                        type="button"
                        className="talent-action-btn"
                        onClick={() => setEditCandidate({
                          id: item.id,
                          name: item.name,
                          email: item.email,
                          headline: profile.headline || "",
                          skills: profile.skills || "",
                          experience: profile.experience ?? 0,
                          location: profile.location || "",
                          phone: profile.phone || "",
                          resumeUrl: profile.resumeUrl || "",
                        })}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="talent-action-btn talent-action-btn-danger"
                        onClick={() => setDeleteTarget({
                          kind: "candidate",
                          id: item.id,
                          title: `Candidate account for ${item.name} (${item.email})`
                        })}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "recruiters" && (
            <>
              <h3>Public recruiter directory</h3>
              <p>Only add people whose work email and authority you have confirmed. Active entries are publicly searchable by exact email or ID.</p>
              <form
                className="talent-form"
                onSubmit={event => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  void update("recruiter", Object.fromEntries(new FormData(form)));
                  form.reset();
                }}
              >
                <div className="talent-form-grid">
                  <label>Name<input name="name" required minLength={2} maxLength={80} /></label>
                  <label>Work email<input name="email" type="email" required maxLength={254} /></label>
                </div>
                <label>Role / title<input name="title" required minLength={2} maxLength={120} /></label>
                <button className="talent-button" disabled={busy}>Add to public directory</button>
              </form>
              {data.recruiters.map(item => (
                <article key={item.id} className="talent-list-item">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.email} · {item.title}</p>
                    <small>ID: {item.id}</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="talent-button talent-secondary"
                      style={{ minHeight: 36, padding: "7px 12px", fontSize: 12 }}
                      disabled={busy}
                      onClick={() => void update("recruiter-status", { id: item.id, active: !item.active })}
                    >
                      {item.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="talent-action-btn"
                      title="Edit recruiter"
                      onClick={() => setEditRecruiter({
                        id: item.id,
                        name: item.name,
                        email: item.email,
                        title: item.title,
                        active: Boolean(item.active)
                      })}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="talent-action-btn talent-action-btn-danger"
                      title="Delete recruiter"
                      onClick={() => setDeleteTarget({
                        kind: "recruiter",
                        id: item.id,
                        title: `Recruiter ${item.name} (${item.title})`
                      })}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="talent-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="talent-modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="talent-modal-head">
              <div>
                <h3 className="talent-modal-title" style={{ color: "#dc2626" }}>Delete Confirmation</h3>
                <p className="talent-modal-sub">Are you sure you want to permanently delete this item?</p>
              </div>
              <button type="button" className="talent-modal-close" onClick={() => setDeleteTarget(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
                {deleteTarget.title}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b91c1c" }}>
                This will permanently remove the record and cannot be undone.
              </p>
            </div>

            <div className="talent-modal-actions">
              <button
                type="button"
                className="talent-action-btn"
                disabled={busy}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="talent-button talent-danger-btn"
                style={{ minHeight: 38, padding: "8px 16px", fontSize: 13 }}
                disabled={busy}
                onClick={() => void confirmDelete()}
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION MODAL */}
      {editApp && (
        <div className="talent-modal-backdrop" onClick={() => setEditApp(null)}>
          <div className="talent-modal-box talent-modal-box-wide" onClick={e => e.stopPropagation()}>
            <div className="talent-modal-head">
              <div>
                <h3 className="talent-modal-title">Edit Application</h3>
                <p className="talent-modal-sub">APP-{editApp.id.slice(0, 8).toUpperCase()} · {editApp.candidateName}</p>
              </div>
              <button type="button" className="talent-modal-close" onClick={() => setEditApp(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitEditApp}>
              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Candidate full name</label>
                  <input
                    required
                    value={editApp.candidateName}
                    onChange={e => setEditApp({ ...editApp, candidateName: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Candidate email</label>
                  <input
                    type="email"
                    required
                    value={editApp.candidateEmail}
                    onChange={e => setEditApp({ ...editApp, candidateEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Job title / Applied role</label>
                  <input
                    required
                    value={editApp.jobTitle}
                    onChange={e => setEditApp({ ...editApp, jobTitle: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Professional headline</label>
                  <input
                    placeholder="e.g. Senior MIS & Data Analyst"
                    value={editApp.headline}
                    onChange={e => setEditApp({ ...editApp, headline: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Location</label>
                  <input
                    placeholder="e.g. Maharashtra, India"
                    value={editApp.location}
                    onChange={e => setEditApp({ ...editApp, location: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Phone number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={editApp.phone}
                    onChange={e => setEditApp({ ...editApp, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editApp.experience}
                    onChange={e => setEditApp({ ...editApp, experience: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Notice period</label>
                  <input
                    placeholder="e.g. Immediate, 30 days"
                    value={editApp.noticePeriod}
                    onChange={e => setEditApp({ ...editApp, noticePeriod: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-field">
                <label>Skills (comma separated)</label>
                <input
                  placeholder="e.g. SQL, Power BI, Python, Risk Analytics"
                  value={editApp.skills}
                  onChange={e => setEditApp({ ...editApp, skills: e.target.value })}
                />
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Resume link (URL)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editApp.resumeUrl}
                    onChange={e => setEditApp({ ...editApp, resumeUrl: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Portfolio link (URL)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editApp.portfolioUrl}
                    onChange={e => setEditApp({ ...editApp, portfolioUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-field">
                <label>Candidate note / Cover letter</label>
                <textarea
                  rows={4}
                  value={editApp.coverLetter}
                  onChange={e => setEditApp({ ...editApp, coverLetter: e.target.value })}
                />
              </div>

              <div className="talent-modal-actions">
                <button
                  type="button"
                  className="talent-action-btn"
                  disabled={busy}
                  onClick={() => setEditApp(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="talent-button"
                  style={{ minHeight: 38, padding: "8px 18px", fontSize: 13 }}
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INQUIRY MODAL */}
      {editInquiry && (
        <div className="talent-modal-backdrop" onClick={() => setEditInquiry(null)}>
          <div className="talent-modal-box" onClick={e => e.stopPropagation()}>
            <div className="talent-modal-head">
              <div>
                <h3 className="talent-modal-title">Edit Inquiry</h3>
                <p className="talent-modal-sub">ATS-{editInquiry.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button type="button" className="talent-modal-close" onClick={() => setEditInquiry(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitEditInquiry}>
              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Name</label>
                  <input
                    required
                    value={editInquiry.name}
                    onChange={e => setEditInquiry({ ...editInquiry, name: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={editInquiry.email}
                    onChange={e => setEditInquiry({ ...editInquiry, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    value={editInquiry.phone}
                    onChange={e => setEditInquiry({ ...editInquiry, phone: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Company (optional)</label>
                  <input
                    value={editInquiry.company}
                    onChange={e => setEditInquiry({ ...editInquiry, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Subject</label>
                  <input
                    required
                    value={editInquiry.subject}
                    onChange={e => setEditInquiry({ ...editInquiry, subject: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Status</label>
                  <select
                    value={editInquiry.status}
                    onChange={e => setEditInquiry({ ...editInquiry, status: e.target.value as "new" | "in-progress" | "resolved" })}
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="talent-modal-field">
                <label>Message</label>
                <textarea
                  required
                  rows={5}
                  value={editInquiry.message}
                  onChange={e => setEditInquiry({ ...editInquiry, message: e.target.value })}
                />
              </div>

              <div className="talent-modal-actions">
                <button
                  type="button"
                  className="talent-action-btn"
                  disabled={busy}
                  onClick={() => setEditInquiry(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="talent-button"
                  style={{ minHeight: 38, padding: "8px 18px", fontSize: 13 }}
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CANDIDATE MODAL */}
      {editCandidate && (
        <div className="talent-modal-backdrop" onClick={() => setEditCandidate(null)}>
          <div className="talent-modal-box" onClick={e => e.stopPropagation()}>
            <div className="talent-modal-head">
              <div>
                <h3 className="talent-modal-title">Edit Candidate Profile</h3>
                <p className="talent-modal-sub">{editCandidate.email}</p>
              </div>
              <button type="button" className="talent-modal-close" onClick={() => setEditCandidate(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitEditCandidate}>
              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Candidate full name</label>
                  <input
                    required
                    value={editCandidate.name}
                    onChange={e => setEditCandidate({ ...editCandidate, name: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Professional headline</label>
                  <input
                    placeholder="e.g. Senior MIS & Data Analyst"
                    value={editCandidate.headline}
                    onChange={e => setEditCandidate({ ...editCandidate, headline: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Location</label>
                  <input
                    placeholder="e.g. Maharashtra, India"
                    value={editCandidate.location}
                    onChange={e => setEditCandidate({ ...editCandidate, location: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Phone number</label>
                  <input
                    type="tel"
                    value={editCandidate.phone}
                    onChange={e => setEditCandidate({ ...editCandidate, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editCandidate.experience}
                    onChange={e => setEditCandidate({ ...editCandidate, experience: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Resume / Portfolio URL</label>
                  <input
                    placeholder="https://..."
                    value={editCandidate.resumeUrl}
                    onChange={e => setEditCandidate({ ...editCandidate, resumeUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-field">
                <label>Skills (comma separated)</label>
                <input
                  placeholder="e.g. SQL, MIS, Python, Reporting"
                  value={editCandidate.skills}
                  onChange={e => setEditCandidate({ ...editCandidate, skills: e.target.value })}
                />
              </div>

              <div className="talent-modal-actions">
                <button
                  type="button"
                  className="talent-action-btn"
                  disabled={busy}
                  onClick={() => setEditCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="talent-button"
                  style={{ minHeight: 38, padding: "8px 18px", fontSize: 13 }}
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECRUITER MODAL */}
      {editRecruiter && (
        <div className="talent-modal-backdrop" onClick={() => setEditRecruiter(null)}>
          <div className="talent-modal-box" onClick={e => e.stopPropagation()}>
            <div className="talent-modal-head">
              <div>
                <h3 className="talent-modal-title">Edit Public Recruiter</h3>
                <p className="talent-modal-sub">ID: {editRecruiter.id}</p>
              </div>
              <button type="button" className="talent-modal-close" onClick={() => setEditRecruiter(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitEditRecruiter}>
              <div className="talent-modal-grid">
                <div className="talent-modal-field">
                  <label>Name</label>
                  <input
                    required
                    value={editRecruiter.name}
                    onChange={e => setEditRecruiter({ ...editRecruiter, name: e.target.value })}
                  />
                </div>
                <div className="talent-modal-field">
                  <label>Work email</label>
                  <input
                    type="email"
                    required
                    value={editRecruiter.email}
                    onChange={e => setEditRecruiter({ ...editRecruiter, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="talent-modal-field">
                <label>Role / Title</label>
                <input
                  required
                  value={editRecruiter.title}
                  onChange={e => setEditRecruiter({ ...editRecruiter, title: e.target.value })}
                />
              </div>

              <div className="talent-modal-field" style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                <input
                  type="checkbox"
                  id="recruiter-active-check"
                  checked={editRecruiter.active}
                  onChange={e => setEditRecruiter({ ...editRecruiter, active: e.target.checked })}
                />
                <label htmlFor="recruiter-active-check" style={{ margin: 0, cursor: "pointer" }}>
                  Active & publicly searchable in directory
                </label>
              </div>

              <div className="talent-modal-actions">
                <button
                  type="button"
                  className="talent-action-btn"
                  disabled={busy}
                  onClick={() => setEditRecruiter(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="talent-button"
                  style={{ minHeight: 38, padding: "8px 18px", fontSize: 13 }}
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="talent-auth-bottom">
        <Mail size={15} />
        <small>Up to 300 recent requests, applications, and accounts are shown. Email replies open your own email app.</small>
      </div>
    </section>
  );
}

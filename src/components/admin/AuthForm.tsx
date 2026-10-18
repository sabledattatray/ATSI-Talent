"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
export function AuthForm({ signup }: { signup: boolean }) {
  const params = useSearchParams(); const router = useRouter();
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [setup, setSetup] = useState<{ needsSetup: boolean; setupTokenRequired: boolean } | null>(null);
  useEffect(() => { fetch("/api/admin/setup").then(r => r.json()).then(setSetup).catch(() => setError("Cannot connect to the workspace. Please refresh.")); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const r = await fetch(`/api/admin/auth/${signup ? "signup" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, invite: params.get("invite") || "" }) });
      const result = await r.json(); if (!r.ok) throw new Error(result.error); router.replace("/admin"); router.refresh();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  const first = signup && setup?.needsSetup;
  return <div className="cms-auth">
    <aside className="cms-auth-art"><BrandLogo theme="dark" size="lg" href="/" /><div className="cms-auth-story"><span className="cms-eyebrow"><span className="cms-live-dot" /> THE ATS AI WORKSPACE</span><h1>Great opportunities.<br /><span>Thoughtfully managed.</span></h1><p>Your space to connect exceptional talent, share meaningful insights, and build what comes next.</p><div className="cms-auth-features">{["Publish roles that open new doors", "Create stories worth reading", "Keep your team in sync"].map(t => <div key={t}><Check size={16} />{t}</div>)}</div></div><div className="cms-auth-art-bottom"><ShieldCheck size={18} /> Private workspace. Purpose-built for your team.</div><div className="cms-orbit cms-orbit-one" /><div className="cms-orbit cms-orbit-two" /></aside>
    <main className="cms-auth-main"><Link href="/" className="cms-back-link">← Back to website</Link><div className="cms-auth-card"><div className="cms-auth-symbol"><LockKeyhole size={25} /></div><span className="cms-eyebrow">{signup ? "LET’S GET STARTED" : "WELCOME BACK"}</span><h2>{first ? "Create your workspace" : signup ? "Join your team" : "Your next great hire starts here."}</h2><p>{first ? "Set up the owner account to start publishing jobs and stories." : signup ? "Use your invitation to create a secure editor account." : "Sign in to your ATS AI admin workspace."}</p>
      {error && <div className="cms-alert" role="alert">{error}</div>}
      {signup && setup && !setup.needsSetup && !params.get("invite") ? <div className="cms-notice"><ShieldCheck size={22} /><div><strong>This workspace is invitation only.</strong><p>Ask your workspace owner for an invitation link, or sign in with your existing account.</p></div></div> : <form onSubmit={submit} className="cms-form">
        {signup && <label>Full name<input name="name" required minLength={2} maxLength={80} placeholder="Your full name" autoComplete="name" /></label>}
        <label>Work email<input name="email" type="email" required defaultValue={params.get("email") || ""} placeholder="you@company.com" autoComplete="email" /></label>
        <label>Password<div className="cms-password"><input name="password" type={show ? "text" : "password"} required minLength={12} maxLength={128} placeholder={signup ? "At least 12 characters" : "Enter your password"} autoComplete={signup ? "new-password" : "current-password"} /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {signup && setup?.needsSetup && setup.setupTokenRequired && <label>Server setup key<input type="password" name="setupToken" required placeholder="Owner setup key from your server configuration" /><small>This key is configured by your server administrator.</small></label>}
        {signup && <small className="cms-muted">Use a unique password or passphrase with at least 12 characters.</small>}
        <button className="cms-btn cms-primary cms-auth-submit" disabled={busy || !setup}>{busy ? "Please wait…" : first ? "Create workspace" : signup ? "Create account" : "Sign in to workspace"}<ArrowRight size={18} /></button>
      </form>}
      <p className="cms-auth-switch">{signup ? "Already have an account?" : "New to this workspace?"} <Link href={signup ? "/admin/login" : "/admin/signup"}>{signup ? "Sign in" : setup?.needsSetup ? "Create your account" : "Join with an invitation"}</Link></p><div className="cms-auth-security"><ShieldCheck size={15} /> Protected access · Secure server sessions</div></div><div className="cms-auth-footer"><span>© {new Date().getFullYear()} ATS AI Talent Solutions</span><Sparkles size={16} /><span>A little clarity. A lot of possibility.</span></div></main>
  </div>;
}

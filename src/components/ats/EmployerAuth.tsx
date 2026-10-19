"use client";
import { COUNTRIES } from "@/lib/countries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef,useState,type FormEvent } from "react";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { EmailVerification } from "@/components/auth/EmailVerification";
import "./ats.css";
export function EmployerAuth({mode,token=""}:{mode:"login"|"signup"|"accept";token?:string}){
  const router=useRouter(),form=useRef<HTMLFormElement>(null);
  const [error,setError]=useState(""),[busy,setBusy]=useState(false),[pendingEmail,setPendingEmail]=useState("");
  function finish(){router.replace("/employer/dashboard");router.refresh();}
  function registration(){const data=form.current?Object.fromEntries(new FormData(form.current)):{};return {...data,country:String(data.country||"").toUpperCase(),invite:token,consent:data.consent==="on"};}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{const response=await fetch("/api/ats/auth/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(registration())});const body=await response.json();if(!response.ok)throw new Error(body.error);if(body.verificationRequired){setPendingEmail(body.email);}else finish();}
    catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <div className="ats-auth"><aside><div style={{marginBottom:28}}><BrandLogo theme="dark" size="lg" href="/" badge="PORTAL" subtitle="EMPLOYER ATS" /></div><h1>Great hiring.<br/><em>One connected workspace.</em></h1><p>Recruitment software & HR technology solutions for modern hiring teams across India.</p><ul><li><Building2/> A private workspace for your company</li><li><ShieldCheck/> Jobs, applicants and interviews in one place</li><li><ArrowRight/> Candidate updates from application to decision</li></ul></aside><section><span className="ats-kicker">EMPLOYER WORKSPACE</span><h2>{mode==="login"?"Welcome back.":mode==="accept"?"Join your hiring team.":"Build your hiring workspace."}</h2><p>{mode==="login"?"Sign in with Google or your email and password.":"Create your account to start managing hiring."}</p>{error&&<div className="ats-error" role="alert">{error}</div>}
    {pendingEmail?<EmailVerification scope="employer" email={pendingEmail} onVerified={finish} onBack={()=>{setPendingEmail("");setError("");}} />:<form ref={form} onSubmit={submit} className="ats-form">
      {mode!=="login"&&<label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}
      {mode==="signup"&&<><label>Company name<input name="company" autoComplete="organization" required minLength={2} maxLength={120}/></label><div className="ats-fields"><label>Company country<select name="country" required defaultValue=""><option value="" disabled>Select your country</option>{COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label>Company website (optional)<input name="website" type="url" placeholder="https://company.com" maxLength={1000}/></label></div></>}
      {mode!=="login"&&<label className="ats-check"><input name="consent" type="checkbox" required/><span>I agree to the <Link href="/legal/employer-terms">employer terms</Link> and <Link href="/legal/privacy-policy">privacy policy</Link>.</span></label>}
      {mode!=="login"&&<small>For Google registration, complete the company details and accept the terms above. A password is only needed for email registration.</small>}
      <GoogleSignIn scope="employer" intent={mode} onSuccess={finish} getRegistration={registration} />
      <label>Work email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={12} maxLength={128}/><small>At least 12 characters.{mode!=="login"&&" We will email you a verification code."}</small></label>
      <button className="ats-primary" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":mode==="accept"?"Join workspace":"Create company workspace"}<ArrowRight size={16}/></button>
    </form>}
    <p>{mode==="login"?<>New to ATSAI? <Link href="/employer/signup">Create a company workspace</Link></>:<>Already registered? <Link href="/employer/login">Sign in</Link></>}</p><small>Looking for a job? <Link href="/candidate/login">Candidate sign in</Link></small></section></div>;
}

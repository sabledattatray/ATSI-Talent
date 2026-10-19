"use client";
import { useState, type FormEvent } from "react";
import "./auth.css";
export function EmailVerification({scope,email,onVerified,onBack}:{scope:"candidate"|"employer";email:string;onVerified:()=>void;onBack:()=>void}){
  const [code,setCode]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const [nextResend,setNextResend]=useState(()=>Date.now()+60_000);
  async function send(path:string,body:Record<string,string>={}){
    setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/auth/otp/"+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope,...body})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Please try again.");
      if(path==="verify")onVerified();else{setMessage("A new code was sent. Use the latest email.");setCode("");setNextResend(Date.now()+60_000);}
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  function submit(event:FormEvent){event.preventDefault();void send("verify",{code});}
  return <section className="identity-verification" aria-label="Verify your email">
    <h3>Check your email</h3><p>Enter the six-digit code sent to <strong>{email}</strong>. The code expires in 10 minutes.</p>
    {error&&<p className="identity-error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
    <form onSubmit={submit}><label>Verification code<input value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required minLength={6} maxLength={6} autoFocus /></label><button type="submit" disabled={busy||code.length!==6}>{busy?"Please wait…":"Verify email and continue"}</button></form>
    <div className="identity-actions"><button type="button" disabled={busy} onClick={()=>{if(Date.now()<nextResend){setError("Please wait 60 seconds between code requests.");return;}void send("resend");}}>Send a new code</button><button type="button" disabled={busy} onClick={onBack}>Back to sign in</button></div>
  </section>;
}

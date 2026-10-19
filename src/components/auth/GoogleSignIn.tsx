"use client";
import Script from "next/script";
import { useCallback,useEffect,useRef,useState } from "react";
import "./auth.css";
type Scope="candidate"|"employer";
type GoogleCredential={credential:string;select_by?:string};
type GoogleIdentity={initialize:(options:{client_id:string;nonce:string;callback:(result:GoogleCredential)=>void;auto_select:boolean;use_fedcm_for_prompt:boolean})=>void;renderButton:(node:HTMLElement,options:Record<string,string|number>)=>void;prompt:()=>void;cancel:()=>void;disableAutoSelect:()=>void};
declare global{interface Window{google?:{accounts:{id:GoogleIdentity}}}}
export function GoogleSignIn({scope,intent,onSuccess,getRegistration}:{scope:Scope;intent:"login"|"signup"|"accept"|"link";onSuccess:()=>void;getRegistration?:()=>Record<string,unknown>}){
  const button=useRef<HTMLDivElement>(null),latest=useRef({onSuccess,getRegistration});
  useEffect(()=>{latest.current={onSuccess,getRegistration};},[onSuccess,getRegistration]);
  const [config,setConfig]=useState<{clientId:string;nonce:string}|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch("/api/auth/google/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope})}).then(async response=>{if(!response.ok)throw new Error("Google sign-in is temporarily unavailable.");return response.json();}).then(data=>{if(active&&data.enabled)setConfig(data);}).catch(error=>{if(active)setError(error.message);});
    return()=>{active=false;};
  },[scope]);
  const receive=useCallback(async(result:GoogleCredential)=>{
    setBusy(true);setError("");
    try{
      const method=(result.select_by||"").startsWith("btn")?"google_button":"google_one_tap";
      const registration=latest.current.getRegistration?.()||{};
      const response=await fetch("/api/auth/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...registration,scope,intent,method,credential:result.credential})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Google sign-in failed.");latest.current.onSuccess();
    }catch(error){setError((error as Error).message+" Refresh the page to try Google again.");}finally{setBusy(false);}
  },[scope,intent]);
  useEffect(()=>{
    const identity=window.google?.accounts.id;
    if(!ready||!config||!identity||!button.current)return;
    identity.initialize({client_id:config.clientId,nonce:config.nonce,callback:result=>{void receive(result);},auto_select:false,use_fedcm_for_prompt:true});
    identity.renderButton(button.current,{type:"standard",theme:"outline",size:"large",text:intent==="link"?"continue_with":"signin_with",shape:"rectangular",width:280});
    // Registration and linking need explicit form/terms input before a user clicks the Google button.
    if(intent==="login")identity.prompt();
    return()=>identity.cancel();
  },[config,ready,receive,intent]);
  if(!config)return error?<p className="identity-error" role="alert">{error}</p>:null;
  return <div className="identity-google"><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError("Google sign-in could not load. Use email sign-in or try again.")} />
    <div ref={button} aria-busy={busy} />{busy&&<p role="status">Verifying your Google account…</p>}{error&&<p className="identity-error" role="alert">{error}</p>}
    {intent!=="link"&&<div className="identity-divider"><span>or continue with email</span></div>}
  </div>;
}

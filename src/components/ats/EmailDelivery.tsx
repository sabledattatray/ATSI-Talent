"use client";
import { useCallback, useEffect, useState } from "react";
type Notification={id:string;status:string;attempts:number;lastError:string;createdAt:string;sentAt:string|null};
type Data={configuration:{configured:boolean;message:string};notifications:Notification[]};
const labels:Record<string,string>={pending:"Queued",sending:"Sending",sent:"Accepted by email provider",failed:"Retry needed",blocked:"Waiting for email setup"};
export function EmailDelivery({applicationId,scope}:{applicationId:string;scope:"admin"|"employer"}){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const root=scope==="admin"?"/api/recruitment/admin/notifications":"/api/ats/notifications";
 const refresh=useCallback(()=>fetch(`${root}?applicationId=${encodeURIComponent(applicationId)}`,{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error);return body as Data;}).then(setData).catch(e=>setError(e.message)),[root,applicationId]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},10000);return()=>clearInterval(timer);},[refresh]);
 async function retry(id:string){setBusy(true);setError("");try{const r=await fetch(`${root}/retry`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,applicationId})});const body=await r.json();if(!r.ok)throw new Error(body.error);await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="ats-email-delivery"><h4>Candidate email updates</h4>{error&&<p role="alert">{error}</p>}{data&&!data.configuration.configured&&<p className="ats-email-warning">{data.configuration.message} Updates remain queued; no email is marked as sent.</p>}{!data&&!error&&<p>Checking delivery…</p>}{data?.notifications.map(n=><div key={n.id} className="ats-email-row"><span><strong>{labels[n.status]||n.status}</strong><small>{new Date(n.createdAt).toLocaleString()}{n.lastError?` · ${n.lastError}`:""}</small></span>{["failed","blocked"].includes(n.status)&&data.configuration.configured&&<button type="button" className="ats-secondary" disabled={busy} onClick={()=>void retry(n.id)}>Retry email</button>}</div>)}{data&&!data.notifications.length&&<p>No email updates have been queued for this application yet.</p>}</section>;
}

import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/admin/db";
import { SITE_URL, BRAND_NAME } from "@/lib/seo";
import { STAGE_LABELS, type Stage } from "@/lib/ats-types";

const escape=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
export function emailConfiguration(){
  const configured=!!(process.env.RESEND_API_KEY?.trim()&&process.env.ATSAI_EMAIL_FROM?.trim());
  return {provider:"Resend",configured,message:configured?"Email delivery is configured.":"Email delivery is paused. Configure RESEND_API_KEY and ATSAI_EMAIL_FROM on the hosting server."};
}
export async function queueApplicationEmail(eventId:string,applicationId:string,stage:string,message:string){
  const app=await db().prepare("SELECT a.jobTitle,a.company,c.name,c.email FROM candidate_applications a JOIN candidate_accounts c ON c.id=a.candidateId WHERE a.id=?").get(applicationId) as {jobTitle:string;company:string;name:string;email:string}|undefined;
  if(!app)throw new Error("Application notification requires an existing candidate.");
  const status=STAGE_LABELS[stage as Stage]||stage;
  const subject=`${status}: ${app.jobTitle} | ${app.company}`.replace(/[\r\n]/g," ").slice(0,240);
  const reference=`APP-${applicationId.slice(0,8).toUpperCase()}`;
  const url=`${SITE_URL}/candidate/dashboard?tab=applications`;
  const text=`Hello ${app.name},\n\nThere is an update to your application for ${app.jobTitle} at ${app.company}.\n\nCurrent status: ${status}\n${message}\n\nReference: ${reference}\nView your application: ${url}\n\n${BRAND_NAME}\nThis is an application update, not a marketing email.`;
  const html=`<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#203752"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e0e7f1;border-radius:14px;overflow:hidden"><div style="padding:28px 32px;background:#142d4b;color:white"><strong>${escape(BRAND_NAME)}</strong><p style="margin:10px 0 0;color:#c4d3e8;font-size:13px">Application update</p></div><div style="padding:30px 32px"><p>Hello ${escape(app.name)},</p><h1 style="font-size:23px;line-height:1.4;margin:20px 0 8px">${escape(app.jobTitle)}</h1><p style="color:#697d96;margin:0 0 20px">${escape(app.company)}</p><p style="display:inline-block;background:#edf3ff;border-radius:6px;padding:9px 13px;color:#2857a4;font-weight:bold">${escape(status)}</p><p style="white-space:pre-line;line-height:1.8">${escape(message)}</p><p style="margin:26px 0"><a href="${url}" style="background:#285feb;color:white;text-decoration:none;padding:13px 20px;border-radius:7px;display:inline-block">View application</a></p><p style="font-size:12px;color:#7f8fa5">Reference ${reference}</p></div><div style="border-top:1px solid #e6ecf4;padding:20px 32px;font-size:11px;line-height:1.8;color:#8493a8">This email relates to an application you submitted through ATSAI. Your hiring team records the status. Sign in to your candidate dashboard for the full history.</div></div></body></html>`;
  const state=emailConfiguration().configured?"pending":"blocked";
  await db().prepare("INSERT INTO ats_notifications (id,eventId,applicationId,recipient,subject,text,html,status,attempts,nextAttemptAt,leaseUntil,providerId,lastError,createdAt,sentAt) VALUES (?,?,?,?,?,?,?,?,0,0,0,'',?,?,NULL) ON CONFLICT(eventId) DO NOTHING").run(randomUUID(),eventId,applicationId,app.email,subject,text,html,state,state==="blocked"?"Email service is not configured.":"",new Date().toISOString());
}
type Mail={id:string;recipient:string;subject:string;text:string;html:string;attempts:number};
export async function drainEmailOutbox(limit=5){
  if(!emailConfiguration().configured)return {processed:0,accepted:0,configured:false};
  const now=Date.now();
  await db().prepare("UPDATE ats_notifications SET status='failed',leaseUntil=0,lastError='Email processing was interrupted. Retry manually to confirm delivery.' WHERE status='sending' AND leaseUntil<? AND attempts>=5").run(now);
  const rows=await db().prepare("SELECT id,recipient,subject,text,html,attempts FROM ats_notifications WHERE ((status IN ('pending','failed','blocked') AND nextAttemptAt<=? AND attempts<5) OR (status='sending' AND leaseUntil<? AND attempts<5)) ORDER BY createdAt LIMIT ?").all(now,now,Math.min(10,Math.max(1,limit))) as Mail[];
  let processed=0,accepted=0;
  for(const mail of rows){
    const claim=await db().prepare("UPDATE ats_notifications SET status='sending',leaseUntil=?,attempts=attempts+1 WHERE id=? AND ((status IN ('pending','failed','blocked') AND nextAttemptAt<=? AND attempts<5) OR (status='sending' AND leaseUntil<? AND attempts<5))").run(Date.now()+60_000,mail.id,Date.now(),Date.now());
    if(!claim.changes)continue;processed++;
    try{
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`atsai-application-${mail.id}`},body:JSON.stringify({from:process.env.ATSAI_EMAIL_FROM,to:[mail.recipient],subject:mail.subject,text:mail.text,html:mail.html}),signal:AbortSignal.timeout(12_000)});
      if(!response.ok)throw new Error(`Email provider returned HTTP ${response.status}. Check the sender configuration or retry later.`);
      const result=await response.json() as {id?:string};if(!result.id)throw new Error("Email provider did not confirm acceptance. A retry is queued.");
      await db().prepare("UPDATE ats_notifications SET status='sent',providerId=?,sentAt=?,lastError='',leaseUntil=0 WHERE id=? AND status='sending'").run(result.id,new Date().toISOString(),mail.id);accepted++;
    }catch(error){
      const message=error instanceof Error&&error.message.startsWith("Email provider")?error.message:"Email delivery could not be confirmed. A retry is queued.";
      await db().prepare("UPDATE ats_notifications SET status='failed',nextAttemptAt=?,leaseUntil=0,lastError=? WHERE id=? AND status='sending'").run(Date.now()+Math.min(60*60_000,60_000*2**mail.attempts),message,mail.id);
    }
  }
  return {processed,accepted,configured:true};
}
export async function applicationMailStatus(applicationId:string){
  return await db().prepare("SELECT id,eventId,status,attempts,lastError,createdAt,sentAt FROM ats_notifications WHERE applicationId=? ORDER BY createdAt DESC LIMIT 30").all(applicationId);
}

export async function retryApplicationEmail(id:string,applicationId:string){
  if(!emailConfiguration().configured)throw Object.assign(new Error("Configure Resend and the verified sender before retrying."),{status:409});
  const result=await db().prepare("UPDATE ats_notifications SET status='pending',attempts=0,nextAttemptAt=0,lastError='' WHERE id=? AND applicationId=? AND status IN ('failed','blocked')").run(id,applicationId);
  if(!result.changes)throw Object.assign(new Error("This email cannot be retried or is already processing."),{status:409});
}

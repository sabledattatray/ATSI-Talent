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
const STAGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  submitted: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  review: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  shortlisted: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  interview: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
  interviewed: { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
  selected: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  offer: { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  hired: { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" },
  rejected: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  withdrawn: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

export async function queueApplicationEmail(eventId:string,applicationId:string,stage:string,message:string){
  const app=await db().prepare("SELECT a.jobTitle,a.company,c.name,c.email FROM candidate_applications a JOIN candidate_accounts c ON c.id=a.candidateId WHERE a.id=?").get(applicationId) as {jobTitle:string;company:string;name:string;email:string}|undefined;
  if(!app)throw new Error("Application notification requires an existing candidate.");
  const status=STAGE_LABELS[stage as Stage]||stage;
  const badge=STAGE_STYLES[stage] || { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
  const subject=`${status}: ${app.jobTitle} | ${app.company}`.replace(/[\r\n]/g," ").slice(0,240);
  const reference=`APP-${applicationId.slice(0,8).toUpperCase()}`;
  const url=`${SITE_URL}/candidate/dashboard?tab=applications`;
  const text=`Hello ${app.name},\n\nThere is an update to your application for ${app.jobTitle} at ${app.company}.\n\nCurrent status: ${status}\n${message ? `\nUpdate from hiring team:\n${message}\n` : ""}\nReference: ${reference}\nView your application: ${url}\n\n${BRAND_NAME}\nThis is an application update, not a marketing email.`;
  const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#312e81 100%);padding:30px 36px;color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;line-height:1.2;">
                      ${escape(BRAND_NAME)}
                    </div>
                    <div style="margin-top:6px;font-size:12px;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">
                      Candidate Application Update
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:6px;font-size:11px;font-weight:600;color:#e2e8f0;">
                      Live ATS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px 36px 24px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">
                Hello <strong>${escape(app.name)}</strong>,
              </p>
              
              <!-- Role Highlight Card -->
              <div style="margin:0 0 24px;padding:20px 22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:4px;">
                  Position
                </div>
                <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:4px;">
                  ${escape(app.jobTitle)}
                </div>
                <div style="font-size:14px;color:#475569;font-weight:500;margin-bottom:14px;">
                  ${escape(app.company)}
                </div>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;padding-top:12px;">
                  <tr>
                    <td valign="middle" style="font-size:12px;font-weight:600;color:#64748b;">
                      Application Status:
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;padding:5px 12px;border-radius:9999px;font-size:12px;font-weight:700;background:${badge.bg};color:${badge.text};border:1px solid ${badge.border};">
                        ${escape(status)}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Recruiter Message / Timeline Note -->
              ${message ? `
              <div style="margin:0 0 26px;padding:16px 18px;background:#f8fafc;border-left:4px solid #4f46e5;border-radius:0 10px 10px 0;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4f46e5;margin-bottom:6px;">
                  Update from hiring team
                </div>
                <div style="font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-line;">
                  ${escape(message)}
                </div>
              </div>` : ""}

              <!-- CTA Button -->
              <div style="margin:28px 0;text-align:center;">
                <a href="${url}" style="display:inline-block;padding:13px 28px;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;box-shadow:0 3px 10px rgba(37,99,235,0.28);">
                  View Application in Dashboard &rarr;
                </a>
              </div>

              <!-- Application Reference -->
              <div style="padding:10px 14px;background:#f1f5f9;border-radius:8px;font-size:12px;color:#64748b;text-align:center;">
                Application Reference: <strong style="color:#0f172a;letter-spacing:0.5px;">${escape(reference)}</strong>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:22px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;line-height:1.7;color:#8493a8;text-align:center;">
              <div>This email relates to an application you submitted through <strong>${escape(BRAND_NAME)}</strong>. Your hiring team records decisions in real time.</div>
              <div style="margin-top:6px;color:#94a3b8;">This is an automated application status notification, not a promotional email.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

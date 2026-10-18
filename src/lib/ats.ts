import "server-only";
import { changeApplicationStage, recordApplicationEvent } from "@/lib/application-workflow";
import { applicationMailStatus, emailConfiguration, retryApplicationEmail } from "@/lib/notifications";
import { isCountryCode } from "@/lib/countries";
import { candidateUser } from "@/lib/recruitment";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { db, transaction, audit, limit } from "@/lib/admin/db";
import { assertOrigin, hashPassword, verifyPassword, tokenHash, currentUser } from "@/lib/admin/auth";
import { blankRecord, slugify, type ContentRecord } from "@/lib/admin/types";
import { contentSchema } from "@/lib/admin/validation";
import { STAGES, type Employer, type Applicant, type EmployerWorkspace, type TrackingEvent, type Interview } from "@/lib/ats-types";

const COOKIE="atsai_employer_session";
const text=(max:number)=>z.string().trim().max(max);
const email=z.email().max(254).transform(s=>s.toLowerCase().trim());
const credentials=z.object({email,password:z.string().min(12).max(128)});
function fail(message:string,status=400):never { throw Object.assign(new Error(message),{status}); }
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function employerUser():Promise<Employer|null>{
  const token=(await cookies()).get(COOKIE)?.value;if(!token||token.length!==64)return null;
  return await db().prepare("SELECT e.id,e.organizationId,e.name,e.email,e.role,o.name AS company,o.country,o.website FROM ats_employers e JOIN ats_organizations o ON o.id=e.organizationId JOIN ats_sessions s ON s.userId=e.id WHERE s.hash=? AND s.expiresAt>?").get(tokenHash(token),Date.now()) as Employer|undefined || null;
}
async function requireEmployer(owner=false){const user=await employerUser();if(!user)fail("Sign in to your company workspace.",401);if(owner&&user.role!=="owner")fail("Only the company owner can manage team access.",403);return user;}
async function session(userId:string){const token=randomBytes(32).toString("hex");const expiresAt=Date.now()+8*60*60*1000;await db().prepare("DELETE FROM ats_sessions WHERE expiresAt<?").run(Date.now());await db().prepare("INSERT INTO ats_sessions VALUES (?,?,?)").run(tokenHash(token),userId,expiresAt);(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",expires:new Date(expiresAt)});}
async function ownedJob(id:string,organizationId:string){const row=await db().prepare("SELECT c.document FROM content c JOIN ats_jobs j ON j.jobId=c.id WHERE c.id=? AND j.organizationId=? AND c.kind='job'").get(id,organizationId) as {document:string}|undefined;if(!row)fail("This job is unavailable in your workspace.",404);return JSON.parse(row.document) as ContentRecord;}
async function ownedApplication(id:string,organizationId:string){const row=await db().prepare("SELECT a.* FROM candidate_applications a JOIN ats_jobs j ON j.jobId=a.jobId WHERE a.id=? AND j.organizationId=?").get(id,organizationId) as Applicant|undefined;if(!row)fail("This application is unavailable in your workspace.",404);return row;}
const event = recordApplicationEvent;

export async function employerWorkspace(user:Employer):Promise<EmployerWorkspace>{
  const org=user.organizationId;
  const [rows,applications,events,interviews,team]=await Promise.all([
    db().prepare("SELECT c.document FROM content c JOIN ats_jobs j ON j.jobId=c.id WHERE j.organizationId=? ORDER BY c.updatedAt DESC").all(org),
    db().prepare("SELECT a.*,c.name,c.email FROM candidate_applications a JOIN ats_jobs j ON j.jobId=a.jobId JOIN candidate_accounts c ON c.id=a.candidateId WHERE j.organizationId=? ORDER BY a.createdAt DESC").all(org),
    db().prepare("SELECT e.id,e.applicationId,e.kind,e.stage,e.message,e.createdAt FROM ats_events e JOIN candidate_applications a ON a.id=e.applicationId JOIN ats_jobs j ON j.jobId=a.jobId WHERE j.organizationId=? ORDER BY e.createdAt DESC").all(org),
    db().prepare("SELECT id,applicationId,title,startsAt,timeZone,location,status,createdAt FROM ats_interviews WHERE organizationId=? ORDER BY startsAt").all(org),
    db().prepare("SELECT id,name,email,role FROM ats_employers WHERE organizationId=? ORDER BY createdAt").all(org),
  ]);
  return {user,jobs:(rows as {document:string}[]).map(r=>JSON.parse(r.document)),applications:applications as Applicant[],events:events as TrackingEvent[],interviews:interviews as Interview[],team:team as EmployerWorkspace["team"]};
}
async function readBody(request:Request){if(Number(request.headers.get("content-length"))>200_000)fail("Request is too large.",413);const value=await request.text();if(Buffer.byteLength(value)>200_000)fail("Request is too large.",413);try{return JSON.parse(value);}catch{fail("Invalid request.");}}
export async function atsRequest(request:Request,route:string):Promise<Response>{
  try{
    if(request.method==="GET"){
      if(route==="resumes") { const candidate=await candidateUser(); if(!candidate)return json({error:"Sign in as a candidate."},401); return json({files:await db().prepare("SELECT id,name,createdAt FROM ats_resumes WHERE candidateId=? ORDER BY createdAt DESC").all(candidate.id)}); }
      if (route.startsWith("resume/")) {
        const id=route.slice(7);if(!/^[a-f0-9-]{36}$/.test(id))return json({error:"Resume not found."},404);
        const candidate=await candidateUser();const employer=await employerUser();const admin=await currentUser();
        const row=await db().prepare("SELECT id,candidateId,name,type,bytes FROM ats_resumes WHERE id=?").get(id) as {id:string;candidateId:string;name:string;type:string;bytes:Uint8Array}|undefined;
        if(!row)return json({error:"Resume not found."},404);
        let allowed=candidate?.id===row.candidateId||admin?.role==="owner";
        if(!allowed&&employer){
          const applications=await db().prepare("SELECT a.document FROM candidate_applications a JOIN ats_jobs j ON j.jobId=a.jobId WHERE a.candidateId=? AND j.organizationId=? AND a.status!='withdrawn'").all(row.candidateId,employer.organizationId) as {document:string}[];
          allowed=applications.some(a=>JSON.parse(a.document).profile?.resumeUrl===`/api/ats/resume/${id}`);
        }
        if(!allowed)return json({error:"Resume not found."},404);
        return new Response(new Uint8Array(row.bytes),{headers:{"Content-Type":row.type,"Content-Disposition":`attachment; filename="resume-${id}.${row.name.split('.').at(-1)}"; filename*=UTF-8''${encodeURIComponent(row.name)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
      }

      if(route==="notifications"){
        const user=await requireEmployer();const id=new URL(request.url).searchParams.get("applicationId")||"";await ownedApplication(id,user.organizationId);return json({configuration:emailConfiguration(),notifications:await applicationMailStatus(id)});
      }
      if(route==="me")return json({user:await employerUser()});
      if(route==="workspace")return json(await employerWorkspace(await requireEmployer()));
      return json({error:"Not found."},404);
    }
    if(request.method!=="POST")return json({error:"Method not allowed."},405);
    assertOrigin(request);
    const body=await readBody(request);
    if(route==="auth/signup"||route==="auth/login"||route==="auth/accept"){
      const input=credentials.parse(body);const fingerprint=tokenHash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local");await limit(`employer-auth-ip:${fingerprint}`,30);await limit(`employer-auth-email:${tokenHash(input.email)}`,12);
      if(route==="auth/login"){
        const row=await db().prepare("SELECT id,password FROM ats_employers WHERE email=?").get(input.email) as {id:string;password:string}|undefined;
        if(!row||!await verifyPassword(input.password,row.password))fail("Email or password is incorrect.",401);await session(row.id);return json({ok:true});
      }
      const value=z.object({name:text(80).min(2),company:text(120).min(2).optional(),country:text(2).refine(isCountryCode,"Choose a valid country.").optional(),website:text(1000).refine(s=>!s||/^https:\/\/[^\s]+$/.test(s),"Use an HTTPS website URL.").default(""),invite:text(128).optional(),consent:z.literal(true)}).parse(body);
      const password=await hashPassword(input.password);const id=randomUUID();const now=new Date().toISOString();
      await transaction(async()=>{
        let org:string,role:"owner"|"recruiter"="owner";
        if(route==="auth/accept"){
          if(!value.invite)fail("Invitation token is required.");
          const invite=await db().prepare("SELECT organizationId,email FROM ats_invites WHERE hash=? AND expiresAt>?").get(tokenHash(value.invite),Date.now()) as {organizationId:string;email:string}|undefined;
          if(!invite||invite.email!==input.email)fail("This invitation is invalid, expired, or belongs to another email.",403);org=invite.organizationId;role="recruiter";await db().prepare("DELETE FROM ats_invites WHERE hash=?").run(tokenHash(value.invite));
        }else{
          if(!value.company||!value.country)fail("Company name and two-letter country code are required.");org=randomUUID();await db().prepare("INSERT INTO ats_organizations VALUES (?,?,?,?,?)").run(org,value.company,value.country,value.website,now);
        }
        await db().prepare("INSERT INTO ats_employers VALUES (?,?,?,?,?,?,?)").run(id,org,value.name,input.email,password,role,now);
        await audit(input.email,"Employer account created",org);
      });
      await session(id);return json({ok:true},201);
    }
    if(route==="auth/logout"){
      const jar=await cookies();const token=jar.get(COOKIE)?.value;if(token)await db().prepare("DELETE FROM ats_sessions WHERE hash=?").run(tokenHash(token));jar.delete(COOKIE);return json({ok:true});
    }
    if(route==="resumes/delete") {
      const candidate=await candidateUser();if(!candidate)return json({error:"Sign in as a candidate."},401);const value=z.object({id:text(80)}).parse(body);
      await transaction(async()=>{const changed=await db().prepare("DELETE FROM ats_resumes WHERE id=? AND candidateId=?").run(value.id,candidate.id);if(!changed.changes)fail("Resume not found.",404);const latest=await db().prepare("SELECT profile FROM candidate_accounts WHERE id=?").get(candidate.id) as {profile:string};const profile=JSON.parse(latest.profile);if(profile.resumeUrl===`/api/ats/resume/${value.id}`)await db().prepare("UPDATE candidate_accounts SET profile=? WHERE id=?").run(JSON.stringify({...profile,resumeUrl:""}),candidate.id);});return json({ok:true});
    }
    const user=await requireEmployer();
    if(route==="jobs/save"){
      const input=z.object({id:text(80).default(""),version:z.number().int().min(0).default(0),title:text(180).min(3),description:text(30000).min(20),excerpt:text(600).min(20),category:text(80).min(2),location:text(160).min(2),jobCountry:text(2).refine(isCountryCode,"Choose a valid country."),jobCity:text(120).default(""),jobRegion:text(120).default(""),workMode:z.enum(["Remote","Hybrid","On-site"]),employmentType:z.enum(["Full-time","Part-time","Contract","Executive","Temporary","Internship","Volunteer"]),salaryCurrency:text(3).regex(/^[A-Z]{3}$/),salaryPeriod:z.enum(["YEAR","MONTH","WEEK","DAY","HOUR"]),salaryMin:z.number().min(0).max(1e9),salaryMax:z.number().min(0).max(1e9),experienceMin:z.number().min(0).max(60),experienceMax:z.number().min(0).max(60),skills:text(1200).default(""),expiresAt:text(40).default(""),status:z.enum(["draft","published","archived"])}).parse(body);
      try{new Intl.NumberFormat("en",{style:"currency",currency:input.salaryCurrency});}catch{fail("Choose a valid three-letter currency code.");}
      if(!Intl.supportedValuesOf("currency").includes(input.salaryCurrency))fail("Choose a supported ISO currency.");
      await transaction(async()=>{
        const previous=input.id?await ownedJob(input.id,user.organizationId):null;
        if(previous&&previous.version!==input.version)fail("Another team member changed this job. Refresh before saving.",409);
        const now=new Date().toISOString(),id=previous?.id||randomUUID();
        const record={...blankRecord("job",user.name),...previous,...input,id,kind:"job" as const,company:user.company,author:previous?.author||user.name,slug:previous?.slug||`${slugify(input.title)||"job"}-${id.slice(0,8)}`,content:{type:"doc",content:input.description.split(/\n\s*\n/).map(p=>({type:"paragraph",content:[{type:"text",text:p}]}))},createdAt:previous?.createdAt||now,updatedAt:now,publishedAt:input.status==="published"?previous?.publishedAt||now:previous?.publishedAt||null,version:(previous?.version||0)+1,googleJobs:input.status==="published"&&(input.workMode==="Remote"||!!input.jobCity),jobOriginalDate:previous?.publishedAt?previous.jobOriginalDate:now.slice(0,10),applicationUrl:"",employerVerified:false};
        contentSchema.parse(record);
        if(previous){const changed=await db().prepare("UPDATE content SET status=?,document=?,updatedAt=?,version=? WHERE id=? AND version=?").run(record.status,JSON.stringify(record),now,record.version,id,input.version);if(!changed.changes)fail("This job has changed. Refresh before saving.",409);}
        else{await db().prepare("INSERT INTO content VALUES (?,?,?,?,?,?,?,?)").run(id,"job",record.slug,record.status,JSON.stringify(record),now,now,record.version);await db().prepare("INSERT INTO ats_jobs VALUES (?,?)").run(id,user.organizationId);}
        await audit(user.email,"Company job saved",`${user.organizationId}: ${id} ${record.status}`);
      });return json({ok:true});
    }
    if(route==="applications/stage"){
      const value=z.object({id:text(80),status:z.enum(STAGES),updatedAt:text(40).min(1),message:text(2000).default("")}).parse(body);
      if(value.status==="withdrawn")fail("Only the candidate can withdraw an application.");
      await changeApplicationStage({...value,actor:user.email,organizationId:user.organizationId});
      return json({ok:true});
    }
    if(route==="notifications/retry"){
      const value=z.object({id:text(80),applicationId:text(80)}).parse(body);await ownedApplication(value.applicationId,user.organizationId);await retryApplicationEmail(value.id,value.applicationId);return json({ok:true});
    }
    if(route==="applications/note"){
      const value=z.object({id:text(80),message:text(4000).min(1)}).parse(body);const app=await ownedApplication(value.id,user.organizationId);await event(app.id,"note",app.status,value.message,"team",user.email);return json({ok:true},201);
    }
    if(route==="interviews/save"){
      const value=z.object({applicationId:text(80),title:text(160).min(3),startsAt:z.iso.datetime({offset:true}),timeZone:text(80).min(1),location:text(1500).min(2)}).parse(body);
      if(Date.parse(value.startsAt)<=Date.now())fail("Choose a future interview time.");try{new Intl.DateTimeFormat("en",{timeZone:value.timeZone});}catch{fail("Choose a valid IANA time zone, such as Europe/London.");}
      if(/^https?:/i.test(value.location)&&!/^https:\/\/[^\s]+$/.test(value.location))fail("Use an HTTPS meeting link or a plain-text location.");
      await transaction(async()=>{const app=await ownedApplication(value.applicationId,user.organizationId);if(["withdrawn","hired","rejected"].includes(app.status))fail("Interviews cannot be scheduled for closed applications.",409);const now=new Date().toISOString();await db().prepare("INSERT INTO ats_interviews VALUES (?,?,?,?,?,?,?,?,?)").run(randomUUID(),app.id,user.organizationId,value.title,value.startsAt,value.timeZone,value.location,"scheduled",now);if(STAGES.indexOf(app.status)<STAGES.indexOf("interview")){const updatedAt=new Date(Math.max(Date.now(),Date.parse(app.updatedAt)+1)).toISOString();await db().prepare("UPDATE candidate_applications SET status='interview',updatedAt=? WHERE id=?").run(updatedAt,app.id);app.status="interview";}await event(app.id,"interview",app.status,`${value.title} scheduled for ${value.startsAt} (${value.timeZone}).`,"candidate",user.email);await audit(user.email,"Interview scheduled",app.id);});return json({ok:true},201);
    }
    if(route==="interviews/cancel"){
      const value=z.object({id:text(80)}).parse(body);await transaction(async()=>{const row=await db().prepare("SELECT applicationId,title FROM ats_interviews WHERE id=? AND organizationId=? AND status='scheduled'").get(value.id,user.organizationId) as {applicationId:string;title:string}|undefined;if(!row)fail("Interview is unavailable.",404);const app=await ownedApplication(row.applicationId,user.organizationId);await db().prepare("UPDATE ats_interviews SET status='cancelled' WHERE id=? AND organizationId=?").run(value.id,user.organizationId);await event(app.id,"interview",app.status,`${row.title} was cancelled.`,"candidate",user.email);});return json({ok:true});
    }
    if(route==="team/invite"){
      await requireEmployer(true);const value=z.object({email}).parse(body);const token=randomBytes(32).toString("hex");await db().prepare("INSERT INTO ats_invites VALUES (?,?,?,?)").run(tokenHash(token),user.organizationId,value.email,Date.now()+48*60*60*1000);await audit(user.email,"Company invitation created",value.email);return json({ok:true,token},201);
    }
    if(route==="team/remove"){
      await requireEmployer(true);const value=z.object({id:text(80)}).parse(body);if(value.id===user.id)fail("You cannot remove your own account.");await transaction(async()=>{const changed=await db().prepare("DELETE FROM ats_employers WHERE id=? AND organizationId=? AND role='recruiter'").run(value.id,user.organizationId);if(!changed.changes)fail("Team member unavailable.",404);await audit(user.email,"Company team member removed",value.id);});return json({ok:true});
    }
    if(route==="password"){
      const value=z.object({currentPassword:text(128).min(1),password:z.string().min(12).max(128)}).parse(body);await limit(`employer-password:${user.id}`,8);const row=await db().prepare("SELECT password FROM ats_employers WHERE id=?").get(user.id) as {password:string};if(!await verifyPassword(value.currentPassword,row.password))fail("Current password is incorrect.");const password=await hashPassword(value.password);await transaction(async()=>{await db().prepare("UPDATE ats_employers SET password=? WHERE id=?").run(password,user.id);await db().prepare("DELETE FROM ats_sessions WHERE userId=?").run(user.id);});await session(user.id);return json({ok:true});
    }
    return json({error:"Not found."},404);
  }catch(error){if(error instanceof z.ZodError)return json({error:error.issues[0]?.message||"Check your entries."},400);const e=error as Error&{status?:number};if(e.status)return json({error:e.message},e.status);if(e.message?.includes("UNIQUE constraint"))return json({error:"An account or record already exists with these details."},409);console.error("ATS request failed",e);return json({error:"We couldn't complete this request. Please try again."},500);}
}

import "server-only";
import { randomUUID } from "node:crypto";
import { db, transaction, audit } from "@/lib/admin/db";
import { queueApplicationEmail } from "@/lib/notifications";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/ats-types";

function fail(message:string,status=409):never{throw Object.assign(new Error(message),{status});}
export async function recordApplicationEvent(applicationId:string,kind:string,stage:string,message:string,visibility:"candidate"|"team",actor:string){
  return transaction(async()=>{
  const id=randomUUID();
  await db().prepare("INSERT INTO ats_events VALUES (?,?,?,?,?,?,?,?)").run(id,applicationId,kind,stage,message,visibility,actor,new Date().toISOString());
  if(visibility==="candidate")await queueApplicationEmail(id,applicationId,stage,message);
  return id;
  });
}
export async function changeApplicationStage(input:{id:string;status:Stage;updatedAt?:string;message?:string;actor:string;organizationId?:string}){
  return transaction(async()=>{
    const app=await db().prepare("SELECT a.id,a.status,a.updatedAt FROM candidate_applications a LEFT JOIN ats_jobs j ON j.jobId=a.jobId WHERE a.id=? AND (? IS NULL OR j.organizationId=?)").get(input.id,input.organizationId||null,input.organizationId||null) as {id:string;status:Stage;updatedAt:string}|undefined;
    if(!app)fail("Application not found in this workspace.",404);
    if(["hired","rejected","withdrawn"].includes(app.status))fail("This application is closed and cannot be advanced.");
    if(!input.updatedAt||input.updatedAt!==app.updatedAt)fail("Another team member may have changed this application. Refresh before saving.");
    if(input.status==="withdrawn")fail("Only the candidate can withdraw an application.",400);
    const message=input.message?.trim()||"";
    if(input.status===app.status&&!message)return {changed:false};
    if(input.status!==app.status&&input.status!=="rejected"&&STAGES.indexOf(input.status)<=STAGES.indexOf(app.status))fail("Choose a later stage or reject the application.");
    const now=new Date(Math.max(Date.now(),Date.parse(app.updatedAt)+1)).toISOString();
    const changed=await db().prepare("UPDATE candidate_applications SET status=?,updatedAt=? WHERE id=? AND updatedAt=? AND status=?").run(input.status,now,app.id,app.updatedAt,app.status);
    if(!changed.changes)fail("Application changed. Refresh before saving.");
    await recordApplicationEvent(app.id,input.status===app.status?"message":"stage",input.status,message||`Your application status is now ${STAGE_LABELS[input.status]}.`,"candidate",input.actor);
    await audit(input.actor,"Application updated",`${app.id}: ${app.status} → ${input.status}`);
    return {changed:true};
  });
}

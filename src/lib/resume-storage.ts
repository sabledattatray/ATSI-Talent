import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { db, transaction } from "@/lib/admin/db";
export async function storeCandidateResume(candidateId:string,bytes:Buffer,filename:string){
  const extension=filename.toLowerCase().split(".").at(-1)||"";
  const types:Record<string,string>={pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",txt:"text/plain",md:"text/plain"};
  const type=types[extension];if(!type)throw Object.assign(new Error("Unsupported resume format."),{status:400});
  return transaction(async()=>{
    const hash=createHash("sha256").update(bytes).digest("hex");
    const previous=await db().prepare("SELECT id FROM ats_resumes WHERE candidateId=? AND hash=?").get(candidateId,hash) as {id:string}|undefined;
    if(previous)return `/api/ats/resume/${previous.id}`;
    const count=await db().prepare("SELECT count(*) AS total FROM ats_resumes WHERE candidateId=?").get(candidateId) as {total:number};
    if(Number(count.total)>=10)throw Object.assign(new Error("You have reached the limit of 10 stored resumes. Paste resume text to update your profile, or contact support to remove older files."),{status:409});
    const id=randomUUID();const safeName=filename.replace(/[^\p{L}\p{N} ._-]/gu,"_").slice(0,160)||`resume.${extension}`;
    await db().prepare("INSERT INTO ats_resumes VALUES (?,?,?,?,?,?,?)").run(id,candidateId,safeName,type,bytes,hash,new Date().toISOString());
    return `/api/ats/resume/${id}`;
  });
}

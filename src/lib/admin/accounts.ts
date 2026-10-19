import "server-only";
import { z } from "zod";
import { db,transaction,audit } from "./db";
import { accountTable,authError,type AccountScope } from "@/lib/auth/identity";
const directory="SELECT 'candidate' AS scope,c.id,c.name,c.email,c.createdAt,'candidate' AS role,'' AS organizationId,'' AS company,COALESCE(k.status,'active') AS status,COALESCE(k.version,0) AS version,m.registeredWith,m.googleSub IS NOT NULL AS googleLinked,m.emailVerifiedAt,m.verifiedEmail,m.lastMethod,m.lastLoginAt FROM candidate_accounts c LEFT JOIN account_auth m ON m.scope='candidate' AND m.userId=c.id LEFT JOIN account_controls k ON k.scope='candidate' AND k.userId=c.id UNION ALL SELECT 'employer' AS scope,e.id,e.name,e.email,e.createdAt,e.role,e.organizationId,o.name AS company,COALESCE(k.status,'active') AS status,COALESCE(k.version,0) AS version,m.registeredWith,m.googleSub IS NOT NULL AS googleLinked,m.emailVerifiedAt,m.verifiedEmail,m.lastMethod,m.lastLoginAt FROM ats_employers e JOIN ats_organizations o ON o.id=e.organizationId LEFT JOIN account_auth m ON m.scope='employer' AND m.userId=e.id LEFT JOIN account_controls k ON k.scope='employer' AND k.userId=e.id";
export type ManagedAccount={scope:AccountScope;id:string;name:string;email:string;createdAt:string;role:"candidate"|"owner"|"recruiter";organizationId:string;company:string;status:"active"|"suspended";version:number;registeredWith:string|null;googleLinked:number;emailVerifiedAt:string|null;verifiedEmail:string|null;lastMethod:string|null;lastLoginAt:string|null};
export async function listAccounts(params:URLSearchParams){
  const value=z.object({q:z.string().trim().max(160).default(""),scope:z.enum(["all","candidate","employer"]).default("all"),status:z.enum(["all","active","suspended"]).default("all"),method:z.enum(["all","email","google_one_tap","google_button"]).default("all"),page:z.coerce.number().int().min(1).max(100000).default(1)}).parse(Object.fromEntries(params));
  const where=" WHERE (?='' OR instr(lower(name||' '||email||' '||company),?)>0) AND (?='all' OR scope=?) AND (?='all' OR status=?) AND (?='all' OR lastMethod=?)";
  const args=[value.q.toLowerCase(),value.q.toLowerCase(),value.scope,value.scope,value.status,value.status,value.method,value.method];
  const count=await db().prepare("SELECT count(*) AS total FROM ("+directory+")"+where).get(...args) as {total:number};
  const pageSize=25,page=Math.min(value.page,Math.max(1,Math.ceil(Number(count.total)/pageSize)));
  const users=await db().prepare("SELECT * FROM ("+directory+")"+where+" ORDER BY createdAt DESC,scope,id LIMIT ? OFFSET ?").all(...args,pageSize,(page-1)*pageSize) as ManagedAccount[];
  const totals=await db().prepare("SELECT count(*) AS total,COALESCE(sum(scope='candidate'),0) AS candidates,COALESCE(sum(scope='employer'),0) AS employers,COALESCE(sum(status='suspended'),0) AS suspended,COALESCE(sum(emailVerifiedAt IS NOT NULL AND verifiedEmail=email),0) AS verified FROM ("+directory+")").get();
  return {users,total:Number(count.total),page,pageSize,totals};
}
const target=z.object({scope:z.enum(["candidate","employer"]),id:z.string().min(1).max(80),version:z.number().int().min(0)});
async function current(scope:AccountScope,id:string){
  const record=await db().prepare("SELECT * FROM ("+directory+") WHERE scope=? AND id=?").get(scope,id) as ManagedAccount|undefined;
  if(!record)throw authError("This account no longer exists.",404);return record;
}
async function revoke(scope:AccountScope,id:string){
  await db().prepare("DELETE FROM "+(scope==="candidate"?"candidate_sessions WHERE candidateId=?":"ats_sessions WHERE userId=?")).run(id);
  await db().prepare("DELETE FROM auth_challenges WHERE scope=? AND userId=?").run(scope,id);
}
async function protectCompanyOwner(record:ManagedAccount,role:string,status:string,deleting=false){
  if(record.scope!=="employer"||record.role!=="owner"||(!deleting&&role==="owner"&&status==="active"))return;
  const others=await db().prepare("SELECT count(*) AS total FROM ats_employers e LEFT JOIN account_controls k ON k.scope='employer' AND k.userId=e.id WHERE e.organizationId=? AND e.id!=? AND e.role='owner' AND COALESCE(k.status,'active')='active'").get(record.organizationId,record.id) as {total:number};
  if(Number(others.total)<1)throw authError("Keep at least one active company owner. Promote another active team member first.",409);
}
export async function updateAccount(raw:unknown,actor:string){
  const value=target.extend({action:z.enum(["save","revoke-sessions"]),name:z.string().trim().min(2).max(80).optional(),email:z.email().max(254).transform(email=>email.toLowerCase().trim()).optional(),role:z.enum(["candidate","owner","recruiter"]).optional(),status:z.enum(["active","suspended"]).optional()}).strict().parse(raw);
  return transaction(async()=>{
    const record=await current(value.scope,value.id);if(record.version!==value.version)throw authError("Someone changed this account. Refresh the user list before saving.",409);
    const name=value.name??record.name,email=value.email??record.email,role=value.role??record.role,status=value.status??record.status;
    if(value.action==="save"){
      if((value.scope==="candidate"&&role!=="candidate")||(value.scope==="employer"&&role==="candidate"))throw authError("Account types cannot be converted here. Employer roles apply within their existing company only.");
      await protectCompanyOwner(record,role,status);
      if(email!==record.email&&record.googleLinked)throw authError("A Google-linked account must keep the verified Google email address. Contact support before changing it.",409);
      if(value.scope==="candidate")await db().prepare("UPDATE candidate_accounts SET name=?,email=? WHERE id=?").run(name,email,value.id);
      else await db().prepare("UPDATE ats_employers SET name=?,email=?,role=? WHERE id=?").run(name,email,role,value.id);
      if(email!==record.email)await db().prepare("UPDATE account_auth SET emailVerifiedAt=NULL,verifiedEmail='' WHERE scope=? AND userId=?").run(value.scope,value.id);
    }
    await revoke(value.scope,value.id);
    await db().prepare("INSERT INTO account_controls VALUES (?,?,?,?,?) ON CONFLICT(scope,userId) DO UPDATE SET status=excluded.status,version=excluded.version,updatedAt=excluded.updatedAt").run(value.scope,value.id,value.action==="save"?status:record.status,record.version+1,new Date().toISOString());
    await audit(actor,value.action==="save"?"User account updated":"User sessions revoked",JSON.stringify({scope:value.scope,id:value.id,role:value.action==="save"?role:record.role,status:value.action==="save"?status:record.status,emailChanged:value.action==="save"&&email!==record.email}));
    return {ok:true};
  });
}
export async function deleteAccount(raw:unknown,actor:string){
  const value=target.extend({confirmEmail:z.string().max(254)}).strict().parse(raw);
  return transaction(async()=>{
    const record=await current(value.scope,value.id);if(record.version!==value.version)throw authError("Someone changed this account. Refresh before deleting.",409);
    if(value.confirmEmail!==record.email)throw authError("Type the account email exactly to confirm deletion.");
    await protectCompanyOwner(record,record.role,record.status,true);
    await revoke(value.scope,value.id);
    if(value.scope==="candidate"){
      for(const table of ["ats_notifications","ats_interviews","ats_events"])await db().prepare("DELETE FROM "+table+" WHERE applicationId IN (SELECT id FROM candidate_applications WHERE candidateId=?)").run(value.id);
      await db().prepare("DELETE FROM candidate_applications WHERE candidateId=?").run(value.id);
      await db().prepare("DELETE FROM candidate_saved_jobs WHERE candidateId=?").run(value.id);
      await db().prepare("DELETE FROM ats_resumes WHERE candidateId=?").run(value.id);
    }
    await db().prepare("DELETE FROM "+accountTable(value.scope)+" WHERE id=?").run(value.id);
    await audit(actor,"User account deleted",JSON.stringify({scope:value.scope,id:value.id}));
    return {ok:true};
  });
}

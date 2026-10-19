import "server-only";
import { OAuth2Client } from "google-auth-library";
import { randomBytes,randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { db,transaction } from "@/lib/admin/db";
import { hashPassword,tokenHash } from "@/lib/admin/auth";
import { toCountryCode,isCountryCode } from "@/lib/countries";
import { accountTable,authError,completeLogin,sessionCookie,type AccountScope,type LoginMethod } from "./identity";
const verifier=new OAuth2Client();
const nonceCookie=(scope:AccountScope)=>"atsai_google_nonce_"+scope;
export function googleClientId(){return process.env.GOOGLE_CLIENT_ID?.trim()||"";}
export async function googleConfiguration(scope:AccountScope){
  const clientId=googleClientId();
  if(!clientId)return {enabled:false,clientId:""};
  const jar=await cookies(),old=jar.get(nonceCookie(scope))?.value;
  if(old)await db().prepare("DELETE FROM auth_google_nonces WHERE hash=?").run(tokenHash(old));
  const nonce=randomBytes(32).toString("hex");
  await db().prepare("DELETE FROM auth_google_nonces WHERE expiresAt<?").run(Date.now());
  await db().prepare("INSERT INTO auth_google_nonces VALUES (?,?,?)").run(tokenHash(nonce),scope,Date.now()+600_000);
  jar.set(nonceCookie(scope),nonce,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
  return {enabled:true,clientId,nonce};
}
export async function googleLogin(scope:AccountScope,body:unknown){
  const value=z.object({credential:z.string().min(50).max(12000),method:z.enum(["google_one_tap","google_button"]),consent:z.boolean().optional(),intent:z.enum(["login","signup","accept","link"]).default("login"),company:z.string().trim().min(2).max(120).optional(),country:z.string().trim().max(120).optional(),website:z.string().trim().max(1000).default(""),invite:z.string().max(128).optional()}).parse(body);
  const clientId=googleClientId();if(!clientId)throw authError("Google sign-in is not configured yet.",503);
  const jar=await cookies(),nonce=jar.get(nonceCookie(scope))?.value;
  if(!nonce)throw authError("Google sign-in expired. Refresh the page and try again.",401);
  let identity:{sub:string;email:string;name:string};
  try {
    const ticket=await verifier.verifyIdToken({idToken:value.credential,audience:clientId});
    const payload=ticket.getPayload() as {sub?:string;email?:string;name?:string;email_verified?:boolean;nonce?:string}|undefined;
    if(!payload?.sub||!payload.email||payload.email_verified!==true||payload.nonce!==nonce)throw new Error("Unverified Google identity");
    identity={sub:payload.sub,email:z.email().max(254).parse(payload.email).toLowerCase(),name:(payload.name||payload.email.split("@")[0]).slice(0,80)};
  }catch{throw authError("Google could not verify this sign-in. Please try again.",401);}
  await transaction(async()=>{
    const consumed=await db().prepare("DELETE FROM auth_google_nonces WHERE hash=? AND scope=? AND expiresAt>?").run(tokenHash(nonce),scope,Date.now());
    if(!consumed.changes)throw authError("Google sign-in was already used or expired. Refresh the page.",401);
    const linked=await db().prepare("SELECT userId FROM account_auth WHERE scope=? AND googleSub=?").get(scope,identity.sub) as {userId:string}|undefined;
    const byEmail=await db().prepare("SELECT id,email FROM "+accountTable(scope)+" WHERE email=?").get(identity.email) as {id:string;email:string}|undefined;
    let id=linked?.userId;
    if(id){
      const account=await db().prepare("SELECT email FROM "+accountTable(scope)+" WHERE id=?").get(id) as {email:string}|undefined;
      if(!account||account.email!==identity.email)throw authError("This Google account no longer matches your account email. Contact support.",409);
    }else if(byEmail){
      // Matching an email alone must never attach an external identity to an existing account.
      const session=(await cookies()).get(sessionCookie(scope))?.value;
      const sessions=scope==="candidate"?"candidate_sessions":"ats_sessions",field=scope==="candidate"?"candidateId":"userId";
      const current=session?await db().prepare("SELECT s."+field+" AS id FROM "+sessions+" s JOIN account_auth m ON m.userId=s."+field+" AND m.scope=? WHERE s.hash=? AND s.expiresAt>? AND m.emailVerifiedAt IS NOT NULL AND m.verifiedEmail=?").get(scope,tokenHash(session),Date.now(),identity.email) as {id:string}|undefined:undefined;
      if(!current||current.id!==byEmail.id||value.intent!=="link")throw authError("An email account already uses this address. Sign in with your password, verify your email, then link Google in Account security.",409);
      const meta=await db().prepare("SELECT googleSub FROM account_auth WHERE scope=? AND userId=?").get(scope,byEmail.id) as {googleSub:string|null}|undefined;
      if(meta?.googleSub&&meta.googleSub!==identity.sub)throw authError("A different Google identity is already linked. Contact support to change it.",409);
      id=byEmail.id;
      await db().prepare("UPDATE account_auth SET googleSub=? WHERE scope=? AND userId=? AND googleSub IS NULL").run(identity.sub,scope,id);
    }else{
      if(value.intent!=="signup"&&value.intent!=="accept")throw authError("No account exists yet. Open Create account to register with Google.",404);
      if(!value.consent)throw authError("Agree to the account terms and privacy notice before creating an account.");
      id=randomUUID();const now=new Date().toISOString(),password=await hashPassword(randomBytes(48).toString("hex"));
      if(scope==="candidate"){
        await db().prepare("INSERT INTO candidate_accounts VALUES (?,?,?,?,?,?,?)").run(id,identity.name,identity.email,password,JSON.stringify({phone:"",location:"",skills:"",experience:0,resumeUrl:""}),now,now);
      }else{
        let organizationId:string,role="owner";
        if(value.intent==="accept"){
          const invite=await db().prepare("SELECT organizationId,email FROM ats_invites WHERE hash=? AND expiresAt>?").get(tokenHash(value.invite||""),Date.now()) as {organizationId:string;email:string}|undefined;
          if(!invite||invite.email!==identity.email)throw authError("This invitation is expired or belongs to another email.",403);
          organizationId=invite.organizationId;role="recruiter";
          await db().prepare("DELETE FROM ats_invites WHERE hash=?").run(tokenHash(value.invite||""));
        }else{
          const country=toCountryCode(value.country||"","");
          if(!value.company||!isCountryCode(country))throw authError("Enter your company name and country before continuing with Google.");
          if(value.website&&!/^https:\/\/[^\s]+$/.test(value.website))throw authError("Use an HTTPS company website URL.");
          organizationId=randomUUID();await db().prepare("INSERT INTO ats_organizations VALUES (?,?,?,?,?)").run(organizationId,value.company,country,value.website,now);
        }
        await db().prepare("INSERT INTO ats_employers VALUES (?,?,?,?,?,?,?)").run(id,organizationId,identity.name,identity.email,password,role,now);
      }
      await db().prepare("INSERT INTO account_auth (scope,userId,googleSub,verifiedEmail,emailVerifiedAt,registeredWith) VALUES (?,?,?,?,?,?)").run(scope,id,identity.sub,identity.email,now,"google");
    }
    await completeLogin(scope,id,value.method as LoginMethod);
  });
  jar.delete(nonceCookie(scope));
  return {ok:true};
}

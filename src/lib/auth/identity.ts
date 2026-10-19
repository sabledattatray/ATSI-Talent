import "server-only";
import { randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db, limit, transaction } from "@/lib/admin/db";
import { tokenHash } from "@/lib/admin/auth";
import { verificationEmail } from "@/lib/auth/verification-email";
export type AccountScope = "candidate" | "employer";
export type LoginMethod = "email" | "google_one_tap" | "google_button";
export const authError = (message: string, status = 400) => Object.assign(new Error(message), { status });
const challengeCookie = (scope: AccountScope) => "atsai_verify_" + scope;
export const sessionCookie = (scope: AccountScope) => scope === "candidate" ? "atsai_candidate_session" : "atsai_employer_session";
const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge });
export const accountTable = (scope: AccountScope) => scope === "candidate" ? "candidate_accounts" : "ats_employers";
export async function authRecord(scope: AccountScope, userId: string) {
  return await db().prepare("SELECT * FROM account_auth WHERE scope=? AND userId=?").get(scope,userId) as { googleSub: string | null; verifiedEmail: string; emailVerifiedAt: string | null; registeredWith: string } | undefined;
}
export async function ensureAuthRecord(scope: AccountScope, userId: string) {
  await db().prepare("INSERT INTO account_auth (scope,userId) VALUES (?,?) ON CONFLICT(scope,userId) DO NOTHING").run(scope,userId);
}
const otpDelivery=()=>({key:process.env.ATSAI_AUTH_RESEND_API_KEY?.trim()||process.env.RESEND_API_KEY?.trim(),from:process.env.ATSAI_AUTH_EMAIL_FROM?.trim()||process.env.ATSAI_EMAIL_FROM?.trim()});
export function assertEmailDeliveryConfigured() {
  if (!otpDelivery().key || !otpDelivery().from) throw authError("Email verification is temporarily unavailable. Please contact support or try Google sign-in.",503);
}
export async function assertAccountActive(scope:AccountScope,userId:string){
  const row=await db().prepare("SELECT status FROM account_controls WHERE scope=? AND userId=?").get(scope,userId) as {status:string}|undefined;
  if(row?.status==="suspended")throw authError("This account is suspended. Contact support for help.",403);
}
export async function completeLogin(scope: AccountScope,userId: string,method: LoginMethod) {
  const token=randomBytes(32).toString("hex"),now=new Date().toISOString(),expiresAt=Date.now()+8*60*60*1000;
  const table=scope === "candidate" ? "candidate_sessions" : "ats_sessions";
  await transaction(async () => {
    await assertAccountActive(scope,userId);
    await db().prepare("DELETE FROM "+table+" WHERE expiresAt<?").run(Date.now());
    await db().prepare("INSERT INTO "+table+" VALUES (?,?,?)").run(tokenHash(token),userId,expiresAt);
    await db().prepare("UPDATE account_auth SET lastMethod=?,lastLoginAt=? WHERE scope=? AND userId=?").run(method,now,scope,userId);
    await db().prepare("INSERT INTO auth_logins VALUES (?,?,?,?,?)").run(randomUUID(),scope,userId,method,now);
  });
  (await cookies()).set(sessionCookie(scope),token,cookieOptions(8*60*60));
}
export async function beginEmailVerification(scope: AccountScope,userId: string,email: string) {
  await assertAccountActive(scope,userId);
  assertEmailDeliveryConfigured();
  await limit("otp-send:"+scope+":"+tokenHash(email),5);
  const token=randomBytes(32).toString("hex"),id=tokenHash(token),code=String(randomInt(0,1_000_000)).padStart(6,"0");
  await ensureAuthRecord(scope,userId);
  await transaction(async()=>{
    const recent=await db().prepare("SELECT createdAt FROM auth_challenges WHERE scope=? AND userId=? ORDER BY createdAt DESC LIMIT 1").get(scope,userId) as {createdAt:number}|undefined;
    if(recent&&Date.now()-Number(recent.createdAt)<60_000)throw authError("Please wait 60 seconds before requesting another code.",429);
    await db().prepare("DELETE FROM auth_challenges WHERE expiresAt<?").run(Date.now());
    await db().prepare("INSERT INTO auth_challenges VALUES (?,?,?,?,?,?,0,?)").run(id,scope,userId,email,tokenHash(token+":"+code),Date.now()+600_000,Date.now());
  });
  try {
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+otpDelivery().key,"Content-Type":"application/json","Idempotency-Key":"atsai-verify-"+id},body:JSON.stringify({from:otpDelivery().from,to:[email],...verificationEmail(code,scope)}),signal:AbortSignal.timeout(12_000)});
    if(!response.ok) throw authError("We could not send your verification email. Please try signing in again shortly.",503);
    const delivery=await response.json() as {id?:unknown};
    if(typeof delivery.id!=="string"||!delivery.id)throw authError("Email delivery was not confirmed. Please try again shortly.",503);
  } catch(error) {
    await db().prepare("DELETE FROM auth_challenges WHERE id=?").run(id);
    if(error instanceof Error && "status" in error)throw error;
    throw authError("The email service is unavailable. Please try again shortly.",503);
  }
  await db().prepare("DELETE FROM auth_challenges WHERE scope=? AND userId=? AND id!=?").run(scope,userId,id);
  (await cookies()).set(challengeCookie(scope),token,cookieOptions(600));
  return {verificationRequired:true,email,message:"Check your email for a six-digit verification code. It expires in 10 minutes."};
}
export async function emailLogin(scope:AccountScope,userId:string,email:string) {
  await assertAccountActive(scope,userId);
  const meta=await authRecord(scope,userId);
  if(!meta?.emailVerifiedAt||meta.verifiedEmail!==email)return beginEmailVerification(scope,userId,email);
  await completeLogin(scope,userId,"email");
  return {ok:true};
}
export async function verifyEmailCode(scope:AccountScope,code:string) {
  const jar=await cookies(),token=jar.get(challengeCookie(scope))?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))throw authError("Your verification request expired. Sign in again to get a new code.");
  const outcome=await transaction(async () => {
    const row=await db().prepare("SELECT * FROM auth_challenges WHERE id=? AND scope=?").get(tokenHash(token),scope) as {userId:string;email:string;codeHash:string;expiresAt:number;attempts:number}|undefined;
    if(!row||Number(row.expiresAt)<=Date.now()||Number(row.attempts)>=5)return false;
    await db().prepare("UPDATE auth_challenges SET attempts=attempts+1 WHERE id=?").run(tokenHash(token));
    const actual=Buffer.from(tokenHash(token+":"+code)),expected=Buffer.from(row.codeHash);
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;
    const account=await db().prepare("SELECT email FROM "+accountTable(scope)+" WHERE id=?").get(row.userId) as {email:string}|undefined;
    if(!account||account.email!==row.email)return false;
    await db().prepare("UPDATE account_auth SET emailVerifiedAt=?,verifiedEmail=? WHERE scope=? AND userId=?").run(new Date().toISOString(),row.email,scope,row.userId);
    await db().prepare("DELETE FROM auth_challenges WHERE scope=? AND userId=?").run(scope,row.userId);
    await completeLogin(scope,row.userId,"email");
    return true;
  });
  if(!outcome)throw authError("That code is invalid, expired or has reached its attempt limit. Request a new code if needed.");
  jar.delete(challengeCookie(scope));
  return {ok:true};
}
export async function resendEmailCode(scope:AccountScope) {
  const token=(await cookies()).get(challengeCookie(scope))?.value;
  if(!token)throw authError("Sign in again to request a new verification code.");
  const row=await db().prepare("SELECT userId,email FROM auth_challenges WHERE id=? AND scope=?").get(tokenHash(token),scope) as {userId:string;email:string}|undefined;
  if(!row)throw authError("Sign in again to request a new verification code.");
  return beginEmailVerification(scope,row.userId,row.email);
}

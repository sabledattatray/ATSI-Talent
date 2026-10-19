import { z } from "zod";
import { assertOrigin,requireUser,tokenHash } from "@/lib/admin/auth";
import { db,limit } from "@/lib/admin/db";
import { verifyEmailCode,resendEmailCode } from "@/lib/auth/identity";
import { googleConfiguration,googleLogin } from "@/lib/auth/google";
type Context={params:Promise<{path:string[]}>};
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(_request:Request,context:Context){
  try{
    if((await context.params).path.join("/")!=="activity")return response({error:"Not found."},404);
    await requireUser(true);
    const users=await db().prepare("SELECT 'candidate' AS scope,c.id,c.name,c.email,c.createdAt,m.registeredWith,m.googleSub IS NOT NULL AS googleLinked,m.emailVerifiedAt,m.verifiedEmail,m.lastMethod,m.lastLoginAt FROM candidate_accounts c LEFT JOIN account_auth m ON m.scope='candidate' AND m.userId=c.id UNION ALL SELECT 'employer' AS scope,e.id,e.name,e.email,e.createdAt,m.registeredWith,m.googleSub IS NOT NULL AS googleLinked,m.emailVerifiedAt,m.verifiedEmail,m.lastMethod,m.lastLoginAt FROM ats_employers e LEFT JOIN account_auth m ON m.scope='employer' AND m.userId=e.id ORDER BY createdAt DESC LIMIT 500").all();
    const events=await db().prepare("SELECT l.scope,l.method,l.createdAt,COALESCE(c.name,e.name) AS name,COALESCE(c.email,e.email) AS email FROM auth_logins l LEFT JOIN candidate_accounts c ON l.scope='candidate' AND c.id=l.userId LEFT JOIN ats_employers e ON l.scope='employer' AND e.id=l.userId WHERE c.id IS NOT NULL OR e.id IS NOT NULL ORDER BY l.createdAt DESC LIMIT 100").all();
    return response({users,events});
  }catch(error){return failure(error);}
}
export async function POST(request:Request,context:Context){
  try{
    assertOrigin(request);
    if(Number(request.headers.get("content-length"))>20000)return response({error:"Request is too large."},413);
    const text=await request.text();if(Buffer.byteLength(text)>20000)return response({error:"Request is too large."},413);
    let raw:unknown;try{raw=JSON.parse(text);}catch{return response({error:"Invalid request."},400);}
    const {scope}=z.object({scope:z.enum(["candidate","employer"])}).parse(raw);
    const route=(await context.params).path.join("/");
    const fingerprint=tokenHash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local");
    await limit("identity-ip:"+fingerprint,60);
    if(route==="google/config")return response(await googleConfiguration(scope));
    if(route==="google")return response(await googleLogin(scope,raw));
    if(route==="otp/verify"){const {code}=z.object({code:z.string().regex(/^\d{6}$/, "Enter the six-digit code from your email.")}).parse(raw);return response(await verifyEmailCode(scope,code));}
    if(route==="otp/resend")return response(await resendEmailCode(scope));
    return response({error:"Not found."},404);
  }catch(error){return failure(error);}
}
function failure(error:unknown){
  if(error instanceof z.ZodError)return response({error:error.issues[0]?.message||"Check your entries."},400);
  const e=error as Error&{status?:number};
  if(e.status)return response({error:e.message},e.status);
  if(e.message?.includes("UNIQUE constraint failed"))return response({error:"This account or Google identity is already registered."},409);
  console.error("Identity request failed");return response({error:"Sign-in is temporarily unavailable. Please try again."},500);
}
export const maxDuration=30;

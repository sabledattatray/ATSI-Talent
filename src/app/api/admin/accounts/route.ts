import { z } from "zod";
import { assertOrigin,requireUser } from "@/lib/admin/auth";
import { listAccounts,updateAccount,deleteAccount } from "@/lib/admin/accounts";
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
function failure(error:unknown){if(error instanceof z.ZodError)return response({error:error.issues[0]?.message||"Check your entries."},400);const e=error as Error&{status?:number};if(e.status)return response({error:e.message},e.status);if(e.message?.includes("UNIQUE constraint failed"))return response({error:"That email is already registered for this account type."},409);console.error("Account management request failed");return response({error:"Could not update this account. Please try again."},500);}
export async function GET(request:Request){try{await requireUser(true);return response(await listAccounts(new URL(request.url).searchParams));}catch(error){return failure(error);}}
async function mutate(request:Request,remove:boolean){try{assertOrigin(request);const owner=await requireUser(true);if(Number(request.headers.get("content-length"))>6000)return response({error:"Request too large."},413);const text=await request.text();if(Buffer.byteLength(text)>6000)return response({error:"Request too large."},413);let raw:unknown;try{raw=JSON.parse(text);}catch{return response({error:"Invalid JSON."},400);}return response(await(remove?deleteAccount(raw,owner.email):updateAccount(raw,owner.email)));}catch(error){return failure(error);}}
export async function POST(request:Request){return mutate(request,false);}
export async function DELETE(request:Request){return mutate(request,true);}

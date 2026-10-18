import { atsRequest } from "@/lib/ats";
import { after } from "next/server";
import { openApplicationStream } from "@/lib/live-tracking";
import { drainEmailOutbox } from "@/lib/notifications";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request:Request,context:Context) { const route=(await context.params).path.join("/");return route==="updates"?openApplicationStream(request,"employer"):atsRequest(request,route); }
export async function POST(request:Request,context:Context) { const response=await atsRequest(request,(await context.params).path.join("/"));if(response.ok)after(async()=>{try{await drainEmailOutbox(3);}catch{console.error("Email outbox processing will be retried.");}});return response; }

export const maxDuration = 60;

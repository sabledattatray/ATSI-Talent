import { timingSafeEqual } from "node:crypto";
import { tokenHash } from "@/lib/admin/auth";
import { drainEmailOutbox } from "@/lib/notifications";
export async function GET(request:Request){
  const secret=process.env.CRON_SECRET;if(!secret||secret.length<32)return Response.json({error:"Notification worker is not configured."},{status:503});
  const token=(request.headers.get("authorization")||"").replace(/^Bearer /,"");
  if(!timingSafeEqual(Buffer.from(tokenHash(token)),Buffer.from(tokenHash(secret))))return Response.json({error:"Unauthorized."},{status:401});
  return Response.json(await drainEmailOutbox(3),{headers:{"Cache-Control":"no-store"}});
}

export const maxDuration = 60;

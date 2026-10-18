import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/admin/db";
import { tokenHash } from "@/lib/admin/auth";

export async function openApplicationStream(request:Request,kind:"candidate"|"employer"){
  const token=(await cookies()).get(kind==="candidate"?"atsai_candidate_session":"atsai_employer_session")?.value;
  if(!token||token.length!==64)return Response.json({error:"Please sign in."},{status:401});
  const hash=tokenHash(token);
  async function owner(){return kind==="candidate"
    ?await db().prepare("SELECT candidateId AS id FROM candidate_sessions WHERE hash=? AND expiresAt>?").get(hash,Date.now()) as {id:string}|undefined
    :await db().prepare("SELECT e.organizationId AS id FROM ats_sessions s JOIN ats_employers e ON e.id=s.userId WHERE s.hash=? AND s.expiresAt>?").get(hash,Date.now()) as {id:string}|undefined;}
  const principal=await owner();if(!principal)return Response.json({error:"Please sign in."},{status:401});
  let closed=false,timer:ReturnType<typeof setTimeout>|undefined;
  const encoder=new TextEncoder();const deadline=Date.now()+25_000;
  let revision=request.headers.get("last-event-id")||"";
  let stop=()=>{};
  const stream=new ReadableStream<Uint8Array>({
    start(controller){
      stop=()=>{if(closed)return;closed=true;if(timer)clearTimeout(timer);request.signal.removeEventListener("abort",stop);try{controller.close();}catch{}};
      request.signal.addEventListener("abort",stop,{once:true});
      if(request.signal.aborted){stop();return;}
      controller.enqueue(encoder.encode("retry: 1000\n\n"));
      const tick=async()=>{
        try{
          const current=await owner();if(closed)return;if(!current||current.id!==principal!.id){stop();return;}
          const rows=kind==="candidate"
            ?await db().prepare("SELECT a.id,a.status,a.updatedAt,(SELECT COUNT(*) FROM ats_events e WHERE e.applicationId=a.id AND e.visibility='candidate') AS events FROM candidate_applications a WHERE a.candidateId=? ORDER BY a.id").all(principal!.id)
            :await db().prepare("SELECT a.id,a.status,a.updatedAt,(SELECT COUNT(*) FROM ats_events e WHERE e.applicationId=a.id) AS events FROM candidate_applications a JOIN ats_jobs j ON j.jobId=a.jobId WHERE j.organizationId=? ORDER BY a.id").all(principal!.id);
          if(closed)return;
          const next=createHash("sha256").update(JSON.stringify(rows)).digest("hex");
          if(next!==revision){revision=next;controller.enqueue(encoder.encode(`id: ${revision}\nevent: updates\ndata: ${JSON.stringify({revision})}\n\n`));}
          else controller.enqueue(encoder.encode(": heartbeat\n\n"));
          if(Date.now()>=deadline){stop();return;}
          timer=setTimeout(()=>void tick(),2000);
        }catch{stop();}
      };
      void tick();
    },
    cancel(){stop();},
  });
  return new Response(stream,{headers:{"Content-Type":"text/event-stream","Cache-Control":"private, no-store, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"}});
}

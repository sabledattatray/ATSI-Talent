"use client";
import { useEffect, useState } from "react";
import { STAGE_LABELS, type Stage, type Interview, type TrackingEvent } from "@/lib/ats-types";
import "./ats.css";
type Tracking={status:Stage;events:TrackingEvent[];interviews:Interview[]};
export function ApplicationTracking({id}:{id:string}){
  const [data,setData]=useState<Tracking|null>(null);const [error,setError]=useState("");
  useEffect(()=>{let active=true;const controller=new AbortController();const load=async()=>{try{const r=await fetch(`/api/recruitment/tracking?id=${encodeURIComponent(id)}`,{cache:"no-store",signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);if(active){setData(body);setError("");}}catch(e){if(active&&!controller.signal.aborted)setError((e as Error).message);}};void load();const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},15000);return()=>{active=false;controller.abort();clearInterval(timer);};},[id]);
  return <details className="ats-application-tracking"><summary>{data?`${STAGE_LABELS[data.status]} · Application timeline`:"Application timeline"}</summary>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>Loading updates…</p>}{data&&<><p>Current stage: <strong>{STAGE_LABELS[data.status]}</strong></p>{data.interviews.map(i=><article key={i.id}><strong>{i.title} · {i.status}</strong><p>{new Date(i.startsAt).toLocaleString(undefined,{timeZone:i.timeZone})} ({i.timeZone})</p>{/^https:\/\//i.test(i.location)?<a href={i.location} target="_blank" rel="noreferrer">Open interview meeting</a>:<p>{i.location}</p>}</article>)}{data.events.map(e=><article key={e.id}><p>{e.message}</p><small>{new Date(e.createdAt).toLocaleString()}</small></article>)}{!data.events.length&&<p>Your application has been received. Updates from the hiring team will appear here.</p>}</>}</details>;
}

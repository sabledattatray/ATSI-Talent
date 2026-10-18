"use client";
type Listener={update:()=>void;connection?:(connected:boolean)=>void};
type Channel={listeners:Set<Listener>;source:EventSource|null;revision:string;visibility:()=>void};
const channels=new Map<string,Channel>();
export function subscribeToApplicationUpdates(kind:"candidate"|"employer",update:()=>void,connection?:(connected:boolean)=>void){
  if(typeof EventSource==="undefined")return()=>{};
  let channel=channels.get(kind);
  if(!channel){
    const entry:Channel={listeners:new Set(),source:null,revision:"",visibility:()=>{}};
    const connect=()=>{
      if(document.visibilityState!=="visible"||entry.source||!entry.listeners.size)return;
      const source=new EventSource(kind==="candidate"?"/api/recruitment/updates":"/api/ats/updates");entry.source=source;
      source.onopen=()=>{for(const listener of entry.listeners)listener.connection?.(true);};
      source.onerror=()=>{for(const listener of entry.listeners)listener.connection?.(false);};
      source.addEventListener("updates",event=>{
        let revision:string;try{revision=JSON.parse((event as MessageEvent).data).revision;}catch{return;}
        if(!revision||revision===entry.revision)return;entry.revision=revision;
        for(const listener of entry.listeners){listener.connection?.(true);listener.update();}
      });
    };
    entry.visibility=()=>{if(document.visibilityState==="hidden"){entry.source?.close();entry.source=null;for(const listener of entry.listeners)listener.connection?.(false);}else connect();};
    channel=entry;channels.set(kind,entry);document.addEventListener("visibilitychange",entry.visibility);
  }
  const listener={update,connection};channel.listeners.add(listener);channel.visibility();
  const current=channel;
  void Promise.resolve().then(()=>{if(current.listeners.has(listener))connection?.(current.source?.readyState===EventSource.OPEN);});
  return()=>{current.listeners.delete(listener);if(!current.listeners.size){current.source?.close();document.removeEventListener("visibilitychange",current.visibility);channels.delete(kind);}};
}

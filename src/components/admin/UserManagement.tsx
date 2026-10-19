"use client";
import { useEffect,useState,type FormEvent } from "react";
import Link from "next/link";
import { Edit3,LogOut,RefreshCw,Search,Trash2,Users,X } from "lucide-react";
import type { ManagedAccount } from "@/lib/admin/accounts";
import { Modal } from "@/components/common/Modal";
import { AuthenticationActivity } from "@/components/auth/AuthenticationActivity";
import "./users.css";
type Directory={users:ManagedAccount[];total:number;page:number;pageSize:number;totals:{total:number;candidates:number;employers:number;verified:number;suspended:number}};
const method=(value:string|null)=>value==="google_one_tap"?"Google One Tap":value==="google_button"?"Google button":value==="email"?"Email + password":"Not recorded";
const date=(value:string|null)=>value?new Date(value).toLocaleString("en-IN"):"Not recorded";
export function UserManagement(){
  const [data,setData]=useState<Directory|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false);
  const [query,setQuery]=useState(""),[draftQuery,setDraftQuery]=useState(""),[scope,setScope]=useState("all"),[status,setStatus]=useState("all"),[loginMethod,setLoginMethod]=useState("all"),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
  const [edit,setEdit]=useState<ManagedAccount|null>(null),[deleting,setDeleting]=useState<ManagedAccount|null>(null),[confirmation,setConfirmation]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    const params=new URLSearchParams({q:query,scope,status,method:loginMethod,page:String(page)});
    fetch("/api/admin/accounts?"+params,{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||"Could not load users.");return body;}).then(body=>{if(!controller.signal.aborted){setData(body);setError("");}}).catch(error=>{if(!controller.signal.aborted)setError(error.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[query,scope,status,loginMethod,page,revision]);
  function filter(setter:(value:string)=>void,value:string){setBusy(true);setPage(1);setter(value);setRevision(current=>current+1);}
  function refresh(){setBusy(true);setRevision(value=>value+1);}
  async function mutate(body:Record<string,unknown>,remove=false){
    setSaving(true);setError("");setMessage("");
    try{const response=await fetch("/api/admin/accounts",{method:remove?"DELETE":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not save changes.");setEdit(null);setDeleting(null);setConfirmation("");setMessage(remove?"Account deleted.":body.action==="revoke-sessions"?"All active sessions were revoked.":"Account updated. Existing sessions were revoked.");refresh();}
    catch(error){setError((error as Error).message);}finally{setSaving(false);}
  }
  function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!edit)return;const values=Object.fromEntries(new FormData(event.currentTarget));void mutate({action:"save",scope:edit.scope,id:edit.id,version:edit.version,name:values.name,email:edit.googleLinked?edit.email:values.email,role:edit.scope==="candidate"?"candidate":values.role,status:values.status});}
  return <div className="um-page">
    <div className="um-intro"><p>Registered candidate and employer accounts. Manage staff access separately in <Link href="/admin/team">Team members</Link>.</p><button type="button" className="cms-btn cms-secondary" onClick={refresh} disabled={busy||saving}><RefreshCw size={15}/>Refresh</button></div>
    {data&&<div className="um-stats">{[["Total users",data.totals.total],["Candidates",data.totals.candidates],["Employers",data.totals.employers],["Verified emails",data.totals.verified],["Suspended",data.totals.suspended]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
    {error&&<div className="cms-alert" role="alert">{error}</div>}{message&&<div className="um-success" role="status">{message}</div>}
    <section className="cms-panel">
      <div className="um-toolbar"><form onSubmit={event=>{event.preventDefault();filter(setQuery,draftQuery);}}><label><Search size={16}/><span className="sr-only">Search name, email or company</span><input value={draftQuery} onChange={event=>setDraftQuery(event.target.value)} maxLength={160} placeholder="Name, email or company"/></label><button type="submit" className="cms-btn cms-secondary" disabled={saving}>Search</button></form>
        <label><span className="sr-only">Account type</span><select value={scope} onChange={event=>filter(setScope,event.target.value)}><option value="all">All account types</option><option value="candidate">Candidates</option><option value="employer">Employers</option></select></label>
        <label><span className="sr-only">Account status</span><select value={status} onChange={event=>filter(setStatus,event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <label><span className="sr-only">Last login method</span><select value={loginMethod} onChange={event=>filter(setLoginMethod,event.target.value)}><option value="all">All login methods</option><option value="email">Email + password</option><option value="google_one_tap">Google One Tap</option><option value="google_button">Google button</option></select></label>
      </div>
      {busy&&<p className="um-loading" role="status">Loading users…</p>}
      {data&&<><div className="um-table-scroll"><table className="um-table"><thead><tr><th>User</th><th>Account / company</th><th>Role</th><th>Email</th><th>Last sign-in</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.users.map(user=><tr key={user.scope+user.id}>
        <td><strong>{user.name}</strong><span>{user.email}</span><small>Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}</small></td>
        <td><strong>{user.scope==="candidate"?"Candidate":"Employer"}</strong><span>{user.company||"Job-seeker account"}</span></td><td>{user.role==="owner"?"Company owner":user.role==="recruiter"?"Recruiter":"Candidate"}</td>
        <td><span className={user.emailVerifiedAt&&user.verifiedEmail===user.email?"um-badge um-good":"um-badge um-pending"}>{user.emailVerifiedAt&&user.verifiedEmail===user.email?"Verified":"Unverified"}</span>{!!user.googleLinked&&<small>Google linked</small>}</td>
        <td><strong>{method(user.lastMethod)}</strong><small>{date(user.lastLoginAt)}</small><small>Registered: {user.registeredWith==="google"?"Google":"email"}</small></td>
        <td><span className={user.status==="active"?"um-badge um-good":"um-badge um-suspended"}>{user.status}</span></td>
        <td><div className="um-actions"><button type="button" aria-label={"Edit "+user.email} title="Edit user" disabled={saving||busy} onClick={()=>{setError("");setEdit(user);}}><Edit3 size={16}/></button><button type="button" aria-label={"Sign out "+user.email} title="Revoke all sessions" disabled={saving||busy} onClick={()=>void mutate({action:"revoke-sessions",scope:user.scope,id:user.id,version:user.version})}><LogOut size={16}/></button><button type="button" className="um-delete" aria-label={"Delete "+user.email} title="Delete account" disabled={saving||busy} onClick={()=>{setError("");setConfirmation("");setDeleting(user);}}><Trash2 size={16}/></button></div></td>
      </tr>)}</tbody></table></div>{!data.users.length&&!busy&&<div className="um-empty"><Users size={28}/><h2>No users match these filters.</h2><p>Try a different name, account type or login method.</p></div>}
      <div className="um-pagination"><span>{data.total} matching users · Page {data.page} of {Math.max(1,Math.ceil(data.total/data.pageSize))}</span><div><button type="button" className="cms-btn cms-secondary" disabled={busy||saving||data.page<=1} onClick={()=>{setBusy(true);setPage(data.page-1);}}>Previous</button><button type="button" className="cms-btn cms-secondary" disabled={busy||saving||data.page*data.pageSize>=data.total} onClick={()=>{setBusy(true);setPage(data.page+1);}}>Next</button></div></div></>}
    </section>
    <AuthenticationActivity />
    {edit&&<Modal label="Edit user account" onClose={()=>{if(!saving)setEdit(null);}}><div className="um-modal"><div className="um-modal-heading"><h2>Edit user account</h2><button type="button" aria-label="Close editor" disabled={saving} onClick={()=>setEdit(null)}><X size={20}/></button></div><p>{edit.scope==="employer"?edit.company:"Candidate account"}</p>{error&&<div className="cms-alert" role="alert">{error}</div>}
      <form onSubmit={save}><label>Full name<input name="name" defaultValue={edit.name} required minLength={2} maxLength={80}/></label><label>Email address<input name="email" type="email" defaultValue={edit.email} disabled={!!edit.googleLinked} required maxLength={254}/>{!!edit.googleLinked&&<small>Linked to the verified Google email.</small>}</label>
        {edit.scope==="employer"?<label>Company role<select name="role" defaultValue={edit.role}><option value="owner">Company owner</option><option value="recruiter">Recruiter</option></select><small>This role applies to this company only. Keep at least one active company owner.</small></label>:<label>Role<input value="Candidate" readOnly/></label>}
        <label>Account status<select name="status" defaultValue={edit.status}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <p className="um-notice">Saving signs out this user on all devices. An email change requires verification again. Suspended users cannot sign in until restored.</p>
        <div className="um-modal-buttons"><button type="button" className="cms-btn cms-secondary" disabled={saving} onClick={()=>setEdit(null)}>Cancel</button><button type="submit" className="cms-btn cms-primary" disabled={saving}>{saving?"Saving…":"Save user"}</button></div>
      </form></div></Modal>}
    {deleting&&<Modal label="Delete user account" onClose={()=>{if(!saving)setDeleting(null);}}><div className="um-modal"><h2>Delete this account?</h2><p><strong>{deleting.name}</strong><br/>{deleting.email}</p><p>{deleting.scope==="candidate"?"This permanently deletes the candidate account, applications, interviews, saved jobs, private resumes and sign-in history.":"This permanently deletes this employer login and its sign-in history. Company jobs and applicants stay with the company. Another active owner must remain."}</p>{error&&<div className="cms-alert" role="alert">{error}</div>}
      <form onSubmit={event=>{event.preventDefault();void mutate({scope:deleting.scope,id:deleting.id,version:deleting.version,confirmEmail:confirmation},true);}}><label>Type {deleting.email} to confirm<input type="email" value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" required/></label><div className="um-modal-buttons"><button type="button" className="cms-btn cms-secondary" disabled={saving} onClick={()=>setDeleting(null)}>Cancel</button><button type="submit" className="cms-btn um-danger" disabled={saving||confirmation!==deleting.email}>{saving?"Deleting…":"Permanently delete account"}</button></div></form>
    </div></Modal>}
  </div>;
}

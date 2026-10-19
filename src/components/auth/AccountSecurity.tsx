"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleSignIn } from "./GoogleSignIn";
export function AccountSecurity({scope,email,googleLinked}:{scope:"candidate"|"employer";email:string;googleLinked:boolean}){
  const router=useRouter();
  return <section className="mx-auto my-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold">Account security</h1><p className="mt-4 text-sm text-slate-600">Signed in as {email}. Your email address is verified.</p><h2 className="mt-8 text-lg font-semibold">Google sign-in</h2>{googleLinked?<p className="mt-3 text-sm" role="status">Google is linked. You can use Google to sign in to this account.</p>:<><p className="mt-3 text-sm text-slate-600">Link the Google account with this same email address. Sign in with your existing password and verify your email before linking an existing account.</p><GoogleSignIn scope={scope} intent="link" onSuccess={()=>router.refresh()} /></>}<Link href={scope==="candidate"?"/candidate/dashboard":"/employer/dashboard"} className="mt-8 inline-block text-sm text-blue-700">Back to your workspace</Link></section>;
}

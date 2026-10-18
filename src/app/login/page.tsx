import { DEMO_MODE } from "@/lib/runtime";
import Link from "next/link";
export const metadata = { title: "Workspace preview", robots: { index: false, follow: false } };
export default function LoginPage() {
  return <div className="max-w-xl mx-auto px-6 py-16 space-y-6">
    <h1 className="text-3xl font-bold">Workspace preview</h1>
    <p>Account sign-in and multi-factor authentication are not connected. No credentials are collected.</p>
    {DEMO_MODE ? <><p>Explore sample workflows below. All roles share the same browser demo data; these links do not grant authenticated access.</p>
      <nav aria-label="Demo workspaces" className="grid grid-cols-2 gap-4">
        {["candidate", "employer", "recruiter", "admin"].map(role => <Link key={role} href={`/${role}/dashboard`} className="p-4 rounded-xl border border-slate-300 bg-white text-blue-700 capitalize">{role} demo</Link>)}
      </nav></> : <p>Workspaces are unavailable until secure authentication and authorization are implemented.</p>}
    <Link href="/jobs" className="text-blue-700 underline">Browse opportunities</Link>
  </div>;
}

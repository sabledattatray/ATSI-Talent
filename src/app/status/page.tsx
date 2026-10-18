import Link from "next/link";
export const metadata = { title: "Service availability" };
export default function StatusPage() {
  return <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
    <h1 className="text-3xl font-bold">Service availability</h1>
    <p>This project is a prototype. Uptime and latency monitoring are not connected, so no service-level measurements are available.</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Public website: preview available.</li>
      <li>Job and blog publishing: authenticated admin workspace with persistent SQLite storage.</li>
      <li>Candidate, employer, and recruiter workspaces: sample workflows in local development only.</li>
      <li>Email delivery, candidate authentication, and resume scanning: not configured.</li>
      <li>Applications, employer inquiries, abuse reports, and privacy requests: no operational submission service.</li>
    </ul>
    <Link href="/api/v1/status" className="text-blue-700 underline">View availability JSON</Link>
  </div>;
}

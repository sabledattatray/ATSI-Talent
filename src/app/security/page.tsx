import Link from "next/link";
export const metadata = { title: "Security implementation status" };
export default function SecurityPage() {
  return <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
    <h1 className="text-3xl font-bold">Security implementation status</h1>
    <p>This is a development prototype. It has not been certified against OWASP ASVS or audited for production handling of candidate information.</p>
    <h2 className="text-xl font-bold">Implemented boundaries</h2>
    <ul className="list-disc pl-6 space-y-2"><li>Private API collections return no candidate, lead or mandate records.</li><li>Submission APIs reject requests while persistence and authentication are unavailable.</li><li>Sample workspaces and fixtures are restricted to development builds.</li><li>Demo records use browser session storage. They are not encrypted or suitable for real personal information.</li><li>Response headers restrict framing, MIME sniffing and browser device permissions.</li></ul>
    <h2 className="text-xl font-bold">Required before launch</h2>
    <p>Server-side authentication and role authorization, durable storage with access controls, secure resume upload and malware scanning, verified email delivery, abuse controls, audit retention and monitoring still need implementation and validation. HTTPS and infrastructure security must be verified in the deployment environment.</p>
    <Link href="/status" className="text-blue-700 underline">View service availability</Link>
  </div>;
}

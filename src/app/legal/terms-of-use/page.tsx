import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Platform Use | ATSAI Talent Solutions",
  description: "Terms governing use of atsai.pro website, APIs, jobs directory, candidate portal, and employer dashboards.",
};

export default function TermsOfUsePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Terms of Use</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Platform Governance
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Terms of Platform Use
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective Date: 16 October 2026 &bull; Domain: https://atsai.pro
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing the web services, APIs, directories, or candidate/employer workspaces at <code>https://atsai.pro</code>, you signify your unreserved acceptance of these Terms of Platform Use.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Acceptable Use &amp; Prohibited Conduct
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Users must not harvest, scrape, or extract candidate contact details or job listings using automated bots or headless crawlers without explicit written authorization.</li>
              <li>Users shall not solicit payments, recruit for multi-level marketing (MLM), or conduct fraudulent outreach impersonating ATSAI or client organizations.</li>
              <li>Attempting to bypass security controls, rate limits, or role-based access restrictions is strictly unlawful.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Intellectual Property
            </h2>
            <p>
              The ATSAI trademark, wordmark, logo, user interface designs, design tokens, and proprietary assessment rubrics are protected under intellectual property laws of India.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              4. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These terms are governed by the laws of India. Any disputes arising out of the use of this platform shall be subject to the exclusive jurisdiction of the competent courts in Pune / Mumbai, Maharashtra.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}

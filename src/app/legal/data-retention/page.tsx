import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Data Retention & Erasure Policy | ATSAI Talent Solutions",
  description: "Retention schedules, purpose limitation, and automated erasure protocols under India DPDP Act 2023.",
};

export default function DataRetentionPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Data Retention Schedule</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Governance &amp; Retention
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Data Retention &amp; Erasure Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Aligned with Digital Personal Data Protection Act 2023 &bull; Version 2.0 (2026)
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Principle of Purpose Limitation
            </h2>
            <p>
              ATSAI Talent Solutions retains personal data only for the precise duration necessary to fulfill the recruitment mandate or purpose for which candidate or employer consent was granted.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Retention Table by Data Category
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Data Category</th>
                    <th className="p-3 border-b border-slate-200">Retention Period</th>
                    <th className="p-3 border-b border-slate-200">Action on Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Active Job Application &amp; Resume</td>
                    <td className="p-3">180 calendar days post mandate close</td>
                    <td className="p-3 text-red-600 font-medium">Automatic Purge / Anonymization</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Talent Pool Consent Record</td>
                    <td className="p-3">12 months with re-consent request</td>
                    <td className="p-3">Notice to Renew or Erasure</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Audit &amp; Disclosure Trail</td>
                    <td className="p-3">3 years</td>
                    <td className="p-3">Encrypted Archive</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Invoices &amp; Tax Documents</td>
                    <td className="p-3">8 financial years (Statutory requirement)</td>
                    <td className="p-3">Statutory Archive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Right to Immediate Erasure (Right to Be Forgotten)
            </h2>
            <p>
              Candidates may instruct ATSAI to immediately erase their resume and contact details by logging into the Candidate Portal &gt; Privacy Center or emailing <code>privacy@atsai.pro</code>. Deletion requests are executed within 48 hours.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

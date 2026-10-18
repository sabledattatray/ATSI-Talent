import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Employer Terms & Commercial Guidelines | ATSAI Talent Solutions",
  description: "Terms governing corporate hiring mandates, fee structures, candidate ownership, and compliance standards.",
};

export default function EmployerTermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Employer Terms</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Commercial Guidelines
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Employer Terms of Engagement
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective Date: 16 October 2026 &bull; Scope: All Participating Corporate Employers
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Vacancy Authenticity &amp; Verification
            </h2>
            <p>
              Employers commissioning ATSAI Talent Solutions agree that all submitted requisitions represent genuine, active corporate hiring requirements with allocated compensation budgets. Posting speculative, fictitious, or exploratory vacancies to harvest resumes is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Candidate Ownership &amp; Protection
            </h2>
            <p>
              Any candidate profile or dossier submitted by ATSAI remains under ATSAI representation for a period of 12 months from the date of initial submission. If an employer hires an ATSAI-introduced candidate in any capacity (full-time, contract, or advisory) within this period, standard recruitment fees apply.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Data Privacy &amp; Confidentiality
            </h2>
            <p>
              Employers must treat candidate resumes as confidential commercial documents under the DPDP Act 2023. Employers shall not circulate, forward, or disclose candidate data to third parties or unrelated entities without prior written consent.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              4. Replacement Window Guarantee
            </h2>
            <p>
              Under standard contingent recruitment agreements, ATSAI offers a 90-calendar-day replacement warranty. If a placed candidate leaves or is separated during the first 90 days, ATSAI will provide an expedited replacement search at no additional fee.
            </p>
          </section>

          <div className="pt-4">
            <Link
              href="/legal/recruitment-services-agreement"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View full B2B Recruitment Services Agreement template &rarr;</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

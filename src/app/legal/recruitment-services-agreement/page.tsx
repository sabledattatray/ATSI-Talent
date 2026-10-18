import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Standard Recruitment Services Agreement (B2B Template) | ATSAI Talent Solutions",
  description: "Standard B2B commercial agreement template covering fee triggers, invoice milestones, replacement windows, and candidate ownership.",
};

export default function RecruitmentAgreementPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/employers" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Employers Overview</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">B2B Standard Terms</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Commercial Contract Template
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Master Recruitment Services Agreement (RSA)
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Standard B2B contingent fee structure for permanent hiring mandates &bull; Version 2.0 (2026)
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Summary of Key Commercial Terms:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Contingent Fee</span>
                <strong className="text-slate-900 text-sm">8.33% of Annual CTC</strong>
                <span className="text-slate-500 text-[11px] block">Payable only on candidate joining</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Payment Terms</span>
                <strong className="text-slate-900 text-sm">Net 15 Days</strong>
                <span className="text-slate-500 text-[11px] block">From official joining date</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Replacement Warranty</span>
                <strong className="text-emerald-700 text-sm">90 Calendar Days</strong>
                <span className="text-slate-500 text-[11px] block">Free replacement search</span>
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Fee Trigger &amp; Milestone Obligations
            </h2>
            <p>
              ATSAI Talent Solutions operates strictly on a contingent performance basis for permanent corporate mandates. No fee is payable for resume submissions, candidate interviews, or preliminary assessments.
            </p>
            <p>
              The recruitment fee is triggered solely upon a shortlisted candidate accepting an employment offer and physically or virtually commencing duties on their designated joining date.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Candidate Ownership Window
            </h2>
            <p>
              When ATSAI presents a candidate profile, that candidate is deemed proprietary to ATSAI for a period of <strong>twelve (12) consecutive months</strong> from the date of profile transmission. If the client company or any affiliate hires the candidate in any operational or consulting role within this timeframe, the full recruitment fee is applicable.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Replacement Commitment &amp; Conditions
            </h2>
            <p>
              Should a placed professional voluntarily resign or have their employment terminated for performance issues within 90 calendar days from their joining date, ATSAI commits to providing one (1) replacement candidate of equivalent caliber at no additional recruitment cost, provided that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>The initial invoice was paid within the contractual Net 15-day window.</li>
              <li>The client provides written notice of separation within 7 calendar days of the event.</li>
              <li>The separation was not caused by role restructuring, company redundancy, or breach of employer offer terms.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              4. Non-Solicitation of Client Employees
            </h2>
            <p>
              During the term of active mandates and for 6 months thereafter, ATSAI covenants not to proactively poach or solicit any employee currently working at the client organization.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

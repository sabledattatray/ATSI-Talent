import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ATSAI Talent Solutions (DPDP Act Aligned)",
  description: "Comprehensive privacy notice outlining personal data processing, purpose-specific consent, retention schedules, and grievance redressal under India DPDP Act 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Privacy Policy</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Personal Data Protection (DPDP) Act 2023 Aligned</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0b1728] tracking-tight">
            Privacy Policy &amp; Data Governance Charter
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Version 2.0 &bull; Effective Date: 16 October 2026 &bull; Data Fiduciary: ATSAI Talent Solutions
          </p>
        </div>

        {/* Legal Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Overview &amp; Data Fiduciary Identity
            </h2>
            <p>
              ATSAI Talent Solutions (&quot;ATSAI&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating the domain <code>https://atsai.pro</code>, acts as a Data Fiduciary under the provisions of the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Information Technology laws of India.
            </p>
            <p>
              This document explains transparently how personal data is collected, processed, protected, and retained when you interact with our recruitment services, jobs directory, candidate portal, or employer platform.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Data Categories Collected
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Candidate Personal Identifiers:</strong> Full legal name, verified email address, mobile number, city and state of residence.</li>
              <li><strong>Professional Credentials:</strong> Resumes (PDF/DOCX), educational qualifications, past employers, designations, declared notice period, current and expected compensation bands.</li>
              <li><strong>Application &amp; Screening Responses:</strong> Answers to role-specific technical screening questionnaires and interview scheduling preferences.</li>
              <li><strong>Employer &amp; Corporate Representative Data:</strong> Corporate entity name, CIN/registration, business email, authorized representative phone, requisition details, and commercial agreements.</li>
              <li><strong>Technical Metadata &amp; Logs:</strong> IP address, browser user-agent, session timestamps, and audit event logs for security and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Purpose of Processing &amp; Explicit Consent
            </h2>
            <p>
              We process personal data solely for specific, legitimate recruitment purposes with your informed consent:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p><strong>&bull; Role-Specific Submission:</strong> We obtain explicit, granular consent before sharing your resume with any specific prospective employer.</p>
              <p><strong>&bull; Interview Scheduling:</strong> Facilitating calendar coordination between verified employers and candidates.</p>
              <p><strong>&bull; Anti-Fraud &amp; Verification:</strong> Safeguarding applicants from job scams, impersonation, and fraudulent fee demands.</p>
            </div>
            <p className="text-xs text-slate-500">
              We never sell, trade, or monetize candidate resumes, contact lists, or personal information to third-party data brokers or marketing aggregators.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              4. Data Retention &amp; Erasure Schedules
            </h2>
            <p>
              Personal data is maintained only as long as necessary for the purpose for which it was obtained:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Active Job Applications:</strong> Retained for 180 calendar days following the conclusion of a recruitment requisition unless active talent pool consent is provided.</li>
              <li><strong>Candidate Erasure Rights:</strong> You may at any point request complete deletion of your resume and profile through our self-service portal or by submitting a DPDP request.</li>
              <li><strong>Commercial Records:</strong> Corporate invoices and tax compliance records are preserved per statutory obligations under Indian tax and corporate laws.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              5. Candidate Data Principal Rights Under DPDP Act 2023
            </h2>
            <p>You have the lawful right to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Right to Access Summary:</strong> Request a complete summary of your personal data processed by ATSAI.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Right to Correction:</strong> Update inaccurate, out-of-date, or incomplete credentials.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Right to Erasure:</strong> Instruct us to irrevocably delete your profile and documents.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Right of Grievance Redressal:</strong> File a formal complaint with our designated Grievance Officer.
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              6. Grievance Redressal Officer Contact
            </h2>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1.5">
              <p><strong>Designated Grievance Redressal Officer:</strong> Compliance &amp; Legal Desk</p>
              <p><strong>Entity:</strong> ATSAI Talent Solutions</p>
              <p><strong>Official Email:</strong> <code>grievance@atsai.pro</code></p>
              <p><strong>Operating Address:</strong> Pune &amp; Mumbai, Maharashtra, India</p>
              <p className="text-slate-500 text-[11px] mt-1">
                Grievances are acknowledged within 24 hours and formally addressed within 7 business days in accordance with the DPDP Rules.
              </p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Candidate Terms & Code of Conduct | ATSAI Talent Solutions",
  description: "Terms governing job applications, resume veracity, candidate rights, and zero-fee guarantees at ATSAI Talent Solutions.",
};

export default function CandidateTermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Candidate Terms</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Applicant Agreement
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Candidate Terms &amp; Code of Conduct
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective Date: 16 October 2026 &bull; Scope: All Applicants &amp; Job Seekers
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-1.5 text-xs text-blue-950">
            <strong className="block font-bold">1. Zero-Fee Commitment:</strong>
            <p>
              ATSAI Talent Solutions will NEVER solicit or accept any fee, charge, registration deposit, or payment of any kind from job applicants. Our services to candidates are 100% free. Any request for payment purporting to come from ATSAI is fraudulent.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Accuracy of Application Information
            </h2>
            <p>
              Candidates agree to submit accurate, truthful, and verified details regarding work history, educational qualifications, employment dates, and notice periods. Misrepresenting credentials or submitting fabricated certificates constitutes grounds for immediate removal from our platform and requisition revocation.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Consent and Profile Disclosure
            </h2>
            <p>
              By applying to a specific job listing, you grant ATSAI explicit, revocable authorization to evaluate your credentials and submit your candidate dossier to the identified employer. You may withdraw consent at any time prior to offer acceptance.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              4. No Guarantee of Placement
            </h2>
            <p>
              While ATSAI actively advocates for qualified candidates, ultimate hiring decisions (including shortlisting, interview invitations, and compensation offers) rest entirely with the prospective corporate employer. ATSAI does not guarantee employment or placement timelines.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              5. Application Withdrawal &amp; Data Deletion
            </h2>
            <p>
              You maintain the absolute right to withdraw your application at any time directly through the Candidate Portal or by contacting <code>privacy@atsai.pro</code>. Upon withdrawal, your profile will be unlinked from the requisition and archived or erased per our data retention schedule.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

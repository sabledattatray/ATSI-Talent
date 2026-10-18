import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Grievance Redressal Mechanism | ATSAI Talent Solutions",
  description: "Official DPDP Act 2023 and IT Rules grievance redressal officer contact, timelines, and complaint escalation procedures.",
};

export default function GrievanceRedressalPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Grievance Redressal</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Statutory Compliance Officer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Grievance Redressal Mechanism
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            In accordance with Digital Personal Data Protection Act 2023 &amp; Information Technology Rules
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Designated Grievance Officer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Officer Designation:</span>
                <strong className="text-slate-900 text-sm">Head of Compliance &amp; Legal Redressal</strong>
                <span className="text-slate-500 block">ATSAI Talent Solutions</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Dedicated Redressal Email:</span>
                <strong className="text-blue-600 text-sm">grievance@atsai.pro</strong>
                <span className="text-slate-500 block">Direct official inbox</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Headquarters Address:</span>
                <span className="text-slate-800 font-medium">Pune &amp; Mumbai Hub, Maharashtra, India</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Operating Schedule:</span>
                <span className="text-slate-800 font-medium">Mon - Fri, 09:30 AM to 06:30 PM IST</span>
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. Statutory Redressal Timelines
            </h2>
            <p>
              Under our service charter and legal standards:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acknowledgment:</strong> Every formal grievance is acknowledged within <strong>24 business hours</strong> with a unique ticket tracking ID.</li>
              <li><strong>Investigation &amp; Resolution:</strong> The matter is investigated and formally resolved within a maximum of <strong>7 business days</strong>.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. How to File a Grievance
            </h2>
            <p>
              Send an email to <code>grievance@atsai.pro</code> with the subject line <em>&quot;Formal Grievance - [Candidate / Employer Name]&quot;</em>, providing your contact number, relevant job reference ID (if applicable), and a clear factual narrative of the concern.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

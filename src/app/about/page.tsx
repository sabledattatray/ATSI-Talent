import {
  ShieldCheck,
  Target,
  Users
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Us | ATSAI Talent Solutions",
  description: "Learn about ATSAI Talent Solutions, our leadership values, ethical recruitment charter, and specialized talent practices.",
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Our Purpose
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1.5 tracking-tight">
            Connecting Talent. Empowering Careers.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl">
            ATSAI Talent Solutions was founded with a single directive: to build a trustworthy recruitment consultancy where technical veracity, transparent salary communication, and candidate dignity supersede automated spam.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Headquarters Hub</span>
              <strong className="text-slate-900 text-sm mt-0.5 block">Pune &amp; Mumbai, India</strong>
              <span className="text-slate-500">Pan-India mandate delivery</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Core Focus</span>
              <strong className="text-slate-900 text-sm mt-0.5 block">Analytics, MIS &amp; BFSI</strong>
              <span className="text-slate-500">Extensible technology taxonomy</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Candidate Charter</span>
              <strong className="text-emerald-700 text-sm mt-0.5 block">100% Free Application</strong>
              <span className="text-slate-500">Explicit DPDP consent model</span>
            </div>
          </div>
        </div>

        {/* Core Principles (PRD Section 01 & 02) */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-[#0b1728] mb-6">
            Our Operating Principles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Truth in Representation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never manufacture fictional job openings, client logos, or false placement metrics. Every listing reflects an active, approved commercial requisition.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Technical Calibration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our practice leads verify whether candidates can actually write DAX measures, optimize SQL queries, or analyze credit portfolios before presenting dossiers to clients.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Candidate Privacy Rights</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We safeguard personal data in compliance with the Digital Personal Data Protection Act 2023. We obtain role-specific consent before sharing your resume with any third party.
              </p>
            </div>
          </div>
        </div>

        {/* Official Governance & Contact Information */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-[#0b1728]">
            Corporate Governance &amp; Official Inquiries
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-medium">Official Trading Name:</span>
              <strong className="text-slate-900 text-sm mt-0.5 block">ATSAI Talent Solutions</strong>
              <span className="text-slate-500 mt-1 block">Provisional brand; domain: atsai.pro</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-medium">Compliance &amp; Grievance Redressal:</span>
              <strong className="text-slate-900 text-sm mt-0.5 block">grievance@atsai.pro</strong>
              <span className="text-slate-500 mt-1 block">Response within 48 business hours</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
            >
              Contact Our Desk
            </Link>
            <Link
              href="/verify-recruiter"
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
            >
              Verify Recruiter Affiliation
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

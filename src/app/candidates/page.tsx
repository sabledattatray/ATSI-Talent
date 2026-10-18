import { staticMetadata } from "@/lib/seo";
import {
  Briefcase,
  FileText,
  Lock,
  Search,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export const metadata = staticMetadata("/candidates");

export default function CandidatesPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="max-w-3xl mb-14">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Job Seeker Charter
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Connecting Talent. Empowering Careers.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            ATSAI Talent Solutions advocates for qualified professionals in Data Analytics, MIS, BFSI, and Software. We protect your privacy, ensure honest job descriptions, and never charge applicant fees.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 items-center"><Link href="/candidate/signup" className="talent-button">Create free account</Link><Link href="/candidate/login" className="talent-button talent-secondary">Candidate sign in</Link>
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Verified Openings</span>
            </Link>
            <Link
              href="/candidates/how-it-works"
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              How Our Representation Works
            </Link>
          </div>
        </div>

        {/* The 4 Candidate Protections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0b1728]">Zero Candidate Fees</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never charge candidates for job applications, interview coordination, skill tests, or document verification. We are exclusively remunerated by corporate employers upon successful hire.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0b1728]">Role-Specific Consent</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your profile is not listed publicly. You choose which roles to apply for and confirm consent before a snapshot is shared with the ATSAI team for that opportunity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0b1728]">Verified Job Authenticity</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review the employer, location, work arrangement, and role requirements before applying. Job details are managed and published by the ATSAI team.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0b1728]">Human Recruiter Briefings</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before client interviews, our sector consultants brief you thoroughly on the hiring team&apos;s technical expectations, project priorities, and evaluation focus areas.
            </p>
          </div>
        </div>

        {/* Verification banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Were you contacted by someone claiming to be from ATSAI?</h2>
            <p className="text-xs text-slate-500 mt-1">Verify their official affiliation through our public recruiter directory.</p>
          </div>
          <Link
            href="/verify-recruiter"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shrink-0"
          >
            Verify Recruiter
          </Link>
        </div>

      </div>
    </div>
  );
}

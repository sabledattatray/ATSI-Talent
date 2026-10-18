import { BrandLogo } from "@/components/common/BrandLogo";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MapPin,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0b1728] text-slate-300 border-t border-slate-800" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Scam Alert Warning Banner */}
      <div className="bg-[#142338] border-b border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-semibold text-slate-100">
              Candidate Security Notice:
            </span>
            <span className="text-slate-300">
              ATSAI Talent Solutions never charges applicants any registration, processing, interview, or placement fee.
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/verify-recruiter"
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Verify Recruiter Affiliation &rarr;
            </Link>
            <Link
              href="/report-job"
              className="text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Report Impersonation
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Column 1: Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" theme="dark" />

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Connecting Talent. Empowering Careers. We operate a verified recruitment agency and talent intelligence platform adhering to rigorous compliance, transparent criteria, and candidate privacy.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Operating Hub: Pune &amp; Mumbai, Maharashtra, India (Configurable nationwide mandates)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Official Inquiries: <Link href="mailto:contact@atsai.pro" className="text-slate-200 hover:underline">contact@atsai.pro</Link></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Grievance Redressal: <Link href="mailto:grievance@atsai.pro" className="text-slate-200 hover:underline">grievance@atsai.pro</Link></span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-lg max-w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pre-launch preview — business and policy review pending</span>
            </div>
          </div>

          {/* Column 2: Candidate Services */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              For Job Seekers
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">Search Verified Jobs</Link>
              </li>
              <li>
                <Link href="/candidates/how-it-works" className="hover:text-white transition-colors">How We Represent You</Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">Resume &amp; Interview Guides</Link>
              </li>
              <li>
                <Link href="/candidate/dashboard" className="hover:text-white transition-colors">Application Tracker</Link>
              </li>
              <li>
                <Link href="/legal/candidate-terms" className="hover:text-white transition-colors">Candidate Rights &amp; Terms</Link>
              </li>
              <li>
                <Link href="/verify-recruiter" className="text-blue-400 hover:underline">Verify an ATSAI Recruiter</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Employer Solutions */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              For Employers
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/employers" className="hover:text-white transition-colors">Hiring Value Proposition</Link>
              </li>
              <li>
                <Link href="/employers/request-talent" className="hover:text-white transition-colors">Submit Hiring Brief</Link>
              </li>
              <li>
                <Link href="/services/permanent-recruitment" className="hover:text-white transition-colors">Permanent Recruitment</Link>
              </li>
              <li>
                <Link href="/services/it-and-data-recruitment" className="hover:text-white transition-colors">IT &amp; Analytics Staffing</Link>
              </li>
              <li>
                <Link href="/services/bfsi-and-finance-recruitment" className="hover:text-white transition-colors">BFSI &amp; Corporate Finance</Link>
              </li>
              <li>
                <Link href="/services/executive-search" className="hover:text-white transition-colors">Executive Search</Link>
              </li>
              <li>
                <Link href="/legal/recruitment-services-agreement" className="hover:text-white transition-colors">B2B Standard Terms</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Compliance & Governance */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Governance &amp; Trust
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy (DPDP Act)</Link>
              </li>
              <li>
                <Link href="/legal/terms-of-use" className="hover:text-white transition-colors">Terms of Platform Use</Link>
              </li>
              <li>
                <Link href="/legal/ai-transparency" className="hover:text-white transition-colors">AI Governance Policy</Link>
              </li>
              <li>
                <Link href="/legal/data-retention" className="hover:text-white transition-colors">Data Retention &amp; Erasure</Link>
              </li>
              <li>
                <Link href="/legal/grievance-redressal" className="hover:text-white transition-colors">Grievance Redressal</Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility Statement (AA)</Link>
              </li>
              <li>
                <Link href="/status" className="text-emerald-400 hover:underline flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  System Operational Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; 2026 ATSAI Talent Solutions (atsai.pro). All rights reserved. Greenfield recruitment consultancy.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/legal/privacy-policy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/legal/terms-of-use" className="hover:text-slate-300">Terms</Link>
            <Link href="/legal/cookie-policy" className="hover:text-slate-300">Cookies</Link>
            <Link href="/accessibility" className="hover:text-slate-300">Accessibility goals</Link>
            <Link href="/security" className="hover:text-slate-300">Responsible Disclosure</Link>
            <Link href="/api/v1/openapi.json" className="text-blue-400 hover:underline">OpenAPI 3.1 Spec</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

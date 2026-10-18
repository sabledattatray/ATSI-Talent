import { ArrowRight, CheckCircle2, Eye, HelpCircle, Keyboard, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility Statement (WCAG 2.2 AA) | ATSAI Talent Solutions",
  description:
    "ATSAI Talent Solutions is committed to digital accessibility conformance adhering to WCAG 2.2 AA standards for all job seekers, employers, and recruiters.",
};

export default function AccessibilityPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Accessibility Statement</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>WCAG 2.2 Conformance Target: Level AA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] tracking-tight">
            Accessibility Commitment &amp; Statement
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            ATSAI Talent Solutions believes career mobility and recruitment services should be universally accessible. We are systematically engineering our public directory, candidate application flows, and administrative systems to comply with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span><strong>Status:</strong> Active Ongoing Conformance</span>
            <span>&bull;</span>
            <span><strong>Last Assessed:</strong> October 2026</span>
            <span>&bull;</span>
            <span><strong>Specification:</strong> W3C WCAG 2.2 Level AA</span>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          {/* Section 1: Measures taken */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
            <h2 className="text-lg font-bold text-[#0b1728] flex items-center gap-2 mb-4">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <span>Accessibility Measures Implemented</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Full Keyboard Operability</span>
                </div>
                <p>
                  Every button, modal, form input, job card, and filter drawer is reachable and executable using standard Tab, Enter, Space, and Arrow keys.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Skip to Content Affordance</span>
                </div>
                <p>
                  A keyboard-activated skip navigation link allows screen reader users and switch devices to bypass global headers directly to job listings.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Contrast Ratios</span>
                </div>
                <p>
                  All body text adheres to a minimum 4.5:1 contrast against background surfaces, and UI components maintain a minimum 3:1 boundary ratio.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Screen Reader Semantic Markup</span>
                </div>
                <p>
                  Form elements include explicit labels, ARIA descriptive announcements for asynchronous filters, and proper heading hierarchies (H1 to H4).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Cognitive & Motion */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
            <h2 className="text-lg font-bold text-[#0b1728] flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Cognitive &amp; Motion Standards</span>
            </h2>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>
                  <strong>No Cognitive-Only Verification:</strong> We do not employ distorted text CAPTCHAs or memory puzzles that disadvantage neurodivergent users.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Prefers-Reduced-Motion Support:</strong> System transitions strictly honor operating system reduced-motion flags, disabling non-essential transitions.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Zoom &amp; Reflow:</strong> Pages scale cleanly up to 400% zoom without horizontal scrolling on 1280px viewports.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: Feedback and Accommodation */}
          <div className="bg-[#142338] text-white rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <span>Request Accommodation or Report an Issue</span>
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
              If you experience any accessibility barrier while browsing opportunities, submitting a resume, or interacting with ATSAI recruitment personnel, please contact our accessibility coordinator immediately.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 items-center">
              <Link
                href="mailto:accessibility@atsai.pro"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email accessibility@atsai.pro</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>General Contact Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              We target initial response and alternative submission assistance within 1 business day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

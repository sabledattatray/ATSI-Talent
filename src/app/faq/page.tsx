"use client";
import Link from "next/link";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: "candidates" | "employers" | "privacy";
}

const FAQS: FAQItem[] = [
  // Candidates
  {
    category: "candidates",
    question: "Does ATSAI ever charge job seekers or candidates an application or placement fee?",
    answer: "No. Never. ATSAI Talent Solutions is strictly an employer-paid recruitment consultancy. We never charge candidates for applying, resume screening, skill assessments, interviews, or final placements. Any request for payment from someone claiming to represent ATSAI is fraudulent and should be immediately reported to report-fraud@atsai.pro or via our /report-job page.",
  },
  {
    category: "candidates",
    question: "How do I know if an email or WhatsApp message from an ATSAI recruiter is genuine?",
    answer: "Official ATSAI recruiters only correspond via @atsai.pro corporate email domains. You can instantly verify any recruiter's active affiliation and identity by visiting our /verify-recruiter portal and searching for their official email address or Recruiter ID.",
  },
  {
    category: "candidates",
    question: "What happens to my resume once I submit an application?",
    answer: "Your resume is stored in an encrypted private data vault. A dedicated sector recruiter reviews your qualifications against the specific requisition. We will never share your personal details, contact information, or resume with any employer without obtaining your prior explicit consent for that specific mandate.",
  },
  {
    category: "candidates",
    question: "How do I track the status of my job application?",
    answer: "Upon submitting an application, you receive a unique Application Reference ID (e.g., APP-2026-XXXX). You can view the real-time stage of your application (Submitted, Under Review, Shortlisted, Interview Scheduled, Offer) through the Candidate Portal or by contacting your assigned recruiter.",
  },

  // Employers
  {
    category: "employers",
    question: "What is ATSAI's commercial engagement model for employers?",
    answer: "We primarily operate on a success-based contingent recruitment model for permanent positions. Employers only incur a fee upon the successful joining of a candidate. Retained executive search and project-based contract staffing arrangements are also available with tailored service-level agreements.",
  },
  {
    category: "employers",
    question: "What candidate replacement guarantee does ATSAI provide?",
    answer: "All permanent placements are backed by our standard 90-day replacement warranty. In the rare event that a placed candidate departs or fails probation within 90 calendar days of joining, we provide a replacement candidate at zero additional recruitment cost.",
  },
  {
    category: "employers",
    question: "How quickly can ATSAI deliver a vetted candidate shortlist?",
    answer: "For standard technical and corporate specialties (MIS, Power BI, SQL Analytics, Financial Analysts, Operations Leads), calibrated shortlists of 3 to 4 thoroughly pre-screened candidates are delivered within 5 business days of mandate sign-off.",
  },
  {
    category: "employers",
    question: "How does ATSAI verify employer identity before publishing a job requisition?",
    answer: "To ensure marketplace integrity and protect candidates from phishing or ghost jobs, every employer must complete business verification—confirming corporate registration, domain ownership, and authorized hiring officer identity—before any job is listed.",
  },

  // Privacy & Compliance
  {
    category: "privacy",
    question: "How does ATSAI comply with the Digital Personal Data Protection (DPDP) Act?",
    answer: "We implement strict purpose limitation, data minimization, granular consent logging, and defined retention schedules. Candidates have full rights to request an export of their personal data, withdraw processing consent, or demand permanent data erasure within our 30-day statutory SLA.",
  },
  {
    category: "privacy",
    question: "How do I submit a data deletion or erasure request?",
    answer: "You can submit an immediate erasure or data export request via our /legal/grievance-redressal page or by emailing our Data Protection Officer at privacy@atsai.pro. Your identity will be verified, any legal holds checked, and your data permanently purged with verifiable audit logging.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | "candidates" | "employers" | "privacy">("all");
  const [openIndices, setOpenIndices] = useState<number[]>([0, 4]); // First item in Candidates and Employers open by default

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFaqs = FAQS.filter(
    (f) => activeCategory === "all" || f.category === activeCategory
  );

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Frequently Asked Questions</span>
        </nav>

        {/* Hero */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
            Support Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Find transparent answers regarding our recruitment processes, candidate protections, employer engagement terms, and data privacy governance.
          </p>

          {/* Category Filter Chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Topics" },
              { id: "candidates", label: "For Job Seekers" },
              { id: "employers", label: "For Hiring Employers" },
              { id: "privacy", label: "Privacy & Compliance" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#142338] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3 mb-12">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 focus:outline-none focus:bg-slate-50/50"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 shrink-0 mt-0.5 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="bg-[#142338] text-white rounded-2xl p-6 sm:p-8 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Have a specific question not covered here?</h2>
            <p className="text-xs text-slate-300">
              Our support and recruitment advisory team responds within 1 business day.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Contact Support Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

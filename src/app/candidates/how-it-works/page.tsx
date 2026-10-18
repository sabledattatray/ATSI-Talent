import {
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "How It Works for Candidates | ATSAI Talent Solutions",
  description: "Step-by-step representation workflow for job seekers, from verified application to offer negotiation and onboarding.",
};

export default function HowItWorksCandidatePage() {
  const steps = [
    {
      num: "01",
      title: "Discover Real, Commissioned Vacancies",
      desc: "Search our directory of verified openings with transparent salary bands and clear technical stack details.",
      action: "Review genuine job criteria before applying.",
    },
    {
      num: "02",
      title: "Submit Application with Explicit Consent",
      desc: "Upload your resume in PDF/DOCX format. You grant consent exclusively for the specific position you select under India DPDP Act guidelines.",
      action: "Your identity remains confidential until you authorize disclosure.",
    },
    {
      num: "03",
      title: "Human Recruiter Screening & Competency Review",
      desc: "Our sector specialists evaluate your background, validating practical experience in SQL, DAX, MIS, or Financial Analysis.",
      action: "Constructive feedback and guidance provided.",
    },
    {
      num: "04",
      title: "Direct Client Presentation & Interview Coordination",
      desc: "With your consent, your calibrated dossier is shared directly with the client's decision-makers. We manage all scheduling, links, and preparatory briefings.",
      action: "No ghosting—we keep you informed at every milestone.",
    },
    {
      num: "05",
      title: "Offer Negotiation, Resignation & Onboarding",
      desc: "We assist with compensation benchmark clarity, resignation formalities with your current employer, and smooth joining formalities.",
      action: "Zero fees ever charged to you.",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/candidates" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Candidate Overview</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">How It Works</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Clear Workflow
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            How ATSAI Represents You
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            We believe recruitment should be transparent, respectful, and ethical. Here is exactly what happens when you apply for a position through ATSAI.
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-6 mb-12">
          {steps.map((s) => (
            <div
              key={s.num}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-6 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 border border-blue-200">
                {s.num}
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-bold text-[#0b1728]">
                  {s.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs text-blue-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{s.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-[#142338] text-white p-8 rounded-3xl border border-slate-700 shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Ready to discover your next career milestone?</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Browse our active openings or track existing submissions through your secure candidate dashboard.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 justify-center">
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
            >
              Browse Verified Jobs
            </Link>
            <Link
              href="/candidate/dashboard"
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700"
            >
              Application Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

import { ArrowLeft, Cpu } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AI Governance & Transparency Policy | ATSAI Talent Solutions",
  description: "Our policy on AI assistance: no automated rejections, no inference of protected traits, mandatory human oversight, and data protection.",
};

export default function AITransparencyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">AI Governance &amp; Transparency</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
            <Cpu className="w-4 h-4" />
            <span>Ethical AI Oversight Charter</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0b1728] tracking-tight">
            AI Transparency &amp; Algorithmic Governance
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective Date: 16 October 2026 &bull; ATSAI Talent Solutions
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-800">
            <strong className="block font-bold text-slate-900">Core Commitments:</strong>
            <p>
              1. <strong>No Automated Rejection:</strong> No candidate application is ever automatically rejected by an artificial intelligence algorithm or machine model without human recruiter review.
            </p>
            <p>
              2. <strong>No Inference of Sensitive Traits:</strong> Our systems never attempt to infer religion, caste, gender identity, political beliefs, or health characteristics.
            </p>
            <p>
              3. <strong>Human-in-the-Loop Oversight:</strong> AI tools are strictly limited to drafting job descriptions, summarizing skills, or assisting recruiters with query search syntax.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. How AI Is Permitted to Assist
            </h2>
            <p>
              ATSAI utilizes machine-assisted processing under strict boundary constraints:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Assisting corporate employers in drafting standardized job descriptions.</li>
              <li>Parsing text from uploaded resumes to autofill experience timelines with candidate verification.</li>
              <li>Semantic keyword indexing to help search consultants find relevant skills (e.g., matching &quot;DAX&quot; with &quot;Power BI&quot;).</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Data Privacy &amp; Model Training
            </h2>
            <p>
              Candidate resumes and confidential application data are <strong>never used to train public machine learning models</strong>. Data transmitted to AI endpoints is isolated under enterprise data privacy agreements with zero data-retention guarantees.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Candidate Opt-Out
            </h2>
            <p>
              Candidates may choose to opt out of automated resume text extraction at any time. In such cases, your profile is reviewed entirely through manual document inspection.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

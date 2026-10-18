import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface ServiceData {
  title: string;
  subtitle: string;
  whoItServes: string;
  methodology: { step: string; desc: string }[];
  rolesCovered: string[];
  deliverables: string[];
  timelines: string;
  terms: string;
  faqs: { q: string; a: string }[];
}

const SERVICE_REGISTRY: Record<string, ServiceData> = {
  "permanent-recruitment": {
    title: "Permanent Contingent Recruitment",
    subtitle: "End-to-end talent acquisition with calibrated shortlists and guaranteed replacement protection.",
    whoItServes: "Mid-market to enterprise companies looking to fill permanent corporate vacancies without upfront retainers.",
    methodology: [
      { step: "Mandate Calibration", desc: "Detailed intake of team culture, reporting lines, technical expectations, and salary bands." },
      { step: "Candidate Screening", desc: "Two-stage evaluation reviewing resume veracity, functional skill checks, and notice period constraints." },
      { step: "Calibrated Presentation", desc: "Delivery of a maximum of 3 to 4 pre-vetted dossiers with interview notes and compensation expectations." },
      { step: "Offer & Onboarding Oversight", desc: "Offer negotiation guidance, resignation assistance, and post-joining check-ins." },
    ],
    rolesCovered: [
      "MIS Reporting Managers",
      "Corporate Operations Analysts",
      "Supply Chain Data Coordinators",
      "Senior FP&A Executives",
      "Regional Team Leads",
    ],
    deliverables: [
      "A role-specific shortlist based on the agreed search brief",
      "Candidate consent documentation and verification logs",
      "Structured compensation and notice period verification report",
      "Replacement provisions where included in the written agreement",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "Is there any upfront cost?", a: "Commercial fees and payment milestones are agreed separately in writing before work begins." },
      { q: "What happens if a candidate resigns within 90 days?", a: "Replacement terms depend on the written agreement for your engagement." },
    ],
  },
  "it-and-data-recruitment": {
    title: "IT & Data Analytics Recruitment",
    subtitle: "Technical talent sourcing across Power BI, SQL, Data Engineering, and Full Stack Architecture.",
    whoItServes: "Analytics teams, SaaS startups, FinTech platforms, and enterprise data offices requiring verified engineering acumen.",
    methodology: [
      { step: "Technical Environment Mapping", desc: "Reviewing your exact database architecture (Postgres, Snowflake, BigQuery) and reporting tooling (Power BI, Tableau)." },
      { step: "Hands-on Code & Logic Screening", desc: "Live assessment of DAX calculations, SQL window functions, query plan analysis, and data model normalizations." },
      { step: "Domain Portfolio Review", desc: "Evaluating candidate dashboard portfolios and GitHub repositories with candidate consent." },
      { step: "SLA-Backed Shortlisting", desc: "Presenting candidates with documented scorecards on technical depth, problem-solving, and communication." },
    ],
    rolesCovered: [
      "Senior Power BI & DAX Specialists",
      "Data Engineers (Python, Airflow, Snowflake)",
      "Database Administrators (SQL Server, PostgreSQL)",
      "Full Stack Developers (Next.js, TypeScript, Node.js)",
      "Data Architects & ETL Pipeline Engineers",
    ],
    deliverables: [
      "Technical evaluation scorecards for every shortlisted candidate",
      "Notice period and counter-offer risk assessment",
      "Verified skills credentials and portfolio links",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "How do your recruiters evaluate technical skills?", a: "Our IT & Analytics recruiters have specialized domain backgrounds and use standardized assessment rubrics covering query optimization, DAX modeling, and architecture design." },
    ],
  },
  "bfsi-and-finance-recruitment": {
    title: "BFSI & Corporate Finance Recruitment",
    subtitle: "Credentialed financial analysts, credit underwriters, and risk governance professionals.",
    whoItServes: "Commercial banks, NBFCs, investment funds, corporate treasuries, and credit rating institutions.",
    methodology: [
      { step: "Regulatory & Domain Calibration", desc: "Aligning on RBI circulars, IBC norms, Basel guidelines, or IFRS 9 ECL frameworks applicable to the position." },
      { step: "Credential & Examination Verification", desc: "Verifying CA, CFA, or accredited MBA certificates directly with credential registries." },
      { step: "Case Study & Financial Modeling Review", desc: "Assessing candidate aptitude in cash flow spreading, financial ratio evaluation, and credit appraisal memos." },
      { step: "Confidential Introduction", desc: "Submitting candidate dossiers with strict candidate consent, preserving confidentiality." },
    ],
    rolesCovered: [
      "Senior Credit Risk Analysts",
      "Corporate Underwriting Managers",
      "Equity & Debt Research Associates",
      "FP&A and Treasury Analysts",
      "Regulatory Compliance & AML Officers",
    ],
    deliverables: [
      "Verified educational and professional credential audit",
      "Financial modeling scenario assessment notes",
      "Regulatory compliance background validation",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "Do you verify CA membership numbers?", a: "Yes. All professional finance qualifications are verified during preliminary screening." },
    ],
  },
  "executive-search": {
    title: "Executive & Leadership Search",
    subtitle: "Confidential retained mandates for Chief Data Officers, VP of Analytics, and Engineering Directors.",
    whoItServes: "Board of directors, Managing Directors, and venture partners identifying transformational leaders.",
    methodology: [
      { step: "Exhaustive Industry Mapping", desc: "Mapping senior talent across competitor organizations, multinational centers, and high-growth technology leaders." },
      { step: "Discreet Leadership Outreach", desc: "Conducting confidential preliminary conversations to gauge strategic alignment, compensation, and mobility." },
      { step: "Comprehensive Leadership Dossier", desc: "Presenting deep background files detailing business impact, leadership scale, and 360 reference evaluations." },
      { step: "Executive Onboarding Support", desc: "Guiding employment agreement structuring, long-term incentive plans, and transition management." },
    ],
    rolesCovered: [
      "Chief Data Officer (CDO)",
      "Head of Business Intelligence & MIS",
      "VP of Risk & Underwriting",
      "Director of Software Engineering",
      "Managing Director - Analytics Practice",
    ],
    deliverables: [
      "Confidential market talent map report",
      "In-depth leadership competency dossiers",
      "Structured reference audit and reputation checks",
      "Extended 180-day executive replacement protection",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "How is executive confidentiality preserved?", a: "Executive mandates are handled under strict non-disclosure agreements with client identity disclosed only at late-stage interviews." },
    ],
  },
  "contract-staffing": {
    title: "Contract & Project Staffing",
    subtitle: "Agile specialist deployment for system implementations, ERP migrations, and reporting sprints.",
    whoItServes: "Enterprises navigating immediate project deadlines, seasonal reporting peaks, or technology migrations.",
    methodology: [
      { step: "Project Scope & Duration Agreement", desc: "Establishing exact statement of work, milestone deliverables, and engagement tenure (3 to 12 months)." },
      { step: "Immediate Sourcing from Active Contractor Pool", desc: "Identifying pre-vetted contractors available for immediate deployment within 10 business days." },
      { step: "Statutory & Timesheet Administration", desc: "Handling contract management, timesheet verification, and invoice reconciliation." },
    ],
    rolesCovered: [
      "Interim Power BI / Tableau Consultants",
      "Data Migration Analysts (ERP to Cloud)",
      "Financial Reconciliation Contractors",
      "Sprint Engineering Support",
    ],
    deliverables: [
      "Rapid deployment within 10 business days",
      "Automated monthly timesheet verification and invoicing",
      "Statutory compliance and non-disclosure governance",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "Is contract-to-hire supported?", a: "Yes. Clients can transition contract specialists to permanent payroll upon mutually agreed transition terms." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(SERVICE_REGISTRY).map((slug) => ({ slug }));
}

function ServiceDetailSkeleton() {
  return (
    <div className="bg-slate-50 min-h-screen py-12 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 mb-8">
          <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
          <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
          <div className="h-4 w-full max-w-lg bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ServiceDetailSkeleton />}>
      <ServiceDetailContent params={params} />
    </Suspense>
  );
}

async function ServiceDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const service = SERVICE_REGISTRY[resolvedParams.slug];

  if (!service) {
    notFound();
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/services" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Services</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{service.title}</span>
        </nav>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Practice Area
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1.5 tracking-tight">
            {service.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            {service.subtitle}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standard 90-Day Replacement Warranty Included</span>
            </div>
            <Link
              href="/employers/request-talent"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Submit Requisition Brief</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          <div className="md:col-span-8 space-y-8">

            {/* Who It Serves */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-2">
                Who This Practice Serves
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {service.whoItServes}
              </p>
            </div>

            {/* Structured Methodology */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-6">
                Execution Methodology
              </h2>
              <div className="space-y-6">
                {service.methodology.map((m, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                      0{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{m.step}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-4">
                Guaranteed Client Deliverables
              </h2>
              <ul className="space-y-3">
                {service.deliverables.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-4">
                Frequently Asked Questions
              </h2>
              {service.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    {faq.q}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 pl-6 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">

            {/* Roles Covered Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                Representative Roles
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {service.rolesCovered.map((role, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                    <span>{role}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timelines and Terms */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Service SLA &amp; Timelines:</span>
                <p className="leading-relaxed">{service.timelines}</p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">Commercial Structure:</span>
                <p className="leading-relaxed">{service.terms}</p>
              </div>
            </div>

            {/* Contact Practice Box */}
            <div className="bg-[#142338] text-white p-6 rounded-2xl border border-slate-700 shadow-xs text-xs space-y-3">
              <h3 className="font-bold text-sm text-white">Engage Practice Lead</h3>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Schedule a confidential consultation to review your current organizational charts and hiring volume.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center rounded-xl"
                >
                  Contact Sector Lead
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

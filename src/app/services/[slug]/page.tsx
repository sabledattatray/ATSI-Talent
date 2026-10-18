import { staticMetadata, PAGE_SEO, absoluteUrl, SITE_URL } from "@/lib/seo";
import { StructuredData } from "@/components/common/StructuredData";
import { breadcrumbs } from "@/lib/structured-data";
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
    title: "Global Enterprise & Contingent Recruitment",
    subtitle: "Worldwide talent acquisition with calibrated shortlists and guaranteed replacement provisions agreed in writing.",
    whoItServes: "High-growth technology enterprises, international scale-ups, and multinational corporations filling key engineering and business roles across Americas, EMEA, and APAC.",
    methodology: [
      { step: "Mandate Calibration", desc: "Comprehensive alignment on organizational architecture, tech stack requirements, reporting lines, and international compensation bands." },
      { step: "Global Candidate Sourcing & Screening", desc: "Multi-channel technical screening, credential verification, English proficiency checks, and cross-border mobility assessment." },
      { step: "Calibrated Dossier Presentation", desc: "Delivery of 3 to 4 vetted candidate dossiers with verified work histories, interview notes, and compensation expectations." },
      { step: "Offer & Onboarding Oversight", desc: "Cross-border offer negotiation, resignation transition support, and post-joining check-ins." },
    ],
    rolesCovered: [
      "Lead Software Architects & Full Stack Engineers",
      "Global Product Managers & UX Leaders",
      "Enterprise AI & Machine Learning Engineers",
      "International Operations & Supply Chain Directors",
      "Senior Financial Planning, Treasury & FP&A Leads",
    ],
    deliverables: [
      "A role-specific shortlist based on the agreed global brief",
      "Candidate consent documentation and verification logs",
      "Structured compensation, location eligibility, and notice period report",
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
    title: "Global IT, Cloud & Software Engineering Recruitment",
    subtitle: "Technical talent sourcing across AI/ML, Cloud Infrastructure, Full Stack Architecture, and Distributed Data Systems.",
    whoItServes: "AI labs, SaaS startups, FinTech platforms, and enterprise data organizations requiring verified engineering depth.",
    methodology: [
      { step: "Technical Environment Mapping", desc: "Reviewing your exact database architecture (Postgres, Snowflake, BigQuery), cloud providers (AWS, Azure, GCP), and frontend/backend tech stacks." },
      { step: "Hands-on Technical Assessment", desc: "Rigorous code screening covering distributed systems architecture, query optimization, API design, and data modeling." },
      { step: "Code & Portfolio Verification", desc: "In-depth review of GitHub repositories, system architecture diagrams, and open-source contributions with candidate consent." },
      { step: "SLA-Backed Shortlisting", desc: "Presenting candidates with documented scorecards on engineering depth, problem solving, system design, and communication." },
    ],
    rolesCovered: [
      "Principal AI / Machine Learning Engineers",
      "Cloud Solutions & DevOps Architects (AWS / Azure / GCP)",
      "Full Stack Developers (TypeScript, React, Next.js, Node.js)",
      "Distributed Data Platform Engineers (Snowflake, Spark, Kafka)",
      "Cybersecurity Specialists & DevSecOps Engineers",
      "Enterprise Business Intelligence & Analytics Leads",
    ],
    deliverables: [
      "Technical evaluation scorecards for every shortlisted candidate",
      "Notice period, counter-offer, and location risk assessment",
      "Verified engineering credentials, portfolio links, and technical scores",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "How do your recruiters evaluate technical skills?", a: "Our technical recruiting leads have engineering backgrounds and use standardized assessment rubrics covering system design, coding depth, and architecture optimization." },
    ],
  },
  "bfsi-and-finance-recruitment": {
    title: "Global BFSI, FinTech & Quantitative Risk Recruitment",
    subtitle: "Credentialed quantitative analysts, credit risk modelers, FinTech engineers, and governance professionals.",
    whoItServes: "Commercial and investment banks, FinTech scale-ups, hedge funds, asset management firms, and corporate treasuries.",
    methodology: [
      { step: "Regulatory & Domain Calibration", desc: "Aligning on international financial frameworks including Basel III/IV, IFRS 9 / CECL, Dodd-Frank, or regional central bank guidelines." },
      { step: "Credential & Qualification Verification", desc: "Verifying CFA, CA, CPA, or accredited quantitative finance degrees directly with credential authorities." },
      { step: "Quantitative Modeling & Case Assessment", desc: "Evaluating candidate aptitude in financial modeling, stochastic calculus, credit scorecards, and regulatory stress testing." },
      { step: "Confidential Introduction", desc: "Submitting candidate dossiers with strict candidate consent, preserving complete candidate and client confidentiality." },
    ],
    rolesCovered: [
      "Quantitative Research & Portfolio Analysts",
      "Senior Credit Risk & Capital Adequacy Modelers",
      "FinTech Infrastructure & Payments Engineers",
      "Global Corporate FP&A and Treasury Managers",
      "Regulatory Compliance & Financial Crime (AML) Directors",
    ],
    deliverables: [
      "Verified educational and professional credential audit",
      "Financial and risk modeling scenario assessment notes",
      "Regulatory compliance and background validation",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "Do you verify professional financial certifications?", a: "Yes. All professional certifications (CFA, CA, CPA, FRM) are verified during preliminary screening." },
    ],
  },
  "executive-search": {
    title: "Global Executive & Leadership Search",
    subtitle: "Confidential retained mandates for Chief Technology Officers, VP of Engineering, Chief AI Officers, and Product Vice Presidents.",
    whoItServes: "Boards of directors, venture capital partners, private equity firms, and CEOs appointing transformational leadership.",
    methodology: [
      { step: "Exhaustive Global Talent Mapping", desc: "Mapping senior leadership talent across global innovation hubs, competitor organizations, and high-growth tech leaders." },
      { step: "Discreet Executive Outreach", desc: "Conducting confidential preliminary discussions to assess strategic alignment, board readiness, compensation, and global mobility." },
      { step: "Comprehensive Leadership Dossier", desc: "Presenting deep background files detailing commercial impact, leadership scale, organizational design, and 360 reference evaluations." },
      { step: "Executive Onboarding Support", desc: "Guiding employment agreement structuring, long-term incentive plans (LTIP/equity), and transition management." },
    ],
    rolesCovered: [
      "Chief Technology Officer (CTO)",
      "Chief AI Officer (CAIO) & Head of AI Research",
      "VP of Global Software Engineering",
      "Chief Product Officer (CPO)",
      "Managing Director & Regional Practice Head",
    ],
    deliverables: [
      "Confidential market talent map report",
      "In-depth leadership competency dossiers",
      "Structured 360-degree reference audit and background verification",
      "Extended 180-day executive replacement protection",
    ],
    timelines: "The search timeline is discussed and agreed for each role and engagement.",
    terms: "Scope, fees, responsibilities, and any replacement provisions are agreed separately in writing.",
    faqs: [
      { q: "How is executive confidentiality preserved?", a: "Executive mandates are handled under strict non-disclosure agreements with client identity disclosed only at late-stage interviews." },
    ],
  },
  "contract-staffing": {
    title: "International Contract & Project Staffing",
    subtitle: "Agile specialist deployment for cloud migrations, AI implementations, ERP transformations, and rapid technical sprints.",
    whoItServes: "Global enterprises navigating tight milestone deadlines, technology migrations, or international project surges.",
    methodology: [
      { step: "Project Scope & Duration Agreement", desc: "Establishing clear statement of work, milestone deliverables, and engagement tenure (3 to 12 months)." },
      { step: "Rapid Global Contractor Sourcing", desc: "Identifying pre-vetted international contractors available for immediate deployment within 10 business days." },
      { step: "Statutory & Cross-Border Compliance", desc: "Managing international contract agreements, verified timesheets, and multi-currency invoicing." },
    ],
    rolesCovered: [
      "Interim Cloud & DevOps Migration Architects",
      "Fractional AI & Large Language Model Specialists",
      "Contract Full Stack & Mobile Engineers",
      "Interim Analytics & Data Modeling Consultants",
    ],
    deliverables: [
      "Rapid deployment within 10 business days across time zones",
      "Automated monthly timesheet verification and invoicing",
      "International statutory compliance and IP non-disclosure governance",
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return PAGE_SEO[`/services/${slug}`] ? staticMetadata(`/services/${slug}`) : { title: "Service not found", robots: { index: false } };
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
  const servicePath = `/services/${resolvedParams.slug}`;

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

        <StructuredData data={breadcrumbs([{ name: "Recruitment services", path: "/services" }, { name: service.title, path: servicePath }])} />
        <StructuredData data={{ "@context": "https://schema.org", "@type": "Service", name: service.title, description: PAGE_SEO[servicePath].description, url: absoluteUrl(servicePath), provider: { "@id": `${SITE_URL}/#organization` }, areaServed: { "@type": "Country", name: "India" } }} />
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
              <span>Scope and replacement provisions agreed in writing</span>
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
                Recruitment deliverables
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

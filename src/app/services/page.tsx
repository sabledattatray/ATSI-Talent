import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Crown,
  Database,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Recruitment Services & Practice Methodologies",
  description: "Specialized recruitment solutions in Permanent Recruitment, IT & Analytics, BFSI & Risk Management, Executive Search, and Contract Staffing.",
};

export default function ServicesIndexPage() {
  const services = [
    {
      slug: "permanent-recruitment",
      title: "Permanent Contingent Recruitment",
      icon: Briefcase,
      summary: "Success-fee based senior and mid-tier talent sourcing for core corporate departments.",
      deliverables: ["Curated 3-candidate shortlist", "Notice period guarantee", "90-day replacement commitment"],
      roles: "MIS Managers, Business Analysts, Team Leads, Regional Operations Heads",
    },
    {
      slug: "it-and-data-recruitment",
      title: "IT & Data Analytics Recruitment",
      icon: Database,
      summary: "Technical evaluation and placement of specialized analytics and engineering personnel.",
      deliverables: ["Live SQL/DAX code screening", "Data architecture assessment", "Portfolio validation"],
      roles: "Power BI Developers, Data Engineers, Snowflake Architects, Full Stack Engineers",
    },
    {
      slug: "bfsi-and-finance-recruitment",
      title: "BFSI & Corporate Finance",
      icon: TrendingUp,
      summary: "Credentialed financial analysts, credit underwriters, and risk governance specialists.",
      deliverables: ["CA / CFA credential verification", "Financial spreading test", "RBI compliance check"],
      roles: "Credit Risk Analysts, Portfolio Managers, Equity Research Associates, Treasury Analysts",
    },
    {
      slug: "executive-search",
      title: "Executive & Leadership Search",
      icon: Crown,
      summary: "Confidential retained search for VP, Director, and C-suite analytical and technology leaders.",
      deliverables: ["Exhaustive market mapping", "Confidential direct approach", "Structured board appraisal"],
      roles: "Chief Data Officers, VP of Analytics, Head of Risk Underwriting, Engineering Directors",
    },
    {
      slug: "contract-staffing",
      title: "Contract & Project Staffing",
      icon: Clock,
      summary: "Agile specialist deployment for system implementations, ERP migrations, and reporting sprints.",
      deliverables: ["Quick deployment within 10 days", "Timesheet governance", "Statutory compliance"],
      roles: "Interim BI Specialists, Migration Analysts, Project Technical Leads",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Agency Solutions
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Comprehensive Recruitment Services
          </h1>
          <p className="text-slate-600 text-base mt-2 leading-relaxed">
            ATSAI Talent Solutions operates dedicated practice desks led by seasoned industry recruiters. Every mandate is delivered with rigorous screening, transparent progress reporting, and binding commercial warranties.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.slug}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h2 className="text-xl font-bold text-[#0b1728]">
                    <Link href={`/services/${svc.slug}`} className="hover:text-blue-600 transition-colors">
                      {svc.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {svc.summary}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Key Deliverables:
                    </span>
                    {svc.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Representative Positions:
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {svc.roles}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/services/${svc.slug}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                  >
                    <span>Read practice methodology</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-[#142338] text-white rounded-3xl p-8 sm:p-12 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Have a customized hiring mandate?</h2>
            <p className="text-xs text-slate-300 mt-1">Our practice directors calibrate talent pipelines to your specific technical environment.</p>
          </div>
          <Link
            href="/employers/request-talent"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0"
          >
            Submit Hiring Brief
          </Link>
        </div>

      </div>
    </div>
  );
}

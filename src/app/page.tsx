"use client";
import { useDemoJobs } from "@/lib/useDemoJobs";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  HelpCircle,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import React, { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const jobs = useDemoJobs();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [workMode, setWorkMode] = useState("All");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (locationTerm) params.set("location", locationTerm);
    if (workMode !== "All") params.set("workMode", workMode);
    router.push(`/jobs?${params.toString()}`);
  };

  const specializations = [
    {
      title: "Data Analytics & BI",
      roles: "Power BI, Tableau, SQL, DAX, Python, Data Modeling",
      description: "Enterprise analytics talent with verified competencies in relational data modeling and executive KPI dashboards.",
      href: "/services/it-and-data-recruitment",
      count: "Active Mandates",
    },
    {
      title: "MIS & Operational Reporting",
      roles: "Advanced Excel, VBA, Power Pivot, ERP Integrations",
      description: "High-precision analysts specialized in daily reconciliation, supply chain scorecards, and corporate MIS.",
      href: "/services/permanent-recruitment",
      count: "High Demand",
    },
    {
      title: "BFSI & Risk Analytics",
      roles: "Credit Appraisal, Financial Modeling, RBI Norms, ECL",
      description: "CA, CFA, and MBA finance specialists for investment banking, commercial underwriting, and risk governance.",
      href: "/services/bfsi-and-finance-recruitment",
      count: "Specialized Desk",
    },
    {
      title: "Software & Cloud Engineering",
      roles: "Next.js, TypeScript, Python, PostgreSQL, AWS/GCP",
      description: "Full-stack and cloud infrastructure talent screened through hands-on technical architecture reviews.",
      href: "/services/it-and-data-recruitment",
      count: "Verified Pool",
    },
  ];

  const faqs = [
    {
      q: "Does ATSAI Talent Solutions charge any fee to candidates?",
      a: "Never. Under our strict ethical recruitment charter and Indian labor norms, we never charge candidates for job applications, resume reviews, assessments, or interview scheduling. Our professional fees are solely paid by verified corporate employers upon successful placement.",
    },
    {
      q: "How does ATSAI verify that job postings are authentic?",
      a: "Every single opportunity listed on ATSAI is backed by a signed corporate commercial agreement or verified client mandate. We never scrape the public web or publish speculative vacancies. Every employer identity is authenticated prior to listing.",
    },
    {
      q: "How is candidate personal data and resume privacy safeguarded?",
      a: "We adhere strictly to the Digital Personal Data Protection (DPDP) Act 2023. Your resume and contact information are disclosed to a prospective employer only after you review the role description and grant explicit, role-specific consent.",
    },
    {
      q: "How can I verify whether a person contacting me is an official ATSAI recruiter?",
      a: "You can use our official verification directory at atsai.pro/verify-recruiter. ATSAI representatives only communicate via verified @atsai.pro email addresses and never ask for bank transfers or processing deposits.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. Hero Section */}
      <section className="relative bg-[#0b1728] text-white pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-slate-800">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Verified Corporate Mandates &bull; Human-Led Recruitment Consultancy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              The Right Talent. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                The Right Opportunity.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl">
              ATSAI Talent Solutions connects premier organizations with vetted specialists in Data Analytics, MIS, BFSI, and Technology. We prioritize candidate privacy, transparent job criteria, and measurable hiring outcomes.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href="/jobs"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0b1728]"
              >
                <Search className="w-4 h-4" />
                <span>Explore Verified Openings</span>
              </Link>
              <Link
                href="/employers"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-base border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Hire Qualified Specialists</span>
              </Link>
            </div>
          </div>

          {/* Integrated Search Box */}
          <div className="mt-12 max-w-5xl">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl shadow-xl p-3 md:p-4 text-slate-900 border border-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

                {/* Keyword / Role input */}
                <div className="md:col-span-5 relative">
                  <label htmlFor="search-keyword" className="sr-only">Role, skill, or department</label>
                  <div className="flex items-center pl-3">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      id="search-keyword"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Role title, skill (e.g. Power BI, SQL, MIS, Credit Risk)..."
                      className="w-full pl-3 pr-2 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location input */}
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 relative">
                  <label htmlFor="search-location" className="sr-only">Location or city</label>
                  <div className="flex items-center pl-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      id="search-location"
                      type="text"
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                      placeholder="City (e.g. Pune, Mumbai, Remote)..."
                      className="w-full pl-3 pr-2 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Work Mode select */}
                <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0">
                  <label htmlFor="search-mode" className="sr-only">Work Mode</label>
                  <select
                    id="search-mode"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="w-full py-2.5 px-3 text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Modes</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {/* Submit button */}
                <div className="md:col-span-2 pt-2 md:pt-0">
                  <button
                    type="submit"
                    className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-blue-600"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick tags */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Popular verified searches:</span>
                <Link href="/jobs?q=Power+BI" className="hover:text-blue-600 underline">Power BI</Link>
                <span>&bull;</span>
                <Link href="/jobs?q=SQL" className="hover:text-blue-600 underline">SQL Specialist</Link>
                <span>&bull;</span>
                <Link href="/jobs?q=MIS" className="hover:text-blue-600 underline">MIS Manager</Link>
                <span>&bull;</span>
                <Link href="/jobs?q=Credit+Risk" className="hover:text-blue-600 underline">Credit Risk Analyst</Link>
                <span>&bull;</span>
                <Link href="/jobs?workMode=Remote" className="hover:text-blue-600 underline">100% Remote Roles</Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Trust Commitments (PRD Factual Directives) */}
      <section className="bg-white py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Zero Candidate Charges</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  We never solicit payment from job seekers. 100% free application and representation service.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-teal-100 text-teal-800 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Signed Client Mandates</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Every job post represents a genuine, active opening verified by our recruitment practice leaders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Consent-Driven Privacy</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Aligned with India DPDP Act 2023. Resumes are only shared after you explicitly approve the employer.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Human Recruiter Advisory</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  No automated black-box rejections. Experienced consultants review every qualified submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specialized Practices */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                Core Domains
              </span>
              <h2 className="text-3xl font-extrabold text-[#0b1728] mt-1.5">
                Specialized Recruitment Practices
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-xl">
                We focus where technical acumen and analytical depth make a decisive difference to business performance.
              </p>
            </div>
            <Link
              href="/services"
              className="mt-4 md:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>View all agency recruitment solutions</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec) => (
              <Link
                key={spec.title}
                href={spec.href}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      {spec.count}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0b1728] group-hover:text-blue-600 transition-colors">
                    {spec.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 mb-3">
                    {spec.roles}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {spec.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600 flex items-center gap-1">
                  <span>Explore practice methodology</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Latest Verified Openings */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Real-Time Verified Vacancies</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#0b1728]">
                Featured Active Requisitions
              </h2>
              <p className="text-slate-600 text-sm mt-1.5">
                Authentic opportunities with verified compensation ranges and documented selection criteria.
              </p>
            </div>
            <Link
              href="/jobs"
              className="mt-4 md:mt-0 px-5 py-2.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-sm font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <span>Explore All Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length === 0 && <p className="p-6 bg-white rounded-xl border border-slate-200">New opportunities coming soon. No approved vacancies are currently available.</p>}
            {jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-mono text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                      {job.referenceId}
                    </span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0b1728] leading-snug">
                    <Link href={`/jobs/${job.slug}`} className="hover:text-blue-600 transition-colors">
                      {job.title}
                    </Link>
                  </h3>

                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {job.isEmployerConfidential ? "Confidential Employer (Client of ATSAI)" : job.employerName}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location.city}, {job.location.state}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.workMode}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {job.experienceMinYears}-{job.experienceMaxYears} yrs
                    </span>
                  </div>

                  {job.isSalaryDisclosed && job.salaryMin && job.salaryMax && (
                    <div className="mt-3 text-xs font-bold text-slate-900">
                      <span>₹{(job.salaryMin / 100000).toFixed(1)}L - ₹{(job.salaryMax / 100000).toFixed(1)}L PA</span>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.summary}
                  </p>

                  {/* Skills badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Role &amp; Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] text-slate-500">
                    No Applicant Fees
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Dual Process Workflow (Candidate vs Employer) */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
              How We Work
            </span>
            <h2 className="text-3xl font-extrabold text-[#0b1728] mt-1.5">
              Transparent, Structured Recruitment
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Whether you are looking to accelerate your professional journey or scale high-performing analytical teams.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* For Candidates */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  01
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0b1728]">For Candidates</h3>
                  <p className="text-xs text-slate-500">A respectful, consultative career engagement model</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Explore Real Vacancies</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Every position has verified client backing with clear expectations, salary transparency, and tech stack details.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Explicit Consent Before Submission</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We never float your resume anonymously. You authorize ATSAI specifically for each employer and role.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dedicated Recruiter Guidance</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Receive comprehensive briefings on the hiring manager&apos;s evaluation rubrics, interview tips, and prompt feedback.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  href="/candidates/how-it-works"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Learn more about candidate rights &amp; representation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* For Employers */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  02
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0b1728]">For Employers</h3>
                  <p className="text-xs text-slate-500">Rigorous candidate calibration with SLA performance</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Detailed Mandate Calibration</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We document your exact architectural environment, cultural dynamics, reporting structures, and compensation bands.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Technical &amp; Behavioral Screening</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Domain recruiters validate hands-on SQL query proficiency, DAX logic, or credit analysis before presenting shortlists.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Guaranteed Replacement &amp; Support</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Transparent commercial agreements with defined replacement terms and proactive post-onboarding follow-ups.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  href="/employers/request-talent"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Submit a customized hiring brief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Employer Lead Ingestion CTA Section */}
      <section className="bg-[#142338] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0b1728] to-[#1d3553] rounded-3xl p-8 md:p-12 border border-slate-700 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Corporate Hiring Partnerships
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                Need to fill critical analytics or technology roles?
              </h2>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                Connect directly with our practice leads. We deliver verified candidate dossiers within 5 business days of mandate agreement.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pre-screened talent dossiers
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Notice period verification
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Performance-linked contracts
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link
                href="/employers/request-talent"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors text-center shadow-md"
              >
                Submit Hiring Brief
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-sm transition-colors text-center"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
              Clear Answers
            </span>
            <h2 className="text-3xl font-extrabold text-[#0b1728] mt-1.5">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Straightforward details on our recruitment governance, policies, and candidate protections.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-base font-bold text-slate-900 flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 pl-7.5 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-500">
              Have specific questions regarding contractual terms or enterprise mandates?{" "}
              <Link href="/contact" className="text-blue-600 font-semibold hover:underline">
                Contact our compliance desk
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

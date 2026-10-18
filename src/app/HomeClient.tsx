"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, Check, Globe2, Layers3, MapPin, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useDemoJobs } from "@/lib/useDemoJobs";
import { INDUSTRIES, compensation } from "@/lib/ats-types";
import type { JobListing } from "@/lib/types";
import "./platform.css";
export default function HomeClient({initialJobs}:{initialJobs:JobListing[]}){
  const router=useRouter(),jobs=useDemoJobs(initialJobs);const [query,setQuery]=useState("");const [location,setLocation]=useState("");
  return <div className="platform-home"><section className="platform-hero"><div className="platform-hero-inner"><div><span className="platform-eyebrow"><i/>ATSAI TALENT SOLUTIONS</span><h1>Great people.<br/>Better teams.<br/><em>Possibilities everywhere.</em></h1><p>Recruitment software & HR technology solutions. Discover opportunities across India, or bring your hiring team together in one connected applicant tracking system.</p><div className="platform-hero-actions"><Link href="/jobs" className="platform-button">Find your next role <ArrowRight size={17}/></Link><Link href="/employer/signup" className="platform-button platform-outline">Start hiring <ArrowUpRight size={17}/></Link></div><div className="platform-hero-notes"><span><Check size={14}/>Free candidate accounts</span><span><Globe2 size={14}/>Pan-India career hubs</span></div></div><div className="platform-product-preview" aria-label="Hiring workspace features"><div className="platform-preview-top"><span><i/>YOUR HIRING WORKSPACE</span><Layers3 size={19}/></div><div className="platform-preview-heading"><h2>From possibility<br/>to your next great hire.</h2><p>A clear path for every application.</p></div><div className="platform-preview-stages">{[{name:"Applications",detail:"People and profiles, together",icon:Users},{name:"Interviews",detail:"Conversations across time zones",icon:CalendarDays},{name:"Decisions",detail:"A recorded next step for everyone",icon:Check}].map((s,i)=><div key={s.name}><span className="platform-preview-icon"><s.icon size={20}/></span><div><strong>{s.name}</strong><small>{s.detail}</small></div><b>0{i+1}</b></div>)}</div><div className="platform-preview-bottom"><ShieldCheck size={16}/><span>Private company workspaces.<br/>Candidate-visible application updates.</span></div></div></div></section>
    <section className="platform-search-section"><div className="platform-search-card"><div><span className="platform-eyebrow">YOUR NEXT CHAPTER</span><h2>Find work that works for you.</h2></div><form onSubmit={e=>{e.preventDefault();const p=new URLSearchParams();if(query)p.set("q",query);if(location)p.set("location",location);router.push(`/jobs?${p}`);}}><label><Search size={18}/><span className="sr-only">Job title, skill or company</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Job title, skill or company"/></label><label><MapPin size={18}/><span className="sr-only">City or country</span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, country or remote"/></label><button className="platform-button">Search jobs <ArrowRight size={17}/></button></form><div className="platform-search-topics"><span>Explore:</span>{["Healthcare","Engineering","Sales","Education","Technology"].map(s=><Link key={s} href={`/jobs?q=${encodeURIComponent(s)}`}>{s}</Link>)}</div></div></section>
    <section className="platform-section"><div className="platform-section-heading"><div><span className="platform-eyebrow">CAREERS WITHOUT LIMITS</span><h2>Every industry. Every next step.</h2><p>Explore published opportunities by field, location and work arrangement.</p></div><Link href="/jobs">Explore all jobs <ArrowUpRight size={17}/></Link></div><div className="platform-industries">{INDUSTRIES.slice(0,12).map((s,i)=><Link key={s} href={`/jobs?department=${encodeURIComponent(s)}`}><span>{String(i+1).padStart(2,"0")}</span><strong>{s}</strong><ArrowUpRight size={17}/></Link>)}</div></section>
    <section className="platform-section platform-jobs-section">
      <div className="platform-section-heading">
        <div>
          <span className="platform-eyebrow"><i /> OPPORTUNITIES · OPEN NOW</span>
          <h2>Where your next chapter could begin.</h2>
          <p>Real published roles. Clear requirements. Transparent compensation.</p>
        </div>
        <Link href="/jobs" className="platform-heading-action">
          <span>View all roles</span>
          <span className="platform-action-badge">{jobs.length} Active</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="platform-job-grid">
        {jobs.slice(0, 6).map((j) => {
          const isHybrid = j.workMode === "Hybrid";
          const isRemote = j.workMode === "Remote";
          const comp = compensation(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod);
          const hasComp = comp !== "Compensation not disclosed";

          return (
            <Link
              className="platform-job group flex flex-col justify-between p-4 sm:p-5 bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200"
              href={`/jobs/${j.slug}`}
              key={j.id}
            >
              <div className="flex items-start gap-3.5">
                {/* Company Logo Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>

                {/* Main Card Content */}
                <div className="flex-1 min-w-0">
                  {/* Top Line: Company + Verified + WorkMode */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[170px] sm:max-w-none">
                        {j.employerName}
                      </span>
                      {j.employerVerified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isRemote
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : isHybrid
                          ? "bg-teal-50 text-teal-700 border-teal-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRemote ? "bg-purple-500" : isHybrid ? "bg-teal-500" : "bg-blue-500"
                        }`}
                      />
                      {j.workMode}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                    {j.title}
                  </h3>

                  {/* Location & Tags Line */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mt-1">
                    <span className="inline-flex items-center gap-1 text-slate-600 shrink-0">
                      <MapPin size={12} className="text-blue-500 shrink-0" />
                      <span className="truncate">
                        {j.location.city}
                        {j.location.country ? ` · ${j.location.country}` : ""}
                      </span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium shrink-0">
                      {j.employmentType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium hidden sm:inline shrink-0">
                      {j.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Salary + View Action (Full Width) */}
              <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-slate-100">
                <div className="flex items-baseline gap-1 text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                    Pay:
                  </span>
                  <span className="whitespace-nowrap">
                    {hasComp ? comp.replace(/\s*\/\s*/g, "\u00A0/\u00A0") : "Competitive pay · Disclosed on interview"}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700 shrink-0 whitespace-nowrap">
                  <span>View role</span>
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          );
        })}

        {jobs.length > 0 && jobs.length < 3 && (
          <div className="platform-job platform-job-invite group flex flex-col justify-between p-4 sm:p-5 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-dashed border-purple-200 hover:border-purple-400 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Sparkles size={20} strokeWidth={1.8} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider truncate">
                    ATSAI Talent Network
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/80 text-purple-700 border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    100% Free
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1 leading-snug">
                  Can’t find your preferred role?
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Globe2 size={12} className="text-purple-500 shrink-0" />
                  <span className="truncate">Pan-India verified employers hiring weekly</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3.5 pt-2.5 border-t border-purple-100">
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                Direct candidate matching
              </span>
              <Link
                href="/candidate/signup"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 ml-auto"
              >
                <span>Join talent pool</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {!jobs.length && (
        <div className="platform-empty">
          <BriefcaseBusiness size={30} />
          <h3>Your next opportunity belongs here.</h3>
          <p>
            New roles appear when companies publish them. Create your candidate profile so you’re ready to apply.
          </p>
          <Link href="/candidate/signup">
            Create a free profile <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
    <section className="platform-software"><div className="platform-software-inner"><div><span className="platform-eyebrow">RECRUITMENT SOFTWARE & HR TECHNOLOGY SOLUTIONS</span><h2>Less scattered work.<br/><em>More connected hiring.</em></h2><p>Give your company a dedicated workspace for jobs, applications, interviews and hiring decisions. Keep the team aligned and candidates informed from application to outcome.</p><Link href="/employer/signup" className="platform-button">Create your hiring workspace <ArrowUpRight size={17}/></Link></div><div className="platform-features">{[{icon:BriefcaseBusiness,title:"Publish with purpose",copy:"Create drafts, publish jobs and close roles. Set locations, currencies and compensation periods for international hiring."},{icon:Users,title:"A pipeline that stays connected",copy:"Review candidate snapshots, record private notes and move applications through defined hiring stages."},{icon:CalendarDays,title:"Make the next step clear",copy:"Schedule interviews across time zones. Give candidates a live timeline of interviews and hiring updates."},{icon:ShieldCheck,title:"Your company. Your workspace.",copy:"Invite your recruiting team with controlled access. Each company’s jobs and applicants stay in its own workspace."}].map(f=><article key={f.title}><f.icon size={23}/><div><h3>{f.title}</h3><p>{f.copy}</p></div></article>)}</div></div></section>
    <section className="platform-section platform-final"><span className="platform-eyebrow">BUILT AROUND PEOPLE</span><h2>A better next step starts here.</h2><p>Looking for opportunity or building a team?<br/>Make ATSAI your place to move forward.</p><div><Link className="platform-button" href="/candidate/signup">I’m looking for work <ArrowRight size={16}/></Link><Link className="platform-button platform-light" href="/employer/signup">I’m hiring <ArrowUpRight size={16}/></Link></div></section>
  </div>;
}

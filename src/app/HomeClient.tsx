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
            <Link className="platform-job" href={`/jobs/${j.slug}`} key={j.id}>
              <div className="platform-job-top">
                <div className="platform-job-icon">
                  <Building2 size={22} strokeWidth={1.8} />
                </div>
                <div className="platform-job-badges">
                  <span
                    className={`platform-workmode-badge ${
                      isRemote ? "is-remote" : isHybrid ? "is-hybrid" : "is-onsite"
                    }`}
                  >
                    <span className="platform-badge-dot" />
                    {j.workMode}
                  </span>
                  {j.employerVerified && (
                    <span className="platform-verified-badge" title="Verified employer">
                      <ShieldCheck size={12} />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="platform-job-content">
                <span className="platform-company-name">{j.employerName}</span>
                <h3 className="platform-job-title">{j.title}</h3>
                <div className="platform-job-location">
                  <MapPin size={14} className="platform-pin-icon" />
                  <span>
                    {j.location.city}
                    {j.location.country ? ` · ${j.location.country}` : ""}
                  </span>
                </div>

                <div className="platform-job-tags">
                  <span className="platform-tag-pill">{j.employmentType}</span>
                  <span className="platform-tag-pill platform-tag-dept">{j.department}</span>
                  {j.skills && j.skills.length > 0 && (
                    <span className="platform-tag-pill platform-tag-skill">{j.skills[0]}</span>
                  )}
                </div>
              </div>

              <div className="platform-job-footer">
                <div className="platform-job-salary">
                  {hasComp ? (
                    <>
                      <span className="platform-salary-label">Offered Pay</span>
                      <span className="platform-salary-amount">
                        {comp.replace(/ \/ (year|month|hr)/i, "")}
                        <small className="platform-salary-period">
                          {" "}/ {j.salaryPeriod ? j.salaryPeriod.toLowerCase() : "year"}
                        </small>
                      </span>
                    </>
                  ) : (
                    <span className="platform-salary-undisclosed">
                      Competitive salary · Disclosed on interview
                    </span>
                  )}
                </div>
                <span className="platform-view-btn">
                  <span>View role</span>
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}

        {jobs.length > 0 && jobs.length < 3 && (
          <div className="platform-job platform-job-invite">
            <div className="platform-job-top">
              <div className="platform-job-icon platform-icon-invite">
                <Sparkles size={22} strokeWidth={1.8} />
              </div>
              <span className="platform-workmode-badge is-invite">
                <span className="platform-badge-dot" />
                Talent Network
              </span>
            </div>

            <div className="platform-job-content">
              <span className="platform-company-name">ATSAI Talent Network</span>
              <h3 className="platform-job-title">Can’t find your preferred role?</h3>
              <div className="platform-job-location">
                <Globe2 size={14} className="platform-pin-icon" />
                <span>Pan-India verified employers hiring weekly</span>
              </div>

              <p className="platform-invite-copy">
                Create a free candidate profile to get matched with unlisted openings before they are publicly posted.
              </p>
            </div>

            <div className="platform-job-footer">
              <div className="platform-job-salary">
                <span className="platform-salary-label">Candidate Service</span>
                <span className="platform-salary-amount">100% Free</span>
              </div>
              <Link href="/candidate/signup" className="platform-invite-action">
                <span>Join talent pool</span>
                <ArrowRight size={14} />
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

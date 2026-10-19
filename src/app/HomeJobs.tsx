import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, Globe2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { compensation } from "@/lib/ats-types";
import type { JobListing } from "@/lib/types";

export function HomeJobs({ initialJobs }: { initialJobs: JobListing[] }) {
  const jobs = initialJobs;
  return (<section className="platform-section platform-jobs-section">
      <div className="platform-section-heading">
        <div>
          <span className="platform-eyebrow"><i /> OPPORTUNITIES · OPEN NOW</span>
          <h2>Where your next chapter could begin.</h2>
          <p>Explore published roles, requirements and compensation where disclosed.</p>
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
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {j.title}
                  </h3>

                  {/* Location & Tags Line */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mt-1">
                    <span className="inline-flex items-center gap-1 text-slate-600 min-w-0">
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
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-slate-100">
                <div className="flex items-baseline gap-1 text-xs sm:text-[13px] font-bold text-slate-800 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                    Pay:
                  </span>
                  <span className="break-words">
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

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 leading-snug">
                  Can’t find your preferred role?
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Globe2 size={12} className="text-purple-500 shrink-0" />
                  <span className="truncate">Keep your profile ready for future opportunities</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3.5 pt-2.5 border-t border-purple-100">
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                Your next step starts with a profile
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
    </section>);
}

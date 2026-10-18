"use client";
import { compensation, compareCompensation } from "@/lib/ats-types";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { isJobOpen } from "@/lib/jobs";
import { useDemoJobs } from "@/lib/useDemoJobs";
import Link from "next/link";

import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X
} from "lucide-react";
import React, { Suspense, useMemo, useState, useEffect } from "react";

function JobsDirectoryContent({ initialJobs }: { initialJobs: import("@/lib/types").JobListing[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const jobs = useDemoJobs(initialJobs);
  const [now] = useState(() => Date.now());
  const searchTerm = params.get("q") || "";
  const selectedLocation = params.get("location") || "All";
  const selectedWorkMode = params.get("workMode") || "All";
  const selectedDepartment = params.get("department") || "All";
  const selectedRegion = params.get("region") || "All";
  const minExp = Math.max(0, Number(params.get("expMin")) || 0);
  const sortBy = params.get("sort") === "salary" ? "salary" : "latest";
  function updateFilter(key: string, value: string, defaultValue = "All") {
    const url = new URL(window.location.href);
    if (!value || value === defaultValue) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  const setSearchTerm = (value: string) => updateFilter("q", value, "");
  const setSelectedLocation = (value: string) => updateFilter("location", value);
  const setSelectedWorkMode = (value: string) => updateFilter("workMode", value);
  const setSelectedDepartment = (value: string) => updateFilter("department", value);
  const setSelectedRegion = (value: string) => updateFilter("region", value);
  const setMinExp = (value: number) => updateFilter("expMin", String(value), "0");
  const setSortBy = (value: string) => updateFilter("sort", value, "latest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);






  useEffect(() => { let active = true; fetch("/api/recruitment/dashboard", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (active && data) setSavedJobIds(data.savedJobs.map((job: { id: string }) => job.id)); }).catch(() => {}); return () => { active = false; }; }, []);
  const [saveError, setSaveError] = useState("");
  const handleToggleSave = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setSaveError("");
    try {
      const response = await fetch("/api/recruitment/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
      if (response.status === 401) { router.push("/candidate/login"); return; }
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setSavedJobIds(ids => result.saved ? [...ids.filter(id => id !== jobId), jobId] : ids.filter(id => id !== jobId));
    } catch (error) { setSaveError((error as Error).message); }
  };

  const handleResetFilters = () => window.history.replaceState(null, "", "/jobs");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Status filter: only published
      if (!isJobOpen(job, now)) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(term);
        const matchesDept = job.department.toLowerCase().includes(term);
        const matchesSummary = job.summary.toLowerCase().includes(term);
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes(term));
        const matchesCompany = !job.isEmployerConfidential && job.employerName.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDept && !matchesSummary && !matchesSkills && !matchesCompany) {
          return false;
        }
      }

      // Location
      if (selectedLocation !== "All") {
        if (!`${job.location.city} ${job.location.state} ${job.location.country}`.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Work Mode
      if (selectedWorkMode !== "All") {
        if (job.workMode.toLowerCase() !== selectedWorkMode.toLowerCase()) {
          return false;
        }
      }

      // Department
      if (selectedDepartment !== "All") {
        if (job.department !== selectedDepartment) {
          return false;
        }
      }

      // Min Experience
      if (minExp > 0) {
        if (job.experienceMaxYears < minExp) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "salary") {
        return compareCompensation(a, b);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [jobs, searchTerm, selectedLocation, selectedWorkMode, selectedDepartment, minExp, sortBy, now]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.department)));
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.location.city)));
  }, [jobs]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (selectedRegion !== "All" ? 1 : 0) +
    (selectedLocation !== "All" ? 1 : 0) +
    (selectedWorkMode !== "All" ? 1 : 0) +
    (selectedDepartment !== "All" ? 1 : 0) +
    (minExp > 0 ? 1 : 0);

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-12">
      {saveError && <div className="talent-alert" role="alert">{saveError}</div>}<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Editorial Heading */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                ATSAI TALENT SOLUTIONS | RECRUITMENT SOFTWARE &amp; HR TECHNOLOGY SOLUTIONS
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
                Explore Job Openings Across India
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Explore verified career opportunities across Bengaluru, Pune, Mumbai, Hyderabad, Delhi NCR, and Remote India. Review requirements, compensation, and track applications smoothly with ATSAI.
              </p>
            </div>

            {/* Trust badge */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Published recruitment opportunities</span>
            </div>
          </div>

          {/* Search Row */}
          <div className="mt-6 bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 flex items-center pl-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input aria-label="Search term"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by job title, skill, company or keyword…"
                className="w-full pl-3 pr-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {selectedRegion !== "All" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Region: {selectedRegion}
                  <button onClick={() => setSelectedRegion("All")}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">Sort:</span>
                <select aria-label="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "latest" | "salary")}
                  className="flex-1 md:flex-none py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="latest">Latest Published</option>
                  <option value="salary">Compensation (by currency & period)</option>
                </select>
              </div>
            </div>
          </div>

          {/* India Metro Hub Quick-Filter Tabs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Metro Hubs:</span>
            {[
              { id: "All", label: "🇮🇳 All India", count: jobs.filter(j => isJobOpen(j, now)).length },
              { id: "Bengaluru", label: "Bengaluru (Tech)", count: jobs.filter(j => isJobOpen(j, now) && j.location.city.toLowerCase().includes("bengaluru")).length },
              { id: "Maharashtra", label: "Pune & Mumbai", count: jobs.filter(j => isJobOpen(j, now) && (j.location.city.toLowerCase().includes("pune") || j.location.city.toLowerCase().includes("mumbai"))).length },
              { id: "Hyderabad", label: "Hyderabad", count: jobs.filter(j => isJobOpen(j, now) && j.location.city.toLowerCase().includes("hyderabad")).length },
              { id: "DelhiNCR", label: "Delhi NCR (Gurugram/Noida)", count: jobs.filter(j => isJobOpen(j, now) && (j.location.city.toLowerCase().includes("gurugram") || j.location.city.toLowerCase().includes("noida") || j.location.city.toLowerCase().includes("delhi"))).length },
              { id: "Remote", label: "🌐 Remote (India)", count: jobs.filter(j => isJobOpen(j, now) && j.workMode.toLowerCase() === "remote").length },
            ].map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => setSelectedRegion(hub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                  selectedRegion === hub.id
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-slate-50 font-medium"
                }`}
              >
                {hub.label} <span className="opacity-75">({hub.count})</span>
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Query: &quot;{searchTerm}&quot;
                  <button onClick={() => setSearchTerm("")}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              {selectedLocation !== "All" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Location: {selectedLocation}
                  <button onClick={() => setSelectedLocation("All")}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              {selectedWorkMode !== "All" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Mode: {selectedWorkMode}
                  <button onClick={() => setSelectedWorkMode("All")}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              {selectedDepartment !== "All" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Domain: {selectedDepartment}
                  <button onClick={() => setSelectedDepartment("All")}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              {minExp > 0 && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Exp: {minExp}+ yrs
                  <button onClick={() => setMinExp(0)}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 underline ml-2"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Layout Grid: Sidebar Filters + Job Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Desktop Filter Sidebar (PRD Requirement) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Filter Criteria</h2>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="mt-5 space-y-6 text-sm">
              {/* Work Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Work Arrangement
                </label>
                <div className="space-y-1.5">
                  {["All", "Hybrid", "Remote", "On-site"].map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                      <input
                        type="radio"
                        name="workMode"
                        checked={selectedWorkMode === mode}
                        onChange={() => setSelectedWorkMode(mode)}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-medium">{mode === "All" ? "All Arrangements" : mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="pt-4 border-t border-slate-100">
                <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Location (City)
                </label>
                <select id="field-1"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="All">All Locations</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="pt-4 border-t border-slate-100">
                <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Specialization Practice
                </label>
                <select id="field-2"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="All">All Practices</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Experience */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Min Experience
                  </label>
                  <span className="text-xs font-bold text-blue-600">{minExp > 0 ? `${minExp} years` : "Any"}</span>
                </div>
                <input aria-label="Min exp"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={minExp}
                  onChange={(e) => setMinExp(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 yrs</span>
                  <span>5 yrs</span>
                  <span>10+ yrs</span>
                </div>
              </div>

              {/* Candidate Protection Note */}
              <div className="pt-4 border-t border-slate-100 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs text-slate-600">
                <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Candidate Guarantee
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  ATSAI will never charge you. If an employer or agent asks for fees, report it immediately.
                </p>
              </div>
            </div>
          </aside>

          {/* Results Column */}
          <section aria-label="Job results" className="lg:col-span-9 space-y-4">

            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pb-1">
              <span>
                Showing <strong className="text-slate-900">{filteredJobs.length}</strong> published position{filteredJobs.length === 1 ? "" : "s"}
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Published job opportunities
              </span>
            </div>

            {/* Empty State if No Matches */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No matching vacancies found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  We only display real, actively commissioned requisitions and never manufacture fake listings. Try broadening your keywords or clearing current filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              /* Job Cards List */
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id);
                  return (
                    <article
                      key={job.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Meta Line */}
                        <div className="flex items-center justify-between gap-2 text-xs mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {job.referenceId}
                            </span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Published by ATSAI
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400">
                              Posted {new Date(job.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => void handleToggleSave(job.id, e)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isSaved
                                  ? "bg-blue-50 border-blue-200 text-blue-600"
                                  : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              }`}
                              title={isSaved ? "Saved to profile" : "Save this job"}
                              aria-label="Save job"
                            >
                              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Title and Company */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold text-[#0b1728] group-hover:text-blue-600 transition-colors">
                              <Link href={`/jobs/${job.slug}`}>
                                {job.title}
                              </Link>
                            </h2>
                            <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.isEmployerConfidential ? "Confidential Employer (ATSAI Retained Client)" : job.employerName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Key Attributes */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location.city && job.location.country && !job.location.city.toLowerCase().includes(job.location.country.toLowerCase()) ? `${job.location.city} · ${job.location.country}` : (job.location.city || job.location.country || "Global")}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {job.workMode}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {job.experienceMinYears}-{job.experienceMaxYears} years
                          </span>
                          {job.isSalaryDisclosed && job.salaryMax && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-bold">
                              {compensation(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                            </span>
                          )}
                        </div>

                        {/* Summary */}
                        <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {job.summary}
                        </p>

                        {/* Skills */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Assigned Desk: <strong className="text-slate-700">{job.department}</strong>
                        </span>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <span>View Full Spec &amp; Apply</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {mobileFiltersOpen && (
        <Modal label="Job search filters" onClose={() => setMobileFiltersOpen(false)}>
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Filter Requisitions</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label htmlFor="field-3" className="font-bold text-slate-800 block mb-2">Work Arrangement</label>
                <select id="field-3"
                  value={selectedWorkMode}
                  onChange={(e) => setSelectedWorkMode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="All">All Arrangements</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label htmlFor="field-4" className="font-bold text-slate-800 block mb-2">Location</label>
                <select id="field-4"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="All">All Locations</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="field-5" className="font-bold text-slate-800 block mb-2">Specialization</label>
                <select id="field-5"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="All">All Practices</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-3 text-xs font-semibold text-white bg-blue-600 rounded-xl"
              >
                Apply Filters ({filteredJobs.length})
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default function JobsClient({ initialJobs }: { initialJobs: import("@/lib/types").JobListing[] }) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading jobs directory...</div>}>
      <JobsDirectoryContent initialJobs={initialJobs} />
    </Suspense>
  );
}

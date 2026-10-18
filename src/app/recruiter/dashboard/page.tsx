"use client";
import { runDemoAction } from "@/lib/demoAction";
import { BrowserReady } from "@/components/common/BrowserReady";

import { DataService } from "@/lib/dataService";
import { HiringMandate, JobApplication } from "@/lib/types";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import { useState } from "react";

function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "mandates" | "placements" | "disclosures">("pipeline");
  const [applications, setApplications] = useState<JobApplication[]>(() => DataService.getApplications());
  const [mandates] = useState<HiringMandate[]>(() => DataService.getMandates());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");



  const handleAdvanceStage = (appId: string, currentStatus: string) => {
    let nextStatus: JobApplication["status"] = "Shortlisted";
    if (currentStatus === "Submitted" || currentStatus === "Under Review") {
      nextStatus = "Shortlisted";
    } else if (currentStatus === "Shortlisted") {
      nextStatus = "Interview";
    } else if (currentStatus === "Interview") {
      nextStatus = "Offer";
    } else if (currentStatus === "Offer") {
      nextStatus = "Hired";
    }

    const updated = DataService.updateApplicationStatus(
      appId,
      nextStatus,
      `Milestone advanced to ${nextStatus}`,
      "Recruiter"
    );
    if (updated) {
      setApplications(DataService.getApplications());
      setStatusMessage(`Candidate application milestone advanced to "${nextStatus}". Audit trail updated.`);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const filteredApps = applications.filter((a) =>
    a.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.referenceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Recruiter Workspace Header */}
        <div className="bg-[#142338] text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              AS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Ananya Sen &bull; Recruiter ATS
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  ID: REC-ATS-101
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Desk: Data Analytics, Power BI &amp; Business Intelligence &bull; Location: Pune / Remote
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DPDP Consent Enforcement Active</span>
            </span>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Active Requisitions</span>
            <p className="text-2xl font-extrabold text-slate-900">{mandates.length || 3}</p>
            <span className="text-[11px] text-blue-600 font-medium">2 Urgent Priorities</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Pipeline Candidates</span>
            <p className="text-2xl font-extrabold text-slate-900">{applications.length}</p>
            <span className="text-[11px] text-slate-500">100% verified identities</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Interviews Coordinated</span>
            <p className="text-2xl font-extrabold text-slate-900">4</p>
            <span className="text-[11px] text-purple-600 font-medium">Technical evaluations</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Monthly Placements</span>
            <p className="text-2xl font-extrabold text-slate-900">2</p>
            <span className="text-[11px] text-emerald-600 font-medium">₹5.4L Placement Fee Triggered</span>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="flex border-b border-slate-200 mb-8 gap-8 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "pipeline"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Talent Pipeline ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mandates")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "mandates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Assigned Requisitions ({mandates.length || 3})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("disclosures")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "disclosures"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Consent &amp; Disclosure Log (Audit-Ready)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("placements")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "placements"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Placements &amp; Invoicing Triggers</span>
          </button>
        </div>

        {/* Tab 1: Pipeline */}
        {activeTab === "pipeline" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input aria-label="Search term"
                  type="text"
                  placeholder="Search by candidate name, role, or ref ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                />
              </div>
              <span className="text-xs text-slate-500">
                Showing <strong>{filteredApps.length}</strong> applicants
              </span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No candidate applications found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  New applications submitted by candidates will appear here for screening and employer submission.
                </p>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-blue-600">
                        {app.referenceId}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500">
                        Target Role: <strong>{app.jobTitle}</strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-400">
                        Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#0b1728]">{app.candidateName}</h2>
                      <span className="text-xs text-slate-500">&bull; {app.candidateEmail} &bull; {app.candidatePhone}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span>Experience: <strong>{app.experienceYears} Years</strong></span>
                      <span>Notice Period: <strong>{app.noticePeriodDays} Days</strong></span>
                      <span>Dossier: <strong className="text-blue-600">{app.resumeFileName}</strong></span>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Role Consent Recorded</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                    <div className="text-right sm:text-center">
                      <span className="text-[10px] text-slate-400 block mb-1">Pipeline Stage</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === "Interview"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : app.status === "Shortlisted"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : app.status === "Hired"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {app.status !== "Hired" && app.status !== "Withdrawn" && (
                      <button
                        type="button"
                        onClick={() => runDemoAction(() => handleAdvanceStage(app.id, app.status))}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <span>Advance Stage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Requisitions */}
        {activeTab === "mandates" && (
          <div className="space-y-4">
            {mandates.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{m.mandateId}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs font-semibold text-slate-600">{m.employerName}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {m.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#0b1728]">{m.roleTitle}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="font-semibold">{m.location} ({m.workMode})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Salary Budget</span>
                    <span className="font-semibold">₹{m.budgetMaxLPA} LPA</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Headcount</span>
                    <span className="font-semibold">{m.openingsCount} Specialist</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">SLA Countdown</span>
                    <span className="font-semibold text-blue-600">3 Days Remaining</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Disclosures Audit */}
        {activeTab === "disclosures" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0b1728]">Candidate Disclosure Events Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every candidate dossier presented to an employer must be preceded by documented candidate consent pursuant to DPDP Act 2023.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-900">Rahul D. &rarr; Apex FinTech Solutions</strong>
                  <p className="text-slate-500">Requisition: ATS-2026-BI01 &bull; Recruiter: Ananya Sen (REC-ATS-101)</p>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="font-mono text-[11px]">16 Oct 2026 10:15 IST</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Audit-Verified</span>
                </div>
              </div>

              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-900">Sneha K. &rarr; Apex FinTech Solutions</strong>
                  <p className="text-slate-500">Requisition: ATS-2026-BI01 &bull; Recruiter: Ananya Sen (REC-ATS-101)</p>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="font-mono text-[11px]">15 Oct 2026 16:40 IST</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Audit-Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Placements */}
        {activeTab === "placements" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0b1728]">Placement Outcomes &amp; Invoicing Triggers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Placements trigger contingent client invoicing and initiate the 90-day replacement warranty.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">Placement Ref: PLC-2026-081</span>
                  <p className="text-slate-600 mt-0.5">Kunal Mehta placed at Horizon Banking Tech as Lead Data Analyst</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Joined 01 Oct 2026
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200/60 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Annual CTC</span>
                  <strong className="text-slate-900">₹22,00,000</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Recruitment Fee (8.33%)</span>
                  <strong className="text-blue-600">₹1,83,260 + GST</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Invoice Status</span>
                  <strong className="text-emerald-700">Paid (Net 30)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Warranty Window</span>
                  <strong className="text-slate-700">Day 16 of 90 (Active)</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Page() { return <BrowserReady><RecruiterDashboardPage /></BrowserReady>; }

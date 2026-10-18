"use client";
import { runDemoAction } from "@/lib/demoAction";
import { BrowserReady } from "@/components/common/BrowserReady";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { JobApplication, JobListing } from "@/lib/types";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle2,
  Download,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useState } from "react";

function CandidateDashboardPage() {
  const [activeTab, setActiveTab] = useState<"applications" | "saved" | "interviews" | "privacy">("applications");
  const [applications, setApplications] = useState<JobApplication[]>(() => DataService.getApplications());
  const [savedJobs, setSavedJobs] = useState<JobListing[]>(() => DataService.getJobs().filter(job => DataService.getSavedJobIds().includes(job.id)));
  const [privacyMessage, setPrivacyMessage] = useState("");



  const handleWithdraw = (appId: string) => {
    if (confirm("Are you sure you want to withdraw this application? This action will notify the sector recruiter.")) {
      const updated = DataService.withdrawApplication(appId, "Voluntary withdrawal via Candidate Portal");
      if (updated) {
        setApplications(DataService.getApplications());
      }
    }
  };

  const handleRemoveSaved = (jobId: string) => {
    DataService.toggleSaveJob(jobId);
    setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleExportData = () => {
    const candidateData = {
      profile: {
        name: "Rahul Deshmukh",
        email: "rahul.deshmukh@sample.in",
        phone: "+91 98201 12345",
        location: "Pune, Maharashtra",
        primarySpecialization: "Data Analytics & Power BI",
      },
      applications: applications,
      savedJobs: savedJobs.map((j) => j.referenceId),
      exportGeneratedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(candidateData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atsai-candidate-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setPrivacyMessage("Data package downloaded successfully pursuant to DPDP Right to Access.");
  };

  const handleRequestDeletion = () => {
    if (confirm("Initiate formal DPDP erasure request? All associated resumes and application records will be queued for permanent anonymization within the 30-day statutory window.")) {
      DataService.submitPrivacyRequest({
        requesterName: "Rahul Deshmukh",
        requesterEmail: "rahul.deshmukh@sample.in",
        type: "Data Deletion / Erasure",
      });
      setPrivacyMessage("Demo erasure request saved in this tab. No email was sent and no operational deletion was scheduled.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Candidate Profile Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#142338] text-white flex items-center justify-center font-bold text-xl border border-slate-700 shadow-2xs">
              RD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1728]">
                  Rahul Deshmukh
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Candidate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                rahul.deshmukh@sample.in &bull; Pune, India &bull; Notice Period: 30 Days
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/jobs"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Openings</span>
            </Link>
            <Link
              href="/verify-recruiter"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200/70 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Verify My Recruiter</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-8 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`pb-4 transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === "applications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Active Applications ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`pb-4 transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === "saved"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Opportunities ({savedJobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("interviews")}
            className={`pb-4 transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === "interviews"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Interview Schedule (1)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`pb-4 transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === "privacy"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy &amp; DPDP Consent Center</span>
          </button>
        </div>

        {/* Tab 1: Applications */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No applications submitted yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When you apply for a verified requisition on ATSAI, your tracking milestones and assigned recruiter notes will appear here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700"
                  >
                    <span>Explore Verified Jobs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {app.referenceId}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs font-semibold text-slate-500">
                        Requisition ID: {app.jobId}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-400">
                        Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#0b1728]">
                      {app.jobTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>Employer: <strong>{app.employerName}</strong></span>
                      <span>Assigned Recruiter: <strong>Ananya Sen (REC-ATS-101)</strong></span>
                      <span>Dossier: <strong className="text-blue-600">{app.resumeFileName}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                    <div className="text-right sm:text-center">
                      <span className="text-[10px] text-slate-400 block mb-1">Current Milestone</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === "Interview"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : app.status === "Shortlisted"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : app.status === "Withdrawn"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/jobs"
                        className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                      >
                        Browse Requisitions
                      </Link>
                      {app.status !== "Withdrawn" && app.status !== "Hired" && (
                        <button
                          type="button"
                          onClick={() => runDemoAction(() => handleWithdraw(app.id))}
                          className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Saved Jobs */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No saved jobs</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Bookmark verified requisitions from the job directory to review them later or compare requirements.
                </p>
                <div className="mt-6">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700"
                  >
                    <span>Browse Directory</span>
                  </Link>
                </div>
              </div>
            ) : (
              savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {job.referenceId} &bull; {job.location.city}, {job.location.state}
                    </span>
                    <h2 className="text-base font-bold text-[#0b1728]">
                      {job.title}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {job.isEmployerConfidential ? "Confidential Employer" : job.employerName} &bull; {job.workMode} &bull; {job.experienceMinYears}-{job.experienceMaxYears} yrs exp
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => runDemoAction(() => handleRemoveSaved(job.id))}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Interviews */}
        {activeTab === "interviews" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0b1728]">Upcoming Technical Evaluation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Time-zone adjusted to India Standard Time (IST)</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Round 1: Video Call
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Requisition &amp; Role</span>
                <p className="font-bold text-slate-900">Senior Power BI &amp; SQL Analytics Specialist</p>
                <span className="text-[11px] text-slate-500">Apex FinTech Solutions</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Scheduled Timing</span>
                <p className="font-bold text-slate-900">Monday, 20 Oct 2026 &bull; 04:30 PM IST</p>
                <span className="text-[11px] text-emerald-600 font-semibold">Calendar invite dispatched</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Interview Coordinator</span>
                <p className="font-bold text-slate-900">Ananya Sen (ATSAI)</p>
                <span className="text-[11px] text-slate-500">ananya.sen@atsai.pro</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-3 text-xs text-slate-700">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <span className="font-bold text-blue-900 block">Accessibility Accommodation</span>
                <p className="text-slate-600">
                  If you require live closed-captions, extra time for coding assessments, or alternate interview formats, please notify your coordinator at least 24 hours in advance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & DPDP */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            {privacyMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{privacyMessage}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0b1728] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Digital Personal Data Protection (DPDP) Self-Service</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pursuant to India&apos;s DPDP Act, ATSAI guarantees full visibility and control over your personal career information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Export Data */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download Personal Data Package</span>
                  </div>
                  <p className="text-slate-600">
                    Export a machine-readable JSON archive containing your verified profile, application timeline, resume metadata, and recorded consent disclosures.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition-colors"
                  >
                    Export Data Package (JSON)
                  </button>
                </div>

                {/* Erasure Request */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Right to Erasure &amp; Profile Deletion</span>
                  </div>
                  <p className="text-slate-600">
                    Permanently purge your resume dossier, contact details, and application logs from all ATSAI active stores and recruiter matching indexes.
                  </p>
                  <button
                    type="button"
                    onClick={() => runDemoAction(handleRequestDeletion)}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 transition-colors"
                  >
                    Initiate DPDP Erasure Request
                  </button>
                </div>
              </div>

              {/* Consent Ledger */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Active Processing Consents Logged
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Role-Specific Presentation to Apex FinTech Solutions</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Consented: 16 Oct 2026</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Encrypted Resume Storage &amp; Compliance Retention</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Consented: 16 Oct 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Page() { return <BrowserReady><CandidateDashboardPage /></BrowserReady>; }

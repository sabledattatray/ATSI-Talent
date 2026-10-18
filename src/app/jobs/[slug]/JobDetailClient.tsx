"use client";
import { runDemoAction } from "@/lib/demoAction";
import { Modal } from "@/components/common/Modal";
import { BrowserReady } from "@/components/common/BrowserReady";
import { isJobOpen } from "@/lib/jobs";
import { useDemoJobs } from "@/lib/useDemoJobs";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { JobApplication } from "@/lib/types";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
  Upload,
  X
} from "lucide-react";
import React, { useState } from "react";

function JobDetailContent({ slug }: { slug: string }) {
  const jobs = useDemoJobs();
  const job = jobs.find(job => job.slug === slug || job.id === slug);
  const [now] = useState(() => Date.now());
  const [isSaved, setIsSaved] = useState(() => job ? DataService.getSavedJobIds().includes(job.id) : false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    currentLocation: "",
    experienceYears: 4,
    currentCompany: "",
    currentDesignation: "",
    noticePeriodDays: 30,
    resumeFile: null as File | null,
    resumeFileName: "",
    answers: {} as Record<string, string>,
    roleConsent: false,
    privacyConsent: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<JobApplication | null>(null);



  if (!job || !isJobOpen(job, now)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Job Requisition Not Found</h1>
        <p className="text-sm text-slate-600 mt-2">
          This opportunity may have been closed or archived following successful mandate fulfillment.
        </p>
        <div className="mt-6">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Verified Jobs Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }).catch(() => setShareCopied(false));
    }
  };

  const handleToggleSave = () => {
    if (!job) return;
    const newState = DataService.toggleSaveJob(job.id);
    setIsSaved(newState);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, resumeFile: null, resumeFileName: "" }));
      const validExtensions = [".pdf", ".docx", ".doc"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      if (!validExtensions.includes(ext)) {
        setFormErrors((prev) => ({
          ...prev,
          resume: "Only PDF or Word documents (.pdf, .docx, .doc) are accepted.",
        }));
        return;
      }

      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          resume: "File size exceeds 5MB limit. Please compress your document.",
        }));
        return;
      }

      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.resume;
        return copy;
      });

      setFormData((prev) => ({
        ...prev,
        resumeFile: file,
        resumeFileName: file.name,
      }));
    }
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.candidateName.trim()) errors.candidateName = "Full legal name is required";
      if (!formData.candidateEmail.trim() || !formData.candidateEmail.includes("@")) {
        errors.candidateEmail = "Valid email address is required for official correspondence";
      }
      if (!formData.candidatePhone.trim()) errors.candidatePhone = "Mobile contact number is required";
      if (!formData.currentLocation.trim()) errors.currentLocation = "Current city/state is required";
    }

    if (step === 2) {
      if (formData.experienceYears < 0) errors.experienceYears = "Experience cannot be negative";
      if (!formData.resumeFileName) errors.resume = "Resume document upload is required";
    }

    if (step === 3) {
      // Validate screening questions if any
      job.questions.forEach((q) => {
        if (q.required && !formData.answers[q.id]) {
          errors[q.id] = "This question requires an answer";
        }
      });
      if (!formData.roleConsent) {
        errors.roleConsent = "You must provide explicit consent for ATSAI to submit your profile for this specific role.";
      }
      if (!formData.privacyConsent) {
        errors.privacyConsent = "Please acknowledge our DPDP Act compliant privacy policy.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(applyStep)) {
      setApplyStep((prev) => prev + 1);
    }
  };

  const handleSubmitApplication = () => {
    for (const step of [1, 2, 3]) { if (!validateStep(step)) { setApplyStep(step); return; } }
    setIsSubmitting(true);

    setTimeout(() => {
      try {
      const newApp = DataService.submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        employerName: job.isEmployerConfidential ? "Confidential Client" : job.employerName,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        candidatePhone: formData.candidatePhone,
        currentLocation: formData.currentLocation,
        experienceYears: Number(formData.experienceYears),
        currentCompany: formData.currentCompany,
        currentDesignation: formData.currentDesignation,
        noticePeriodDays: Number(formData.noticePeriodDays),
        resumeFileName: formData.resumeFileName || "Candidate_Resume.pdf",
        resumeFileSize: formData.resumeFile ? `${(formData.resumeFile.size / 1024).toFixed(0)} KB` : "1.1 MB",
        answers: formData.answers,
        roleSpecificConsentGiven: true,
        consentTimestamp: new Date().toISOString(),
      });

      setIsSubmitting(false);
      setSubmittedApp(newApp);
      setApplyStep(4); // Success step
      } catch (error) {
        setIsSubmitting(false);
        setFormErrors({ submit: error instanceof Error ? error.message : "Could not save this demo record." });
      }
    }, 600);
  };

  const relatedJobs = jobs.filter((j) => j.id !== job.id && isJobOpen(j, now)).slice(0, 2);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      {formErrors.submit && <p role="alert" className="p-4 text-red-800 bg-red-50">{formErrors.submit}</p>}

      {/* Inject JobPosting JSON-LD */}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/jobs" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Verified Jobs Directory</span>
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{job.title}</span>
        </nav>

        {/* Scam Warning Banner (PRD Requirement) */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Zero-Fee Policy:</strong> ATSAI Talent Solutions never charges candidates any fees for job representation.
            </span>
          </div>
          <Link href="/report-job" className="text-amber-700 hover:text-amber-900 underline font-semibold shrink-0">
            Report Suspicious Contact
          </Link>
        </div>

        {/* Main Grid: Details (Left) + Sticky Application Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Job Information Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Header Box */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                    Ref: {job.referenceId}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Client Mandate
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Copy listing URL"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareCopied ? "Copied Link!" : "Share"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDemoAction(handleToggleSave)}
                    className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium ${
                      isSaved ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1728] leading-tight">
                {job.title}
              </h1>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700 font-semibold">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>
                  {job.isEmployerConfidential ? "Confidential Employer (Retained ATSAI Client)" : job.employerName}
                </span>
              </div>

              {/* Attributes Chips */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {job.location.city}, {job.location.state}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Work Arrangement</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {job.workMode}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Experience</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    {job.experienceMinYears}-{job.experienceMaxYears} Years
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Annual CTC Band</span>
                  <span className="font-bold text-emerald-800 mt-0.5 block">
                    {job.isSalaryDisclosed && job.salaryMin && job.salaryMax ? (
                      `₹${(job.salaryMin / 100000).toFixed(1)}L - ₹${(job.salaryMax / 100000).toFixed(1)}L PA`
                    ) : (
                      "Commensurate"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Summary */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                  About the Opportunity
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {job.summary}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                  Core Responsibilities
                </h2>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                  Required Competencies &amp; Qualifications
                </h2>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical Skills Stack */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                  Key Technical Competencies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg border border-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Structured Selection Process (PRD Section 04.C) */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-3">
                  Selection &amp; Evaluation Process
                </h2>
                <div className="space-y-3">
                  {job.selectionStages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{stage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter & Governance Channel */}
              <div className="pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>
                    Official Recruiter Channel: <strong className="text-slate-800">{job.recruiterContactChannel}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>
                    Need to verify recruiter credentials? Check <Link href="/verify-recruiter" className="text-blue-600 underline">Recruiter Directory</Link>
                  </span>
                </div>
              </div>
            </div>

            {/* Related Verified Opportunities */}
            <div className="pt-4">
              <h2 className="text-lg font-bold text-[#0b1728] mb-4">
                Other Verified Opportunities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedJobs.map((rj) => (
                  <Link
                    key={rj.id}
                    href={`/jobs/${rj.slug}`}
                    className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs transition-all block group"
                  >
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{rj.referenceId}</span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                      {rj.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{rj.location.city} &bull; {rj.workMode}</p>
                    <span className="text-xs font-semibold text-blue-600 mt-3 inline-flex items-center gap-1">
                      View Spec &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky Desktop Application Panel (PRD Requirement) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Direct Mandate Application
                </span>
                <h3 className="text-xl font-bold text-[#0b1728] mt-1">
                  Ready to be represented?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Complete our 3-minute verified application. Your credentials remain private until you explicitly consent to employer disclosure.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero registration or candidate fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct recruiter evaluation within 48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time status tracking reference ID</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setApplyModalOpen(true)}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-600"
              >
                <span>Apply for this Position</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/report-job"
                  className="text-[11px] text-slate-400 hover:text-amber-600 underline"
                >
                  Report an issue or listing discrepancy
                </Link>
              </div>
            </div>

            {/* Recruiter Quality Pledge */}
            <div className="bg-[#142338] text-white p-5 rounded-2xl border border-slate-700 shadow-xs text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span>ATSAI Quality Pledge</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                We review applications manually and respond to every candidate advancing to client presentation.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive Application Modal (PRD Section 04.C Workflow) */}
      {applyModalOpen && (
        <Modal label="Job application preview" onClose={() => setApplyModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">

            {/* Close button */}
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              aria-label="Close application dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="mb-6">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Application Workflow &bull; Step {applyStep} of 4
              </span>
              <h2 className="text-xl font-extrabold text-[#0b1728] mt-1">
                Apply for: {job.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Requisition Reference: <strong className="text-slate-700">{job.referenceId}</strong>
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(applyStep / 4) * 100}%` }}
              ></div>
            </div>

            {/* Step 1: Contact Details */}
            {applyStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 mb-1">Full Legal Name *</label>
                  <input id="field-1"
                    type="text"
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    placeholder="e.g. Rohan Deshmukh"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.candidateName && <p className="text-[11px] text-red-600 mt-1">{formErrors.candidateName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 mb-1">Email Address *</label>
                    <input id="field-2"
                      type="email"
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      placeholder="rohan@example.com"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.candidateEmail && <p className="text-[11px] text-red-600 mt-1">{formErrors.candidateEmail}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-3" className="block text-xs font-bold text-slate-800 mb-1">Mobile Contact (+91) *</label>
                    <input id="field-3"
                      type="tel"
                      value={formData.candidatePhone}
                      onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                      placeholder="+91 98201 44210"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.candidatePhone && <p className="text-[11px] text-red-600 mt-1">{formErrors.candidatePhone}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="field-4" className="block text-xs font-bold text-slate-800 mb-1">Current City / Location *</label>
                  <input id="field-4"
                    type="text"
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.currentLocation && <p className="text-[11px] text-red-600 mt-1">{formErrors.currentLocation}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <span>Continue to Experience &amp; Resume</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Experience & Resume Upload */}
            {applyStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-5" className="block text-xs font-bold text-slate-800 mb-1">Total Relevant Experience (Years)</label>
                    <input id="field-5"
                      type="number"
                      min="0"
                      max="30"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="field-6" className="block text-xs font-bold text-slate-800 mb-1">Official Notice Period (Days)</label>
                    <select id="field-6"
                      value={formData.noticePeriodDays}
                      onChange={(e) => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="0">Immediate / Serving Notice</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-7" className="block text-xs font-bold text-slate-800 mb-1">Current Employer (Optional)</label>
                    <input id="field-7"
                      type="text"
                      value={formData.currentCompany}
                      onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                      placeholder="e.g. KPMG / Infosys"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="field-8" className="block text-xs font-bold text-slate-800 mb-1">Current Title (Optional)</label>
                    <input id="field-8"
                      type="text"
                      value={formData.currentDesignation}
                      onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                      placeholder="e.g. BI Specialist"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* File Upload (PDF / DOCX) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Resume File (PDF / DOCX, max 5MB) *</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer block"
                    >
                      {formData.resumeFileName ? `Selected: ${formData.resumeFileName}` : "Click to browse and upload resume"}
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Scanned securely and quarantined until verified clean.
                    </p>
                  </div>
                  {formErrors.resume && <p className="text-[11px] text-red-600 mt-1">{formErrors.resume}</p>}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setApplyStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:underline"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <span>Continue to Screening &amp; Consent</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Screening Questions & Role-Specific Consent (DPDP Act) */}
            {applyStep === 3 && (
              <div className="space-y-4">
                {/* Specific screening questions */}
                {job.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {q.question} {q.required && "*"}
                    </label>
                    {q.type === "choice" && q.options && (
                      <select
                        value={formData.answers[q.id] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            answers: { ...formData.answers, [q.id]: e.target.value },
                          })
                        }
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="">Select your response...</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                    {q.type === "boolean" && (
                      <div className="flex gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value="Yes"
                            checked={formData.answers[q.id] === "Yes"}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                answers: { ...formData.answers, [q.id]: "Yes" },
                              })
                            }
                            className="text-blue-600"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value="No"
                            checked={formData.answers[q.id] === "No"}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                answers: { ...formData.answers, [q.id]: "No" },
                              })
                            }
                            className="text-blue-600"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    )}
                    {q.type === "text" && (
                      <input
                        type="text"
                        value={formData.answers[q.id] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            answers: { ...formData.answers, [q.id]: e.target.value },
                          })
                        }
                        placeholder="Your answer..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    )}
                    {formErrors[q.id] && <p className="text-[11px] text-red-600 mt-1">{formErrors[q.id]}</p>}
                  </div>
                ))}

                {/* Consent Checkboxes (Mandatory DPDP Act 2023) */}
                <div className="pt-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.roleConsent}
                      onChange={(e) => setFormData({ ...formData, roleConsent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Role-Specific Consent:</strong> I authorize ATSAI Talent Solutions to evaluate and share my resume and profile exclusively for <em>{job.title}</em> ({job.referenceId}). My profile will not be disclosed to other employers without separate authorization.
                    </span>
                  </label>
                  {formErrors.roleConsent && <p className="text-[11px] text-red-600 pl-6.5">{formErrors.roleConsent}</p>}

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>
                      I have read and agree to the <Link href="/legal/candidate-terms" target="_blank" className="text-blue-600 underline">Candidate Terms</Link> and <Link href="/legal/privacy-policy" target="_blank" className="text-blue-600 underline">Privacy Policy</Link> under the India DPDP Act 2023.
                    </span>
                  </label>
                  {formErrors.privacyConsent && <p className="text-[11px] text-red-600 pl-6.5">{formErrors.privacyConsent}</p>}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setApplyStep(2)}
                    className="text-xs font-semibold text-slate-600 hover:underline"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitApplication}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <span>Verifying &amp; Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Official Application</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Submission Success Confirmation (PRD Requirement) */}
            {applyStep === 4 && submittedApp && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Application Successfully Registered
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Your credentials have been securely logged in our recruitment management system.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Official Tracking Reference:</span>
                    <strong className="font-mono text-blue-600 font-bold">{submittedApp.referenceId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="font-semibold text-slate-800">{submittedApp.candidateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mandate:</span>
                    <span className="font-semibold text-slate-800">{submittedApp.jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                      Submitted &bull; Screening Pending
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/candidate/dashboard"
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
                  >
                    Track in Candidate Portal
                  </Link>
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}

          </div>
        </Modal>
      )}

    </div>
  );
}

export function JobDetailClient({ slug }: { slug: string }) { return <BrowserReady><JobDetailContent key={slug} slug={slug} /></BrowserReady>; }

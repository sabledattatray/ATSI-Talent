"use client";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { HiringMandate } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function RequestTalentPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMandate, setSubmittedMandate] = useState<HiringMandate | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Organization Details
    employerName: "",
    registeredEntity: "",
    officialWebsite: "",
    workEmail: "",
    contactPhone: "",

    // Step 2: Role Details
    roleTitle: "",
    department: "Data Engineering",
    seniority: "Mid-Senior (4-7 yrs)",
    openingsCount: 1,
    location: "Pune",
    workMode: "Hybrid" as HiringMandate["workMode"],
    budgetMaxLPA: 18,

    // Step 3: Candidate Criteria & Skills
    mandatorySkills: "",
    qualifications: "Bachelor's / Master's degree in engineering, math, or finance",
    noticePeriodConstraint: "30 Days or Serving Notice",

    // Step 4: Hiring Process & Terms
    interviewStages: "Stage 1: Technical Screen, Stage 2: Coding/Problem Solving, Stage 3: Management Fit",
    hiringTimeline: "Within 30 Days",
    termsAccepted: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateStep = (s: number) => {
    const errors: Record<string, string> = {};
    if (s === 1) {
      if (!formData.employerName.trim()) errors.employerName = "Company trading name is required";
      if (!formData.workEmail.trim() || !formData.workEmail.includes("@")) {
        errors.workEmail = "Official business email is required";
      }
      if (!formData.contactPhone.trim()) errors.contactPhone = "Phone number is required";
    }

    if (s === 2) {
      if (!formData.roleTitle.trim()) errors.roleTitle = "Job title is required";
      if (formData.budgetMaxLPA <= 0) errors.budgetMaxLPA = "Budget LPA must be positive";
    }

    if (s === 3) {
      if (!formData.mandatorySkills.trim()) errors.mandatorySkills = "Please list key technical skills";
    }

    if (s === 4) {
      if (!formData.termsAccepted) {
        errors.termsAccepted = "You must acknowledge the standard contingent recruitment terms.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);

    setTimeout(() => {
      try {
      const newMandate = DataService.createMandate({
        employerName: formData.employerName,
        roleTitle: formData.roleTitle,
        department: formData.department,
        openingsCount: Number(formData.openingsCount),
        experienceRange: formData.seniority,
        budgetMaxLPA: Number(formData.budgetMaxLPA),
        location: `${formData.location} (${formData.workMode})`,
        workMode: formData.workMode,
      });

      setIsSubmitting(false);
      setSubmittedMandate(newMandate);
      setStep(5); // Success step
      } catch (error) {
        setIsSubmitting(false);
        setFormErrors({ submit: error instanceof Error ? error.message : "Could not save this demo record." });
      }
    }, 600);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      {formErrors.submit && <p role="alert" className="p-4 text-red-800 bg-red-50">{formErrors.submit}</p>}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Mandate Calibration
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1">
            Submit Multi-Step Hiring Brief
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
            Provide role specifications to commission our sector search desk. Mandates are reviewed for compliance and calibrated before candidates are engaged.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2 px-1">
            <span className={step >= 1 ? "text-blue-600 font-bold" : ""}>1. Organization</span>
            <span className={step >= 2 ? "text-blue-600 font-bold" : ""}>2. Role Details</span>
            <span className={step >= 3 ? "text-blue-600 font-bold" : ""}>3. Criteria</span>
            <span className={step >= 4 ? "text-blue-600 font-bold" : ""}>4. SLA &amp; Terms</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">

          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Company &amp; Authorized Contact
              </h2>

              <div>
                <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 mb-1">Company Trading Name *</label>
                <input id="field-1"
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  placeholder="e.g. Apex FinTech Solutions Pvt Ltd"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.employerName && <p className="text-[11px] text-red-600 mt-1">{formErrors.employerName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 mb-1">Official Website</label>
                  <input id="field-2"
                    type="url"
                    value={formData.officialWebsite}
                    onChange={(e) => setFormData({ ...formData, officialWebsite: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="field-3" className="block text-xs font-bold text-slate-800 mb-1">Registered Entity (MCA / CIN)</label>
                  <input id="field-3"
                    type="text"
                    value={formData.registeredEntity}
                    onChange={(e) => setFormData({ ...formData, registeredEntity: e.target.value })}
                    placeholder="e.g. U72200PN2021PTC199000"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-4" className="block text-xs font-bold text-slate-800 mb-1">Authorized Contact Email *</label>
                  <input id="field-4"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    placeholder="ta-lead@company.com"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.workEmail && <p className="text-[11px] text-red-600 mt-1">{formErrors.workEmail}</p>}
                </div>

                <div>
                  <label htmlFor="field-5" className="block text-xs font-bold text-slate-800 mb-1">Official Phone *</label>
                  <input id="field-5"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 98200 11220"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.contactPhone && <p className="text-[11px] text-red-600 mt-1">{formErrors.contactPhone}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <span>Role Specifications</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Role Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Position &amp; Compensation Boundaries
              </h2>

              <div>
                <label htmlFor="field-6" className="block text-xs font-bold text-slate-800 mb-1">Position / Requisition Title *</label>
                <input id="field-6"
                  type="text"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  placeholder="e.g. Senior Power BI & SQL Analytics Specialist"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.roleTitle && <p className="text-[11px] text-red-600 mt-1">{formErrors.roleTitle}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="field-7" className="block text-xs font-bold text-slate-800 mb-1">Department</label>
                  <select id="field-7"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Data Engineering">Data Engineering</option>
                    <option value="Business Intelligence">Business Intelligence</option>
                    <option value="MIS & Operations">MIS &amp; Operations</option>
                    <option value="Corporate Finance & Risk">Corporate Finance &amp; Risk</option>
                    <option value="Software Architecture">Software Architecture</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="field-8" className="block text-xs font-bold text-slate-800 mb-1">Seniority</label>
                  <select id="field-8"
                    value={formData.seniority}
                    onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Junior (1-3 yrs)">Junior (1-3 yrs)</option>
                    <option value="Mid-Senior (4-7 yrs)">Mid-Senior (4-7 yrs)</option>
                    <option value="Lead / Manager (8-12 yrs)">Lead / Manager (8-12 yrs)</option>
                    <option value="Director / Executive (12+ yrs)">Director / Executive (12+ yrs)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="field-9" className="block text-xs font-bold text-slate-800 mb-1">Target Openings</label>
                  <input id="field-9"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.openingsCount}
                    onChange={(e) => setFormData({ ...formData, openingsCount: Number(e.target.value) })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="field-10" className="block text-xs font-bold text-slate-800 mb-1">Location Base</label>
                  <input id="field-10"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Pune / Mumbai"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="field-11" className="block text-xs font-bold text-slate-800 mb-1">Work Mode</label>
                  <select id="field-11"
                    value={formData.workMode}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value as HiringMandate["workMode"] })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="field-12" className="block text-xs font-bold text-slate-800 mb-1">Max Budget (INR LPA) *</label>
                  <input id="field-12"
                    type="number"
                    value={formData.budgetMaxLPA}
                    onChange={(e) => setFormData({ ...formData, budgetMaxLPA: Number(e.target.value) })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  />
                  {formErrors.budgetMaxLPA && <p className="text-[11px] text-red-600 mt-1">{formErrors.budgetMaxLPA}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <span>Candidate Criteria</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Candidate Criteria & Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Mandatory Competencies &amp; Constraints
              </h2>

              <div>
                <label htmlFor="field-13" className="block text-xs font-bold text-slate-800 mb-1">Mandatory Technical Skills (Comma separated) *</label>
                <textarea id="field-13"
                  rows={3}
                  value={formData.mandatorySkills}
                  onChange={(e) => setFormData({ ...formData, mandatorySkills: e.target.value })}
                  placeholder="e.g. Power BI, DAX, Advanced SQL, Star Schema, PostgreSQL, Excel Modeling"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.mandatorySkills && <p className="text-[11px] text-red-600 mt-1">{formErrors.mandatorySkills}</p>}
              </div>

              <div>
                <label htmlFor="field-14" className="block text-xs font-bold text-slate-800 mb-1">Minimum Education / Certifications</label>
                <input id="field-14"
                  type="text"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="field-15" className="block text-xs font-bold text-slate-800 mb-1">Maximum Acceptable Notice Period</label>
                <select id="field-15"
                  value={formData.noticePeriodConstraint}
                  onChange={(e) => setFormData({ ...formData, noticePeriodConstraint: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Immediate / Serving Notice">Immediate / Serving Notice only</option>
                  <option value="30 Days or Serving Notice">Up to 30 Days</option>
                  <option value="Up to 60 Days">Up to 60 Days</option>
                  <option value="Negotiable (Any)">Negotiable</option>
                </select>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <span>Review SLA &amp; Commercial Terms</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: SLA & Terms Acknowledgment */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Delivery Timeline &amp; Engagement Terms
              </h2>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Standard Mandate Terms Summary:</p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SLA:</strong> First batch of calibrated dossiers delivered within 5 business days of mutual mandate confirmation.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Fee Structure:</strong> Contingent recruitment fee (standard 8.33% of annual fixed CTC) payable only on candidate joining.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Replacement Period:</strong> 90-day replacement commitment if hired candidate resigns or fails performance criteria.</span>
                </div>
              </div>

              <div>
                <label htmlFor="field-16" className="block text-xs font-bold text-slate-800 mb-1">Target Hiring Timeline</label>
                <input id="field-16"
                  type="text"
                  value={formData.hiringTimeline}
                  onChange={(e) => setFormData({ ...formData, hiringTimeline: e.target.value })}
                  placeholder="e.g. Within 30 Days"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>
                    I confirm this hiring brief represents an authentic company requirement. I agree to the <Link href="/legal/recruitment-services-agreement" target="_blank" className="text-blue-600 underline">Standard Recruitment Services Agreement</Link> and acknowledge that ATSAI does not automatically publish positions until authenticated.
                  </span>
                </label>
                {formErrors.termsAccepted && <p className="text-[11px] text-red-600 pl-6.5 mt-1">{formErrors.termsAccepted}</p>}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Registering Brief...</span>
                  ) : (
                    <>
                      <span>Submit Mandate Requisition</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Submission Success Acknowledgment */}
          {step === 5 && submittedMandate && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Hiring Mandate Brief Registered
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Your sample brief is saved only in this demo tab. No recruiter has been notified.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mandate Reference ID:</span>
                  <strong className="font-mono text-blue-600 font-bold">{submittedMandate.mandateId}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-slate-800">{submittedMandate.roleTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Recruiter:</span>
                  <span className="font-semibold text-slate-800">{submittedMandate.assignedRecruiterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    Brief Received &bull; Calibration Scheduled
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/employer/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                >
                  Open Employer Portal Console
                </Link>
                <Link
                  href="/employers"
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                >
                  Return to Employer Overview
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

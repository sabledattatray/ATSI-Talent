"use client";
import { DEMO_MODE } from "@/lib/runtime";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { EmployerLead } from "@/lib/types";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  Send,
  ShieldCheck
} from "lucide-react";
import React, { useState } from "react";

export default function EmployersPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    businessEmail: "",
    phone: "",
    hiringVolume: "1-3 Roles",
    rolesNeeded: "",
    locations: "",
    timeline: "Next 30 Days",
    message: "",
    privacyConsent: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<EmployerLead | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.companyName.trim()) errors.companyName = "Registered company name is required";
    if (!formData.contactPerson.trim()) errors.contactPerson = "Authorized representative name is required";
    if (!formData.businessEmail.trim() || !formData.businessEmail.includes("@")) {
      errors.businessEmail = "Corporate business email is required";
    }
    if (!formData.phone.trim()) errors.phone = "Contact phone number is required";
    if (!formData.rolesNeeded.trim()) errors.rolesNeeded = "Please specify required job roles or skills";
    if (!formData.privacyConsent) errors.privacyConsent = "Please agree to employer lead processing terms";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      try {
      const newLead = DataService.submitEmployerLead({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        businessEmail: formData.businessEmail,
        phone: formData.phone,
        hiringVolume: formData.hiringVolume,
        rolesNeeded: formData.rolesNeeded,
        locations: formData.locations || "India (Pan-India)",
        timeline: formData.timeline,
        message: formData.message,
      });

      setIsSubmitting(false);
      setSubmittedLead(newLead);
      } catch (error) {
        setIsSubmitting(false);
        setFormErrors({ submit: error instanceof Error ? error.message : "Could not save this demo record." });
      }
    }, 600);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {formErrors.submit && <p role="alert" className="p-4 text-red-800 bg-red-50">{formErrors.submit}</p>}

      {/* 1. Header Hero */}
      <section className="bg-[#0b1728] text-white py-16 sm:py-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Contingent &amp; Retained Hiring Consultancy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Calibrated Analytics &amp; Tech Talent for Growing Enterprises
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              We partner with corporate leadership, CTOs, and HR teams to source, technically evaluate, and deliver top-percentile candidates in Power BI, SQL, MIS, BFSI, and Software Engineering.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href="/employers/request-talent"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Submit Detailed Hiring Brief</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#lead-form"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
              >
                Request Callback
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Recruitment Methodology & Value Prop */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              The ATSAI Standard
            </span>
            <h2 className="text-3xl font-extrabold text-[#0b1728] mt-1.5">
              Why Corporate Employers Partner With Us
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              We eliminate resume flooding and unsolicited CV spam through strict qualification rubrics and verified technical screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0b1728]">
                Technically Screened Shortlists
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Before presenting any profile, our recruitment specialists conduct technical evaluations—validating complex SQL queries, DAX logic, or financial models.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0b1728]">
                Notice Period Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We independently verify official notice period constraints, competing offers, and relocation appetite, minimizing offer fallout rates.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0b1728]">
                Standard Replacement Guarantee
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All permanent recruitment mandates are governed by clear commercial terms including free candidate replacement windows within 90 days of onboarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Inquiry Form Section (PRD Section 04.D Requirement) */}
      <section id="lead-form" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg">

            <div className="mb-8">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Partner with ATSAI
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1728] mt-1">
                Employer Hiring Inquiry
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Submit your hiring requirement below. Our senior practice director will contact you within 1 business day with a customized engagement plan.
              </p>
            </div>

            {submittedLead ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-emerald-950">
                  Hiring Inquiry Received
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your corporate inquiry has been assigned tracking reference <strong className="font-mono text-emerald-900">{submittedLead.leadId}</strong>. This is saved only in this demo tab. No specialist has been notified.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSubmittedLead(null)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800"
                  >
                    Submit Another Requirement
                  </button>
                </div>
              </div>
            ) : (
              <fieldset disabled={!DEMO_MODE} className="min-w-0"><form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 mb-1">Company / Entity Name *</label>
                    <input id="field-1"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Apex FinTech Solutions"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.companyName && <p className="text-[11px] text-red-600 mt-1">{formErrors.companyName}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 mb-1">Authorized Representative *</label>
                    <input id="field-2"
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Siddharth Rao (Talent Acquisition Lead)"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.contactPerson && <p className="text-[11px] text-red-600 mt-1">{formErrors.contactPerson}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-3" className="block text-xs font-bold text-slate-800 mb-1">Business Email *</label>
                    <input id="field-3"
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      placeholder="siddharth@apexfintech.com"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.businessEmail && <p className="text-[11px] text-red-600 mt-1">{formErrors.businessEmail}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-4" className="block text-xs font-bold text-slate-800 mb-1">Direct Phone / Mobile *</label>
                    <input id="field-4"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 99201 88200"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {formErrors.phone && <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="field-5" className="block text-xs font-bold text-slate-800 mb-1">Hiring Volume</label>
                    <select id="field-5"
                      value={formData.hiringVolume}
                      onChange={(e) => setFormData({ ...formData, hiringVolume: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="1-3 Roles">1-3 Senior Roles</option>
                      <option value="5-10 Roles">5-10 Roles</option>
                      <option value="10-25 Roles">10-25 Roles</option>
                      <option value="25+ Roles">25+ Enterprise Ramp-up</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="field-6" className="block text-xs font-bold text-slate-800 mb-1">Target Locations</label>
                    <input id="field-6"
                      type="text"
                      value={formData.locations}
                      onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                      placeholder="e.g. Pune, Bengaluru, Remote"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="field-7" className="block text-xs font-bold text-slate-800 mb-1">Timeline</label>
                    <select id="field-7"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="Immediate">Immediate (Within 15 Days)</option>
                      <option value="Next 30 Days">Next 30 Days</option>
                      <option value="Next Quarter">Next Quarter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="field-8" className="block text-xs font-bold text-slate-800 mb-1">Roles Needed &amp; Required Skillsets *</label>
                  <textarea id="field-8"
                    rows={3}
                    value={formData.rolesNeeded}
                    onChange={(e) => setFormData({ ...formData, rolesNeeded: e.target.value })}
                    placeholder="e.g. Senior Power BI Developer (4-6 yrs), MIS Team Lead (7+ yrs), Credit Risk Analyst"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.rolesNeeded && <p className="text-[11px] text-red-600 mt-1">{formErrors.rolesNeeded}</p>}
                </div>

                <div>
                  <label htmlFor="field-9" className="block text-xs font-bold text-slate-800 mb-1">Additional Project Context (Optional)</label>
                  <textarea id="field-9"
                    rows={2}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Mention any specific ERP, compliance, or reporting constraints..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>
                      I authorize ATSAI Talent Solutions to contact our company regarding recruitment services and agree to the <Link href="/legal/employer-terms" target="_blank" className="text-blue-600 underline">Employer Terms</Link>.
                    </span>
                  </label>
                  {formErrors.privacyConsent && <p className="text-[11px] text-red-600 pl-6.5 mt-1">{formErrors.privacyConsent}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Inquiry...</span>
                  ) : (
                    <>
                      <span>Submit Corporate Hiring Requirement</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form></fieldset>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}

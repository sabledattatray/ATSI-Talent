"use client";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { AbuseReport } from "@/lib/types";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Send
} from "lucide-react";
import React, { useState } from "react";

export default function ReportJobPage() {
  const [formData, setFormData] = useState({
    type: "Job Scam" as AbuseReport["type"],
    reportedEntity: "",
    reporterEmail: "",
    reporterName: "",
    description: "",
    evidenceNotes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<AbuseReport | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.reportedEntity.trim()) {
      errors.reportedEntity = "Please specify the individual, company, or job reference reported";
    }
    if (!formData.description.trim()) {
      errors.description = "Please describe what happened";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      try {
      const report = DataService.submitAbuseReport({
        type: formData.type,
        reportedEntity: formData.reportedEntity,
        reporterEmail: formData.reporterEmail || "anonymous@candidate.local",
        reporterName: formData.reporterName,
        description: formData.description,
        evidenceNotes: formData.evidenceNotes,
      });

      setIsSubmitting(false);
      setSubmittedReport(report);
      } catch (error) {
        setIsSubmitting(false);
        setFormErrors({ submit: error instanceof Error ? error.message : "Could not save this demo record." });
      }
    }, 500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      {formErrors.submit && <p role="alert" className="p-4 text-red-800 bg-red-50">{formErrors.submit}</p>}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/jobs" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Jobs Directory</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Report Job Scam or Misconduct</span>
        </nav>

        {/* Header Box */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Fraud Incident Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1728] tracking-tight">
            Report Suspicious Activity or Fee Solicitation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            ATSAI Talent Solutions maintains zero tolerance for recruitment scams, pay-to-apply demands, or recruiter impersonation. Reports are escalated directly to our compliance officer.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          {submittedReport ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Incident Report Logged
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your report has been assigned triage reference <strong className="font-mono text-blue-600">{submittedReport.reportId}</strong>. This report is saved only in this demo tab. No investigation has started and no team has been notified.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link
                  href="/jobs"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                >
                  Return to Jobs Directory
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmittedReport(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                >
                  Submit Additional Detail
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 mb-1">
                  Incident Category *
                </label>
                <select id="field-1"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AbuseReport["type"] })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Payment Demand">Solicitation of Fees / Money for Job</option>
                  <option value="Impersonation">Recruiter Impersonation (Fake Profile / Domain)</option>
                  <option value="Job Scam">Fake Opportunity / Phishing Link</option>
                  <option value="Misleading Info">Misleading Compensation or Working Terms</option>
                  <option value="Harassment">Unprofessional Conduct</option>
                </select>
              </div>

              <div>
                <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 mb-1">
                  Reported Person, Company, or Job Reference *
                </label>
                <input id="field-2"
                  type="text"
                  value={formData.reportedEntity}
                  onChange={(e) => setFormData({ ...formData, reportedEntity: e.target.value })}
                  placeholder="e.g. Phone number, email address, LinkedIn profile link, or ATS reference ID"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.reportedEntity && <p className="text-[11px] text-red-600 mt-1">{formErrors.reportedEntity}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-3" className="block text-xs font-bold text-slate-800 mb-1">
                    Your Email (Optional for updates)
                  </label>
                  <input id="field-3"
                    type="email"
                    value={formData.reporterEmail}
                    onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                    placeholder="candidate@example.com (or leave empty to stay anonymous)"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="field-4" className="block text-xs font-bold text-slate-800 mb-1">
                    Your Name (Optional)
                  </label>
                  <input id="field-4"
                    type="text"
                    value={formData.reporterName}
                    onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                    placeholder="Candidate name"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-5" className="block text-xs font-bold text-slate-800 mb-1">
                  Description of What Transpired *
                </label>
                <textarea id="field-5"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail the message received, payment amounts demanded, bank accounts provided, or misleading statements..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.description && <p className="text-[11px] text-red-600 mt-1">{formErrors.description}</p>}
              </div>

              <div>
                <label htmlFor="field-6" className="block text-xs font-bold text-slate-800 mb-1">
                  Supporting Evidence (Screenshots / UPI IDs / Links)
                </label>
                <textarea id="field-6"
                  rows={2}
                  value={formData.evidenceNotes}
                  onChange={(e) => setFormData({ ...formData, evidenceNotes: e.target.value })}
                  placeholder="Paste links to screenshots, phone numbers, or WhatsApp chat excerpts..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Dispatching Incident Report...</span>
                  ) : (
                    <>
                      <span>Submit Official Incident Report</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

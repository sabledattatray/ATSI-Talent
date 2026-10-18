"use client";
import { BrowserReady } from "@/components/common/BrowserReady";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { HiringMandate } from "@/lib/types";
import {
  Briefcase,
  Building2,
  ExternalLink,
  FileText,
  Plus,
  ShieldCheck,
  Users
} from "lucide-react";
import { useState } from "react";

interface VettedCandidate {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  currentCompany: string;
  expectedSalary: string;
  noticePeriod: string;
  stage: "Dossier Delivered" | "Round 1 Interview" | "Final Evaluation" | "Offer Extended";
  consentRecordedAt: string;
}

const MOCK_CANDIDATES: VettedCandidate[] = [
  {
    id: "cand-1",
    name: "Rahul D.",
    role: "Senior Power BI & SQL Analytics Specialist",
    experienceYears: 5,
    currentCompany: "Enterprise IT Services",
    expectedSalary: "₹18.5 LPA",
    noticePeriod: "30 Days (Negotiable)",
    stage: "Round 1 Interview",
    consentRecordedAt: "16 Oct 2026 10:15 IST",
  },
  {
    id: "cand-2",
    name: "Sneha K.",
    role: "Senior Power BI & SQL Analytics Specialist",
    experienceYears: 6,
    currentCompany: "Tier-1 BFSI Analytics Unit",
    expectedSalary: "₹20 LPA",
    noticePeriod: "60 Days",
    stage: "Dossier Delivered",
    consentRecordedAt: "15 Oct 2026 16:40 IST",
  },
  {
    id: "cand-3",
    name: "Amit V.",
    role: "Lead MIS & Operational Reporting Manager",
    experienceYears: 7,
    currentCompany: "Global Logistics Corp",
    expectedSalary: "₹19 LPA",
    noticePeriod: "Serving Notice (15 Days Left)",
    stage: "Final Evaluation",
    consentRecordedAt: "14 Oct 2026 11:20 IST",
  },
];

function EmployerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"mandates" | "shortlist" | "contracts">("mandates");
  const [mandates] = useState<HiringMandate[]>(() => DataService.getMandates());
  const candidates = MOCK_CANDIDATES;



  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Employer Organization Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#142338] text-white flex items-center justify-center font-bold text-xl border border-slate-700 shadow-2xs">
              <Building2 className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1728]">
                  Apex FinTech Solutions
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>Verified Corporate Account</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Client ID: CLI-APEX-409 &bull; Account Lead: Vikram Malhotra &bull; Contract: Signed Contingent Master Agreement
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/employers/request-talent"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Hiring Brief</span>
            </Link>
            <Link
              href="/legal/recruitment-services-agreement"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200/70 transition-colors"
            >
              View Service Agreement
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Active Mandates</span>
            <p className="text-2xl font-extrabold text-slate-900">{mandates.length || 2}</p>
            <span className="text-[11px] text-emerald-600 font-medium">100% on delivery SLA</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Vetted Dossiers Delivered</span>
            <p className="text-2xl font-extrabold text-slate-900">{candidates.length}</p>
            <span className="text-[11px] text-slate-500">100% with documented consent</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Interviews in Progress</span>
            <p className="text-2xl font-extrabold text-slate-900">2</p>
            <span className="text-[11px] text-blue-600 font-medium">Round 1 &amp; Final</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Replacement Warranty</span>
            <p className="text-2xl font-extrabold text-slate-900">90 Days</p>
            <span className="text-[11px] text-emerald-600 font-medium">Standard Contingent Protection</span>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-slate-200 mb-8 gap-8 text-xs font-bold">
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
            <span>Active Hiring Mandates ({mandates.length || 2})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shortlist")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "shortlist"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Calibrated Shortlists ({candidates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contracts")}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${
              activeTab === "contracts"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Commercial Agreements &amp; Invoices</span>
          </button>
        </div>

        {/* Tab 1: Mandates */}
        {activeTab === "mandates" && (
          <div className="space-y-4">
            {mandates.length > 0 ? (
              mandates.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {m.mandateId}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500">
                        Assigned Desk: <strong>{m.department}</strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500">
                        Target Headcount: <strong>{m.openingsCount}</strong>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#0b1728]">
                      {m.roleTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>Location: <strong>{m.location} ({m.workMode})</strong></span>
                      <span>Target Band: <strong>₹{m.budgetMaxLPA} LPA</strong></span>
                      <span>SLA Window: <strong>5 Business Days</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {m.status}
                    </span>
                    <Link
                      href="/employers/request-talent"
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                    >
                      Edit Brief
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No active mandates</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Submit a structured hiring brief to initiate candidate sourcing and screening with our sector specialists.
                </p>
                <div className="mt-6">
                  <Link
                    href="/employers/request-talent"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Submit Hiring Brief</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Vetted Shortlists */}
        {activeTab === "shortlist" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  All candidate profiles displayed below have executed role-specific consent for Apex FinTech Solutions under DPDP requirements.
                </span>
              </div>
            </div>

            {candidates.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#0b1728]">{c.name}</h2>
                    <span className="text-xs text-slate-500">&bull; {c.experienceYears} Years Exp</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs text-slate-500">Current: {c.currentCompany}</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Mandate: <strong>{c.role}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>Expected Compensation: <strong className="text-slate-800">{c.expectedSalary}</strong></span>
                    <span>Notice Period: <strong className="text-slate-800">{c.noticePeriod}</strong></span>
                    <span className="text-[11px] text-emerald-600 font-medium">Consent Logged: {c.consentRecordedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.stage === "Round 1 Interview"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {c.stage}
                  </span>
                  <Link
                    href="mailto:ananya.sen@atsai.pro?subject=Interview Feedback for Candidate "
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
                  >
                    Submit Feedback
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Contracts & Billing */}
        {activeTab === "contracts" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0b1728]">Contingent Recruitment Agreement</h2>
              <p className="text-xs text-slate-500 mt-0.5">Master Terms Reference: RSA-2025-APEX9</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Fee Trigger</span>
                <p className="font-bold text-slate-900">Candidate Physical/Remote Joining Date</p>
                <span className="text-[11px] text-slate-500">Zero upfront advance or search retainer</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Payment Term</span>
                <p className="font-bold text-slate-900">Net 30 Days from Invoice Generation</p>
                <span className="text-[11px] text-slate-500">Electronic Bank Transfer (NEFT/RTGS)</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Warranty Clause</span>
                <p className="font-bold text-slate-900">90-Day Free Replacement Window</p>
                <span className="text-[11px] text-emerald-600 font-medium">Guaranteed candidate replacement</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">No overdue or pending invoices</span>
              <Link
                href="/legal/recruitment-services-agreement"
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Read Full B2B Legal Terms</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Page() { return <BrowserReady><EmployerDashboardPage /></BrowserReady>; }

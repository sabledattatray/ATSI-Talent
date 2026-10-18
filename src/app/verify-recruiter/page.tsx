"use client";
import Link from "next/link";

import { DataService } from "@/lib/dataService";
import { VerifiedRecruiter } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck
} from "lucide-react";
import React, { useState } from "react";

export default function VerifyRecruiterPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<VerifiedRecruiter | undefined>(undefined);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
    const match = DataService.verifyRecruiter(query);
    setResult(match);
  };

  const allRecruiters = DataService.getAllVerifiedRecruiters();

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Anti-Impersonation &amp; Fraud Defense</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] tracking-tight">
            Sample recruiter directory
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Protect yourself against job scams. Confirm whether an individual approaching you on LinkedIn, WhatsApp, or email is an authorized representative of ATSAI Talent Solutions.
          </p>
        </div>

        {/* Verification Search Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md mb-12">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verify-query" className="block text-xs font-bold text-slate-800 mb-2">
                Enter Recruiter Name, Official Email, or Recruiter ID:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="verify-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. ananya.sen@atsai.pro or REC-ATS-101 or Vikram"
                    className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
                >
                  Verify Now
                </button>
              </div>
            </div>
          </form>

          {/* Result State */}
          {searched && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              {result ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-xs text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Sample identity match — not an affiliation verification</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-emerald-700 block text-[11px]">Representative Name:</span>
                      <strong className="text-slate-900 text-sm">{result.name}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[11px]">Recruiter ID:</span>
                      <strong className="font-mono text-slate-900 text-sm">{result.recruiterId}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[11px]">Official Email:</span>
                      <span className="text-slate-900 font-medium">{result.officialEmail}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[11px]">Practice Specialization:</span>
                      <span className="text-slate-900 font-medium">{result.specialization}</span>
                    </div>
                  </div>
                  <div className="pt-2 text-[11px] text-emerald-800 border-t border-emerald-200">
                    &bull; Note: Official communications are issued exclusively from <code>@atsai.pro</code> domains. ATSAI personnel will never ask for deposits, assessment fees, or laptop delivery charges.
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-xs text-red-900 space-y-3">
                  <div className="flex items-center gap-2.5 text-red-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>No Official Affiliation Found</span>
                  </div>
                  <p className="leading-relaxed">
                    We could not find any active ATSAI recruiter matching &quot;<strong>{query}</strong>&quot;. If this individual claims to represent ATSAI and requests any fee or personal banking details, please disengage immediately.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/report-job"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline"
                    >
                      <span>Report Impersonation or Fraud to ATSAI Compliance Desk &rarr;</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Directory of Authorized Recruiter Leads */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-12">
          <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-4">
            Authorized Practice Leadership Directory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allRecruiters.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold">
                    {rec.recruiterId}
                  </span>
                  <span className="text-emerald-700 font-semibold text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{rec.name}</p>
                <p className="text-slate-500 text-[11px]">{rec.specialization}</p>
                <div className="pt-1 text-slate-700 font-mono text-[11px] truncate">
                  {rec.officialEmail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-Scam Rules */}
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-xs text-amber-950 space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Official Candidate Safety Rules</span>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-slate-700">
            <li>ATSAI never charges candidates under any circumstance—no registration, interview, or document verification fee.</li>
            <li>All legitimate emails arrive from our domain <code>@atsai.pro</code>. We do not use Gmail, Yahoo, or Outlook addresses for corporate business.</li>
            <li>We do not extend job offers via WhatsApp or Telegram without formal technical interviews and written employer offer letters.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

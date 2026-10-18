"use client";
import Link from "next/link";

import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Send,
  ShieldCheck
} from "lucide-react";
import React, { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "General Inquiry",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const isSubmitting = false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Official Channels
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Contact ATSAI Talent Solutions
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Reach out to our recruitment practice leaders, client relationship managers, or data protection officer. We respond to all verified inquiries within 1 business day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0b1728] uppercase tracking-wider mb-4">
                  Official Communication Desks
                </h2>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">General &amp; Employer Inquiries:</span>
                      <Link href="mailto:contact@atsai.pro" className="text-blue-600 hover:underline">
                        contact@atsai.pro
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">DPDP Act Grievance Redressal Officer:</span>
                      <Link href="mailto:grievance@atsai.pro" className="text-blue-600 hover:underline">
                        grievance@atsai.pro
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Operating Hub:</span>
                      <span>Pune &amp; Mumbai, Maharashtra, India</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mandates serviced pan-India and globally</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Business Operating Hours:</span>
                      <span>Monday – Friday, 09:30 AM to 06:30 PM IST</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs text-amber-950">
                <span className="font-bold block mb-1">Notice to Job Seekers:</span>
                <p className="leading-relaxed text-[11px] text-slate-700">
                  We never solicit fees or deposits. If you are approached by someone requesting money claiming to represent ATSAI, please <Link href="/report-job" className="text-amber-800 underline font-semibold">report it immediately</Link>.
                </p>
              </div>
            </div>

          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-[#0b1728] mb-1">
                Send an Inquiry Message
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Fill in your details below and our team will get back to you promptly.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-bold text-emerald-950">Demo preview complete</h3>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    This form has no delivery service. Your message was not saved or sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Return to preview form
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="field-1" className="block text-xs font-bold text-slate-800 mb-1">Your Name *</label>
                      <input id="field-1"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vikram Malhotra"
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="field-2" className="block text-xs font-bold text-slate-800 mb-1">Official Email *</label>
                      <input id="field-2"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="vikram@example.com"
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="field-3" className="block text-xs font-bold text-slate-800 mb-1">Phone Number</label>
                      <input id="field-3"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98200 00000"
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="field-4" className="block text-xs font-bold text-slate-800 mb-1">Category</label>
                      <select id="field-4"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="General Inquiry">General Corporate Inquiry</option>
                        <option value="Employer Hiring Mandate">Employer Hiring Mandate</option>
                        <option value="Candidate Application Query">Candidate Application Query</option>
                        <option value="Compliance / Grievance">Compliance / DPDP Grievance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="field-5" className="block text-xs font-bold text-slate-800 mb-1">Subject</label>
                    <input id="field-5"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Data engineering hiring mandate inquiry"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="field-6" className="block text-xs font-bold text-slate-800 mb-1">Message *</label>
                    <textarea id="field-6"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please detail your request or question..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <span>Dispatching...</span> : (
                      <>
                        <span>Preview inquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

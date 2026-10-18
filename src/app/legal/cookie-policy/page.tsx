import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy & Web Trackers | ATSAI Talent Solutions",
  description: "Explanation of essential session cookies, user preferences, and analytics cookies utilized on atsai.pro.",
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Cookie Policy</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs mb-8">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Web Tracking Governance
          </span>
          <h1 className="text-3xl font-extrabold text-[#0b1728] mt-1 tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective Date: 16 October 2026 &bull; Domain: https://atsai.pro
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small alphanumeric files placed on your browser or device when you navigate web services. They enable secure session management, remember search filters, and enhance platform responsiveness.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              2. Categories of Cookies Utilized
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">Strictly Necessary Cookies:</strong> Essential for authentication, CSRF token security, and session maintenance across portal workflows.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">Preference &amp; Functionality Cookies:</strong> Store search filter criteria, saved job bookmarks, and display settings.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">Privacy-First Performance Telemetry:</strong> Anonymized metrics to assess page latency and Core Web Vitals without logging individual candidate identifiers.
              </div>
            </div>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              3. Managing Cookie Preferences
            </h2>
            <p>
              You can configure your browser to decline non-essential cookies. Please note that disabling strictly necessary session cookies may impair portal functionality.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}

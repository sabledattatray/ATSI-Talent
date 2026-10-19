import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export function Footer() {
  const columns = [
    {
      title: "For candidates",
      links: [
        ["Explore jobs", "/jobs"],
        ["Create a profile", "/candidate/signup"],
        ["Your applications", "/candidate/dashboard"],
        ["Career insights", "/blog"],
        ["Interview guides", "/interview-guides"],
      ],
    },
    {
      title: "For hiring teams",
      links: [
        ["Recruitment software", "/services"],
        ["Create company workspace", "/employer/signup"],
        ["Employer sign in", "/employer/login"],
        ["Recruiter workspace", "/recruiter/dashboard"],
      ],
    },
    {
      title: "ATSAI Talent Solutions",
      links: [
        ["About us", "/about"],
        ["Contact", "/contact"],
        ["Help & FAQs", "/faq"],
        ["Privacy notice", "/legal/privacy-policy"],
        ["Terms of use", "/legal/terms-of-use"],
        ["Report a concern", "/report-job"],
      ],
    },
  ];

  return (
    <footer className="bg-[#0e1c30] text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo theme="dark" size="md" />
            <p className="text-xs leading-6 mt-4 max-w-sm text-slate-400">
              ATSAI Talent Solutions
              <br />
              Recruitment Software & HR Technology Solutions.
            </p>
            <p className="text-xs leading-6 mt-2 text-slate-400">
              Connecting opportunities and hiring teams across India.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h2 className="text-xs text-slate-200 font-semibold tracking-wider uppercase">
                {column.title}
              </h2>
              <ul className="space-y-2.5">
                {column.links.map(([name, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors py-0.5"
                    >
                      <span>{name}</span>
                      <ArrowUpRight size={11} className="opacity-70" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Safety & Fee Notice */}
        <div className="flex items-start sm:items-center gap-3 mt-10 py-4 sm:py-5 border-t border-white/10 text-xs text-slate-300">
          <ShieldCheck size={18} className="text-teal-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="m-0 leading-relaxed text-slate-300">
            ATSAI does not charge candidates registration or application fees. Never send money in response to a job offer.
          </p>
        </div>

        {/* Footer Bottom Bar (Fully Responsive on All Mobile Devices) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] sm:text-xs text-slate-400 text-center sm:text-left">
          <span className="leading-normal">
            © 2026 ATSAI Talent Solutions. Created by{" "}
            <a
              href="https://dattasable.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white underline underline-offset-2 decoration-slate-600 hover:decoration-white transition-colors"
            >
              Datta Sable
            </a>
            .
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2">
            <Link
              href="/accessibility"
              className="hover:text-white transition-colors py-1"
            >
              Accessibility
            </Link>
            <span className="hidden sm:inline text-slate-600">·</span>
            <Link
              href="/legal/cookie-policy"
              className="hover:text-white transition-colors py-1"
            >
              Cookies
            </Link>
            <span className="hidden sm:inline text-slate-600">·</span>
            <Link
              href="/privacy-request"
              className="hover:text-white transition-colors py-1"
            >
              Your privacy choices
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


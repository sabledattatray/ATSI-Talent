"use client";

import { BrandLogo } from "@/components/common/BrandLogo";
import { DEMO_MODE } from "@/lib/runtime";
import {
  ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2,
  ChevronDown, CircleHelp, FileText, Layers3,
  LifeBuoy, Menu, ShieldCheck, Sparkles, UserRound, UsersRound, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "./Header.css";

type Panel = "services" | "company" | "workspace";
const services = [
  { title: "Applicant tracking", description: "Manage every application through to decision.", href: "/services", icon: Layers3 },
  { title: "Company workspaces", description: "Bring jobs, people and your hiring team together.", href: "/employers", icon: Building2 },
  { title: "International job board", description: "Explore published roles across industries and countries.", href: "/jobs", icon: BriefcaseBusiness },
  { title: "Candidate profiles", description: "Import your resume and track your next steps.", href: "/candidates", icon: UsersRound },
  { title: "Start hiring", description: "Create a private workspace for your company.", href: "/employer/signup", icon: FileText },
];
const company = [
  { title: "Interview guides", description: "Prepare with role-based questions and a clear plan.", href: "/interview-guides", icon: FileText },
  { title: "About ATSAI", description: "Our approach to thoughtful recruitment.", href: "/about", icon: Building2 },
  { title: "For candidates", description: "Explore your next career move.", href: "/candidates", icon: UserRound },
  { title: "How it works", description: "A clearer path from search to opportunity.", href: "/candidates/how-it-works", icon: BriefcaseBusiness },
  { title: "Help & FAQs", description: "Answers for candidates and employers.", href: "/faq", icon: CircleHelp },
];
const workspaces = [
  { title: "Candidate", description: "Applications, saved jobs and interviews.", href: "/candidate/dashboard", icon: UserRound },
  { title: "Employer", description: "Hiring briefs and candidate shortlists.", href: "/employer/dashboard", icon: Building2 },
  { title: "Recruiter", description: "Pipelines and recruitment workflows.", href: "/recruiter/dashboard", icon: BriefcaseBusiness },
  { title: "Administration", description: "Moderation and platform governance.", href: "/admin/dashboard", icon: ShieldCheck },
];

export function Header() {
  const pathname = usePathname();
  const [candidateSignedIn, setCandidateSignedIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/recruitment/me", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setCandidateSignedIn(Boolean(data?.user)); })
      .catch(() => { if (!controller.signal.aborted) setCandidateSignedIn(false); });
    return () => controller.abort();
  }, [pathname]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ services: true });
  const toggleMobileSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setMobileOpen(false);
    setPanel(null);
  }, [pathname]);

  const root = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<Panel, HTMLButtonElement | null>>>({});
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const header = root.current;
    if (!header) return;
    const updateHeight = () => document.documentElement.style.setProperty("--atsai-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--atsai-header-height");
    };
  }, []);

  function cancelClose() { if (closeTimer.current) clearTimeout(closeTimer.current); }
  function closeAll() { cancelClose(); setPanel(null); setMobileOpen(false); }
  function openPanel(next: Panel) { cancelClose(); setPanel(next); }
  function scheduleClose() { cancelClose(); closeTimer.current = setTimeout(() => setPanel(null), 160); }

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setPanel(null); setMobileOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (panel) triggers.current[panel]?.focus();
      else if (mobileOpen) mobileTrigger.current?.focus();
      setPanel(null); setMobileOpen(false);
    };
    const media = window.matchMedia("(min-width: 1120px)");
    const resize = () => { setPanel(null); setMobileOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    media.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      media.removeEventListener("change", resize);
    };
  }, [panel, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen && !panel) return;
    const measure = () => {
      const header = root.current;
      if (header) header.style.setProperty("--atsai-header-bottom", `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure); };
  }, [mobileOpen, panel]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function trigger(name: Panel, label: string) {
    const active = panel === name;
    return <button type="button" ref={node => { triggers.current[name] = node; }}
      id={`header-${name}-trigger`} aria-expanded={active} aria-controls={`header-${name}-panel`}
      className={`atsai-header-navLink ${active ? "atsai-header-selected" : ""}`}
      onPointerEnter={event => { if (event.pointerType === "mouse" && panel) openPanel(name); }}
      onClick={() => { cancelClose(); setPanel(active ? null : name); }}
      onKeyDown={event => {
        if (event.key === "ArrowDown") {
          event.preventDefault(); openPanel(name);
          requestAnimationFrame(() => document.getElementById(`header-${name}-panel`)?.querySelector<HTMLElement>("a")?.focus());
        }
      }}>
      {label}<ChevronDown size={14} aria-hidden="true" className={active ? "atsai-header-rotated" : ""} />
    </button>;
  }

  function navLink(href: string, label: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return <Link href={href} aria-current={active ? "page" : undefined}
      onPointerEnter={() => setPanel(null)} className={`atsai-header-navLink ${active ? "atsai-header-current" : ""}`}>{label}</Link>;
  }

  const panelItems = panel === "services" ? services : panel === "company" ? company : workspaces;

  return <>
    {(panel || mobileOpen) && (
      <div
        className="atsai-header-backdrop"
        aria-hidden="true"
        onClick={closeAll}
      />
    )}
    <header ref={root} className={"atsai-header-header"}
      onClick={event => { if (event.target instanceof Element && event.target.closest("a")) closeAll(); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeAll(); }}>
      <div className={"atsai-header-utility"}>
        <div className={"atsai-header-utilityInner"}>
          <span className={"atsai-header-utilityMessage"}><ShieldCheck size={13} aria-hidden="true" /> People first. Possibilities ahead.</span>
          <div className={"atsai-header-utilityLinks"}>
            <span className={"atsai-header-feeNote"}>No candidate fees</span>
            <Link href="/verify-recruiter">Verify a recruiter<ArrowUpRight size={11} aria-hidden="true" /></Link>
            <Link href="/contact">Contact our team<ArrowUpRight size={11} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>

      <div className={"atsai-header-main"} onPointerEnter={cancelClose} onPointerLeave={scheduleClose}>
        <div className={"atsai-header-row"}>
          <BrandLogo theme="light" size="md" className="atsai-header-brand" />

          <nav className={"atsai-header-desktopNav"} aria-label="Main navigation">
            {navLink("/jobs", "Find jobs")}
            {navLink("/employers", "For employers")}
            {trigger("services", "Services")}
            {trigger("company", "Company")}
            {navLink("/resources", "Resources")}
          </nav>

          <div className={"atsai-header-actions"}>
            <div className={"atsai-header-workspace"}>{DEMO_MODE ? trigger("workspace", "Workspace") : <Link href={candidateSignedIn ? "/candidate/dashboard" : "/candidate/login"} className={"atsai-header-navLink"}>{candidateSignedIn ? "My workspace" : "Sign in"}</Link>}</div>
            {!candidateSignedIn && <Link href="/candidate/signup" className="atsai-header-navLink atsai-header-register">Register</Link>}<Link href="/employer/dashboard" className={"atsai-header-hireButton"}>Hire talent<ArrowUpRight size={16} aria-hidden="true" /></Link>
            <button
              ref={mobileTrigger}
              className={`atsai-header-mobileToggle ${mobileOpen ? "is-active" : ""}`}
              type="button"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="header-mobile-panel"
              onClick={() => { setPanel(null); setMobileOpen(!mobileOpen); }}
            >
              <span className="atsai-toggle-icon-wrap">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </span>
            </button>
          </div>
        </div>

        {panel && <div id={`header-${panel}-panel`} aria-labelledby={`header-${panel}-trigger`}
          className={"atsai-header-megaMenu"} onPointerEnter={cancelClose} onPointerLeave={scheduleClose}>
          <div className={"atsai-header-megaGrid"}>
            <div className={"atsai-header-feature"}>
              <span className={"atsai-header-eyebrow"}>{panel === "services" ? "OUR EXPERTISE" : panel === "company" ? "THE ATSAI APPROACH" : "EXPLORE THE PLATFORM"}</span>
              <span className={"atsai-header-featureMark"}>{panel === "workspace" ? <Layers3 size={28} /> : <Sparkles size={28} />}</span>
              <h2>{panel === "services" ? <>Connected hiring.<br />Built around people.</> : panel === "company" ? <>Better connections.<br />Brighter futures.</> : <>Your next step.<br />One workspace.</>}</h2>
              <p>{panel === "services" ? "Recruitment software for teams hiring across industries and countries." : panel === "company" ? "Get to know the people-first thinking behind our recruitment approach." : "Preview the experience for each role. These workspaces use sample data in development."}</p>
              <Link href={panel === "services" ? "/services" : panel === "company" ? "/about" : "/admin/login"} className={"atsai-header-featureLink"}>
                {panel === "services" ? "Explore all services" : panel === "company" ? "Discover ATSAI" : "View demo access"}<ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={"atsai-header-menuContent"}>
              <div className={"atsai-header-menuHeading"}><span>{panel === "services" ? "RECRUITMENT SOLUTIONS" : panel === "company" ? "GET TO KNOW US" : "DEVELOPMENT DEMOS"}</span><span className={"atsai-header-menuHint"}>{panel === "workspace" ? "Sample workflows" : "Find your way forward"}</span></div>
              <div className={"atsai-header-menuLinks"}>
                {panelItems.map(item => <Link key={item.href} href={item.href} className={"atsai-header-menuCard"}>
                  <span className={"atsai-header-cardIcon"}><item.icon size={20} strokeWidth={1.65} aria-hidden="true" /></span>
                  <span><strong>{item.title}</strong><span className={"atsai-header-cardDescription"}>{item.description}</span></span>
                  <ArrowUpRight size={16} aria-hidden="true" className={"atsai-header-cardArrow"} />
                </Link>)}
              </div>
              <div className={"atsai-header-menuFooter"}>
                <span><LifeBuoy size={15} aria-hidden="true" /> Not sure where to start?</span>
                <Link href="/contact">Let’s talk<ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>}
      </div>

      {mobileOpen && (
        <nav
          id="header-mobile-panel"
          aria-label="Mobile navigation"
          className="atsai-header-mobilePanel"
        >
          <div className="atsai-mobile-panel-inner">
            {/* Top Hero Cards */}
            <div className="atsai-mobile-hero-grid">
              <Link href="/jobs" className="atsai-mobile-hero-card atsai-hero-jobs">
                <div className="atsai-hero-top">
                  <div className="atsai-hero-icon atsai-icon-blue">
                    <BriefcaseBusiness size={18} strokeWidth={2} />
                  </div>
                  <span className="atsai-hero-pill">Live roles</span>
                </div>
                <div className="atsai-hero-title">Find Jobs</div>
                <p className="atsai-hero-sub">Explore openings across India</p>
              </Link>

              <Link href="/employers" className="atsai-mobile-hero-card atsai-hero-employers">
                <div className="atsai-hero-top">
                  <div className="atsai-hero-icon atsai-icon-indigo">
                    <Building2 size={18} strokeWidth={2} />
                  </div>
                  <span className="atsai-hero-pill">Hiring</span>
                </div>
                <div className="atsai-hero-title">For Employers</div>
                <p className="atsai-hero-sub">Workspaces & talent pipelines</p>
              </Link>
            </div>

            {/* Expandable Accordion: Recruitment Services */}
            <div className="atsai-mobile-accordion">
              <button
                type="button"
                className="atsai-mobile-accordion-trigger"
                onClick={() => toggleMobileSection("services")}
                aria-expanded={Boolean(openSections.services)}
              >
                <span className="atsai-accordion-label">
                  <Layers3 size={16} className="text-blue-600" />
                  <span>Recruitment Solutions</span>
                </span>
                <div className="atsai-accordion-meta">
                  <span className="atsai-accordion-badge">{services.length} services</span>
                  <ChevronDown
                    size={16}
                    className={`atsai-mobile-chevron ${openSections.services ? "is-open" : ""}`}
                  />
                </div>
              </button>
              <div className={`atsai-mobile-accordion-body ${openSections.services ? "is-open" : ""}`}>
                <div className="atsai-mobile-accordion-inner">
                  <div className="atsai-mobile-links-list">
                    {services.map((item) => (
                      <Link key={item.href} href={item.href} className="atsai-mobile-link-card">
                        <div className="atsai-link-icon-box atsai-icon-blue">
                          <item.icon size={16} strokeWidth={1.8} />
                        </div>
                        <div className="atsai-link-text">
                          <div className="atsai-link-title">{item.title}</div>
                          <div className="atsai-link-desc">{item.description}</div>
                        </div>
                        <ArrowUpRight size={14} className="atsai-link-arrow" />
                      </Link>
                    ))}
                    <Link href="/services" className="atsai-mobile-view-all">
                      <span>Explore all services & features</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Accordion: Company */}
            <div className="atsai-mobile-accordion">
              <button
                type="button"
                className="atsai-mobile-accordion-trigger"
                onClick={() => toggleMobileSection("company")}
                aria-expanded={Boolean(openSections.company)}
              >
                <span className="atsai-accordion-label">
                  <Building2 size={16} className="text-slate-600" />
                  <span>Company & Values</span>
                </span>
                <div className="atsai-accordion-meta">
                  <span className="atsai-accordion-badge">About ATSAI</span>
                  <ChevronDown
                    size={16}
                    className={`atsai-mobile-chevron ${openSections.company ? "is-open" : ""}`}
                  />
                </div>
              </button>
              <div className={`atsai-mobile-accordion-body ${openSections.company ? "is-open" : ""}`}>
                <div className="atsai-mobile-accordion-inner">
                  <div className="atsai-mobile-links-list">
                    {company.map((item) => (
                      <Link key={item.href} href={item.href} className="atsai-mobile-link-card">
                        <div className="atsai-link-icon-box atsai-icon-slate">
                          <item.icon size={16} strokeWidth={1.8} />
                        </div>
                        <div className="atsai-link-text">
                          <div className="atsai-link-title">{item.title}</div>
                          <div className="atsai-link-desc">{item.description}</div>
                        </div>
                        <ArrowUpRight size={14} className="atsai-link-arrow" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Accordion: Demo Workspaces (if DEMO_MODE) */}
            {DEMO_MODE && (
              <div className="atsai-mobile-accordion">
                <button
                  type="button"
                  className="atsai-mobile-accordion-trigger"
                  onClick={() => toggleMobileSection("workspaces")}
                  aria-expanded={Boolean(openSections.workspaces)}
                >
                  <span className="atsai-accordion-label">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Platform Workspaces</span>
                  </span>
                  <div className="atsai-accordion-meta">
                    <span className="atsai-accordion-badge atsai-badge-demo">Demo</span>
                    <ChevronDown
                      size={16}
                      className={`atsai-mobile-chevron ${openSections.workspaces ? "is-open" : ""}`}
                    />
                  </div>
                </button>
                <div className={`atsai-mobile-accordion-body ${openSections.workspaces ? "is-open" : ""}`}>
                  <div className="atsai-mobile-accordion-inner">
                    <div className="atsai-mobile-links-list">
                      {workspaces.map((item) => (
                        <Link key={item.href} href={item.href} className="atsai-mobile-link-card">
                          <div className="atsai-link-icon-box atsai-icon-amber">
                            <item.icon size={16} strokeWidth={1.8} />
                          </div>
                          <div className="atsai-link-text">
                            <div className="atsai-link-title-row">
                              <span className="atsai-link-title">{item.title} Workspace</span>
                              <span className="atsai-demo-tag">Sample</span>
                            </div>
                            <div className="atsai-link-desc">{item.description}</div>
                          </div>
                          <ArrowUpRight size={14} className="atsai-link-arrow" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links: Blog & Contact */}
            <div className="atsai-mobile-quick-grid">
              <Link href="/blog" className="atsai-mobile-quick-btn">
                <FileText size={15} />
                <span>Career Insights</span>
              </Link>
              <Link href="/contact" className="atsai-mobile-quick-btn">
                <LifeBuoy size={15} />
                <span>Contact Support</span>
              </Link>
            </div>

            {/* Authentication / User Profile Card */}
            <div className="atsai-mobile-auth-box">
              {candidateSignedIn ? (
                <div className="atsai-mobile-signed-card">
                  <div className="atsai-signed-header">
                    <span className="atsai-signed-dot" />
                    <span className="atsai-signed-title">Candidate Workspace Active</span>
                  </div>
                  <Link href="/candidate/dashboard" className="atsai-mobile-btn-primary">
                    <span>Open My Workspace</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <div className="atsai-mobile-cta-group">
                  <Link href="/candidate/signup" className="atsai-mobile-btn-primary">
                    <Sparkles size={15} />
                    <span>Create Free Candidate Account</span>
                  </Link>
                  <Link href="/candidate/login" className="atsai-mobile-btn-secondary">
                    <span>Candidate Sign In</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* Trust & Recruiter Verification Bar */}
            <div className="atsai-mobile-trust-bar">
              <Link href="/verify-recruiter" className="atsai-trust-link">
                <ShieldCheck size={16} className="text-teal-600" />
                <span>Verify an authorized recruiter</span>
                <ArrowUpRight size={12} className="opacity-60" />
              </Link>
              <p className="atsai-trust-fee">No candidate registration fees · Verified employers</p>
            </div>
          </div>
        </nav>
      )}
    </header>
  </>;
}

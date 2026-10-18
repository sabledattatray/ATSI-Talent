======================================================================
ATSAI TALENT SOLUTIONS
MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
Recruitment Agency + Jobs Marketplace + Applicant Tracking System (ATS)
======================================================================

Domain            : https://atsai.pro
Document ID       : ATSAI-PRD-MASTER
Version           : 3.0 (supersedes v2.0 dated 16 October 2026)
Date              : 16 October 2026
Status            : Draft for stakeholder review. Implementation blueprint,
                    subject to legal, commercial and security approval.
Classification    : Internal - Confidential
Primary Audience  : Product, Engineering, Design, QA, Legal/Compliance,
                    Operations, Executive Sponsors

----------------------------------------------------------------------
DOCUMENT CONTROL
----------------------------------------------------------------------
Owner             : Product Lead (to be named)
Approvers         : Executive Sponsor, Legal Counsel (India-qualified),
                    Engineering Lead, Security Lead, Operations Lead
Reviewers         : Design Lead, QA Lead, Head of Recruitment
Review cadence    : At the end of every phase (P0-P5) and on any scope change
Change control    : All changes go through a numbered change request, are
                    logged in the Revision History, and re-approved if they
                    alter scope, legal posture, data handling or budget.

Revision History
  v1.0  Initial draft
  v2.0  16 Oct 2026  Master PRD, implementation blueprint
  v3.0  16 Oct 2026  Restructured into a formal PRD: added executive
                     summary, problem statement, personas, scope boundaries,
                     requirement IDs with priorities, measurable NFRs, state
                     machines, risk register, RACI, glossary and traceability;
                     resolved internal inconsistencies (see Appendix B);
                     reframed implementation-agent directives as engineering
                     principles.

----------------------------------------------------------------------
TABLE OF CONTENTS
----------------------------------------------------------------------
 1. Executive Summary
 2. Problem Statement, Vision and Objectives
 3. Scope Definition (MVP, Later, Out of Scope)
 4. Users and Personas
 5. Assumptions, Constraints and Dependencies
 6. Brand and Product Strategy
 7. Visual Design System
 8. Public Website Requirements
 9. Authentication and Account Lifecycle
10. Candidate Portal
11. Employer Portal
12. Recruiter ATS (Internal)
13. Super Admin, Operations and CMS
14. Critical End-to-End Journeys and State Machines
15. Data Model (PostgreSQL)
16. API and Backend Contract
17. Technology Stack and Architecture
18. Non-Functional Requirements
19. Responsive and Accessibility Specification
20. Trust, Fraud Prevention and Moderation
21. Privacy, Security and Compliance
22. AI Governance
23. SEO, Content and Analytics
24. Emails, Notifications and Copy Standards
25. Operations, Reliability and Support
26. Testing Strategy and Acceptance Criteria
27. Roadmap, Phases and Release Criteria
28. Engineering Work Breakdown and Deliverables
29. Definition of Done
30. Engineering Principles and Non-Negotiables
31. Risk Register
32. Open Decisions and Owners
33. Roles and Responsibilities (RACI)
34. Glossary
35. References
Appendix A. Requirement Priority Key
Appendix B. Summary of Improvements from v2.0

Priority key used throughout: [M] Must (MVP), [S] Should, [C] Could,
[F] Future (post-MVP). See Appendix A.

======================================================================
1. EXECUTIVE SUMMARY
======================================================================
ATSAI Talent Solutions is a new, greenfield platform that combines three
capabilities, in this order of priority:

  1. A trustworthy recruitment consultancy website and service operation
     that converts employer inquiries into signed hiring mandates.
  2. A high-quality jobs marketplace where candidates find and apply for
     genuine, human-reviewed vacancies.
  3. An AI-assisted Applicant Tracking System (ATS) that lets recruiters
     manage the full cycle from requisition to placement, with candidate
     consent and privacy built in.

The platform launches in India, with location, currency, time zone and
compliance models designed to be configurable for expansion. Its
architecture exposes reusable API and domain services so that iOS and
Android apps can be built later without re-platforming.

The product is built on a single credibility principle: nothing is
presented to the public unless it is real, evidenced and approved. No
fabricated employers, vacancies, testimonials, metrics, licenses,
addresses, partnerships or certifications will appear in production.

This document is a specification, not a statement that functionality
already exists. Any integration not yet available must be disabled or
hidden, never simulated.

Greenfield statement: ATSAI is built from scratch. No code, content,
design or data from any site previously or currently hosted on atsai.pro
is migrated, reused or visually imitated. The existing deployment is
treated as unrelated, and production is not overwritten until explicit
release approval and a verified backup exist.

======================================================================
2. PROBLEM STATEMENT, VISION AND OBJECTIVES
======================================================================
2.1 Problem Statement
- Candidates face fake or stale listings, application fees, opaque
  employer identities, and poor visibility into application status.
- Employers face noisy applicant pools, slow shortlisting, and limited
  trust in unfamiliar recruitment vendors.
- Small recruitment agencies run on spreadsheets and email, with weak
  consent tracking, audit trails and measurement.

2.2 Vision
The most trusted specialist recruitment platform in its launch segments,
known for verified employers, transparent job details, respect for
candidate privacy and measurable hiring outcomes.

Brand promise: "Connecting Talent. Empowering Careers."

2.3 Business Goals
G1. Launch a credible public agency website.
G2. Convert employer inquiries into qualified, signed mandates.
G3. Let candidates discover and apply for genuine jobs end to end.
G4. Enable recruiters to manage hiring from requisition to placement.
G5. Create API and domain services reusable by future mobile apps.

2.4 North-Star Metric
Qualified placements with documented candidate consent and documented
employer approval.

2.5 Key Performance Indicators (targets to be baselined after launch;
    no target is to be published externally without evidence)
- Supply: verified active jobs; share of jobs re-confirmed on schedule.
- Demand: organic qualified applicants; application completion rate.
- Employer funnel: employer leads, lead-to-mandate conversion, signed
  mandates.
- Delivery: time to shortlist, time to fill, interview-to-offer rate,
  placement count and placement revenue.
- Satisfaction: candidate satisfaction, employer satisfaction (survey).
- Trust: spam/fraud reports per 1,000 listings, median takedown time.
- Quality: WCAG conformance, Core Web Vitals at p75.

2.6 Non-Goals at MVP
- Fully autonomous hiring decisions.
- Fake inventory to fill empty states.
- Scraping personal data from public sources.
- Selling or sharing applicant information for unrelated purposes.
- Speculative AI ranking without governance.
- Guaranteed placement promises.
- Payroll, and contract-staffing compliance, until separately scoped.

======================================================================
3. SCOPE DEFINITION
======================================================================
3.1 MVP (Phases P0-P2) [M]
- Public site: home, services, about, employers, contact, legal pages,
  FAQ, resources (initial editorial set).
- Jobs directory and job detail pages with real, moderated listings.
- Candidate application flow (resume upload, consent, confirmation,
  reference ID, notification, withdrawal).
- Employer lead form and hiring brief, with manual verification.
- Admin moderation, CMS basics, audit log, privacy-request handling.
- Recruiter ATS core: mandates, candidate CRM with consent, pipelines,
  employer submissions, interviews, placements, invoice triggers.
- SEO foundations, accessibility baseline, security baseline, backups.

3.2 Post-MVP (Phases P3-P4) [S]/[C]
- Candidate and employer self-service dashboards, saved jobs and alerts,
  employer self-posting with approval, messaging, analytics, privacy
  center, subscriptions, advanced search, explainable recommendations,
  multilingual support, third-party integrations.

3.3 Future (Phase P5) [F]
- Expo/React Native candidate app, then employer app; push notifications,
  deep linking, store launch.

3.4 Out of Scope (until separately approved)
- Payroll processing; background-check vendor integration; video
  interviewing hosting; overseas placement operations; candidate-paid
  products of any kind.

3.5 MVP Cut-Line Note
The v2.0 plan placed a large surface (portals, CRM, billing) in a
10-week window. v3.0 defines P1 as the minimum credible public launch and
P2 as the operational ATS. Self-service portals are not required for
launch; recruiters operate on behalf of employers until P3.

======================================================================
4. USERS AND PERSONAS
======================================================================
P-01 Candidate (job seeker)
  Goal: find a genuine job, apply quickly, know the status, keep data
  private. Pain: scams, fees, silence after applying.
  Needs: clear job details, safe application, transparent status, easy
  withdrawal and deletion.

P-02 Employer / Hiring Manager
  Goal: get a vetted shortlist quickly without exposing the brief
  publicly. Pain: low-quality applicants, vendor risk.
  Needs: identity-verified onboarding, clear process, confidentiality
  option, visibility of progress.

P-03 Recruiter (internal)
  Goal: run mandates efficiently with compliant candidate handling.
  Needs: pipeline views, consent status, scheduling, templates, audit.

P-04 Administrator / Operations
  Goal: keep the marketplace safe and accurate.
  Needs: moderation queues, takedown, user and role management, reports.

P-05 Content Editor
  Goal: publish approved, original content with SEO control.

P-06 Support / Compliance Officer
  Goal: handle abuse reports, privacy requests and grievances within
  defined SLAs, with evidence and audit trails.

======================================================================
5. ASSUMPTIONS, CONSTRAINTS AND DEPENDENCIES
======================================================================
5.1 Assumptions
- A. Legal entity, trading name and trademark will be confirmed before
     go-live; "ATSAI Talent Solutions" is provisional.
- B. First verified job inventory will be supplied by signed employer
  mandates; the site never launches with invented jobs.
- C. Launch market is India; English is the launch language.
- D. Employers pay for recruitment mandates; candidates never pay.
- E. A named support and grievance contact will exist at launch.

5.2 Constraints
- Legal review by India-qualified counsel is a hard gate for all legal
  text, privacy notices and the recruitment services agreement.
- Budget, team size and vendor selection are pending (Section 32).
- Timelines are planning estimates and are re-estimated after staffing.

5.3 Dependencies
- Legal and brand clearance (P0). Hosting, DB, email, file-scanning and
  authentication vendor selection after security and cost review.
- Employer verification standard and commercial agreement approved.
- Verified business address, official business email and domain DNS
  control (SPF, DKIM, DMARC).

======================================================================
6. BRAND AND PRODUCT STRATEGY
======================================================================
- Name: ATSAI Talent Solutions (provisional; verify MCA registration and
  trademark before formal adoption). Public product: ATSAI.
- Positioning: trustworthy recruitment consultancy first, quality hiring
  marketplace second, AI-assisted ATS third.
- Initial specialties: MIS, analytics, Power BI, SQL, IT, finance,
  operations, BFSI; taxonomy extensible to all sectors.
- Geography: India first. Location, currency (default INR with Indian
  digit grouping), time zone and compliance model are configurable.
- Monetization: employer-paid recruitment mandates; optional employer
  subscriptions later. Candidates are never charged to apply or for
  placement.
- Differentiators: human-reviewed opportunities, transparent job
  details, verified employer identities, candidate privacy, responsive
  service, measurable workflows.
- Voice: confident, clear, human, warm, formal but not stiff. No
  exaggerated claims; no manufactured urgency.
- Public claim policy: every numeric claim, badge, logo, certification,
  testimonial and partner statement requires documented evidence and
  written publication approval, recorded in a claims register.

======================================================================
7. VISUAL DESIGN SYSTEM
======================================================================
7.1 Color Tokens
  navy-950  #0B1728  Headlines, dark hero
  navy-900  #142338  Primary brand
  navy-800  #1D3553  Secondary surfaces
  blue-600  #2563EB  Primary actions, links
  blue-700  #1D4ED8  Hover
  teal-700  #0F766E  Positive accent (restrained)
  white     #FFFFFF  Cards
  slate-50  #F8FAFC  Page background
  slate-100 #F1F5F9  Muted surfaces
  slate-200 #E2E8F0  Borders
  slate-500 #64748B  Secondary text (see contrast rule below)
  slate-900 #0F172A  Body text
  amber-700 #B45309  Caution
  red-700   #B91C1C  Errors

Contrast rules (WCAG 2.2 AA): 4.5:1 body text, 3:1 large text and UI
boundaries. slate-500 on white passes; on slate-100 or darker surfaces it
may fail and must be verified per pairing or replaced with slate-600.
Every color token pairing is validated in an automated contrast test.
Status is never conveyed by color alone.

Style limits: no large gradients, neon, glassmorphism, cluttered badges,
fake social proof or dark patterns. Navy/blue accent is used in hero and
primary CTA only.

7.2 Typography
- Inter (UI/body) and Plus Jakarta Sans (headings), self-hosted via
  next/font; system sans-serif fallback.
- H1: 52/60 desktop, 42/50 tablet, 34/42 mobile, semibold, slightly
  negative letter spacing. H2: 36/44 desktop, 28/36 mobile.
  Body 16/26. Labels 14/20. No meaningful text below 12px.

7.3 Layout
- 12-column grid; max content width 1200-1280px; gutters 24/20/16px
  (desktop/tablet/mobile); 8px spacing scale.
- Section spacing 72-96px desktop, 48-64px mobile.
- Card radius 12-16px; button radius 10-12px; subtle shadows; 1px
  slate-200 borders. Minimum tap target 44x44px. Visible focus outlines.
  No sticky overlays that hide content.

7.4 Iconography and Imagery
- Lucide React icons, consistent 20/24px stroke; no emoji in production
  UI.
- Imagery: authentic, licensed workplace photography with consent and
  alt text. Stock or illustrative images are never labeled as staff,
  clients or candidates.

7.5 Header and Footer
- Header: white, sticky, subtle bottom border; wordmark left; nav: Jobs,
  For Employers, Services, About, Resources, Contact; right: Login and
  Post a Requirement. Mobile: accessible menu with explicit close control.
- Footer: full site links, legal links, verified business details,
  contact, social links, copyright.

7.6 Motion
120-220ms transitions; honor prefers-reduced-motion; no parallax and no
autoplay carousels.

7.7 Component Library
Buttons (primary, secondary, ghost, destructive); input; combobox;
searchable select; textarea; checkbox; radio; date picker; salary range
control; file upload; breadcrumbs; tabs; pagination; dialogs; drawers;
alerts; toasts; skeletons; empty and error states; tables; filter chips;
cards; timelines; status badges (meaningful statuses only); charts; audit
timeline.

7.8 Design Deliverables
Figma variables and tokens; responsive layouts for every page template;
light mode first (dark mode only after AA audit); Storybook with visual
regression tests; design token reference document.

======================================================================
8. PUBLIC WEBSITE REQUIREMENTS
======================================================================
Global requirements for every public page [M]:
- Clear title, purpose and primary CTA.
- Loading, empty and error states.
- Full keyboard navigation and screen-reader support.
- Unique SEO metadata; responsive layout.
- No dead links, dummy CTAs or placeholder content.

8.1 Home (/) [M]
FR-PUB-001 Hero headline "The Right Talent. The Right Opportunity." with
  a subheading describing real recruitment services and two CTAs: "Find
  Jobs" and "Hire Talent". (Alternate approved copy: "Hire with
  Confidence. Grow with Opportunity." - one headline is chosen at design
  sign-off and used consistently; see Appendix B.)
FR-PUB-002 Prominent job search (role/keyword, location, work mode) with
  validated autocomplete.
FR-PUB-003 Sections: specialization cards, employer and candidate
  process, latest verified openings (real data only), recruitment
  solutions, editorial insights, employer inquiry CTA, FAQs, contact.
FR-PUB-004 Trust section contains only evidence-backed claims. Until
  evidence exists, use process commitments rather than statistics.
FR-PUB-005 If zero jobs exist, show an honest "New opportunities coming
  soon" message with a talent-community registration that uses separate,
  unbundled consent. No empty or placeholder job cards.

8.2 Jobs Directory (/jobs) - highest priority [M]
FR-JOB-001 Heading "Explore Career Opportunities", descriptive intro,
  search row, desktop filter sidebar, mobile bottom-sheet filter drawer,
  results count, sort control, save-search control (save-search [S]).
FR-JOB-002 Filters: keyword, role, city/state/country, remote/hybrid/
  on-site, experience min/max, salary range and currency, category/
  industry, employment type, posted date, employer (if disclosed),
  skills, education, shift, accessibility accommodations where
  appropriate.
FR-JOB-003 Search behavior: URL query parameters persisted; debounced
  input; server-side validation; clear-all; removable filter chips;
  default relevance sort plus latest and compensation sort; pagination or
  accessible load-more; canonical and noindex rules for filter
  combinations.
FR-JOB-004 Job card shows: real title; company name or "Confidential
  Employer"; verification badge only if verified; location; mode;
  employment type; experience; salary if disclosed; posted date;
  reference ID; key skills; short description; View Details and Save
  actions. No unsubstantiated "urgent" labels.
FR-JOB-005 Mobile: single-column cards; filter button with active count;
  no horizontal scroll; long titles wrap; any fixed CTA must not obscure
  content.
FR-JOB-006 Empty results: explain no matches, offer reset of filters,
  never show unrelated or fake openings.
FR-JOB-007 Only approved, published, unexpired, publication-consented
  jobs are returned. No applicant PII is ever exposed.

8.3 Job Detail (/jobs/[slug]) [M]
FR-JD-001 Immutable job ID plus editable SEO slug; 301 redirects on slug
  change.
FR-JD-002 Content: title; employer or confidential; company summary if
  authorized; location; work mode; salary and benefits if disclosed;
  experience; job type; posted and closing dates; skills;
  responsibilities; qualifications; selection process; accessibility
  contact; recruiter contact channel (never a personal number by
  default); report-listing action.
FR-JD-003 Structured sections; sticky desktop application panel; mobile
  Apply CTA; progress indicator and estimated completion time based on
  measured workflow.
FR-JD-004 Related jobs are real and relevant only. Actions: save, share,
  print, report, apply. Anonymous browsing always allowed; application
  login policy is a pending decision (Section 32) and the UI must state
  clearly whether login is required.
FR-JD-005 Closed or expired jobs: show archived details where
  appropriate, disable applying, remove active JobPosting markup, offer
  related jobs.
FR-JD-006 Scam notice displayed on every job: "ATSAI does not charge
  candidates to apply for jobs. Report any payment request claiming to
  represent us." with a link to /report-job and /verify-recruiter.
FR-JD-007 Application form: resume (PDF/DOCX) with validation; candidate
  details; eligibility questions; role-specific consent; optional cover
  note; optional profile import; preview and confirm; success page with
  reference ID plus notification. Form data is preserved on recoverable
  failure; retry never creates a duplicate submission (idempotency).

8.4 Employer Landing (/employers) [M]
FR-EMP-001 Corporate value proposition, service categories,
  specializations, recruitment process, service-level expectations (not
  guarantees), engagement model, FAQs, inquiry CTA.
FR-EMP-002 No client logos without written permission.
FR-EMP-003 Lead form: company name, authorized contact, business email,
  roles, locations, hiring volume, employment type, timeline, message,
  privacy consent, anti-spam control. Shows acknowledgment and internal
  lead ID. Free-mail addresses are flagged for manual review.

8.5 Hiring Brief (/employers/request-talent) [M]
FR-BRF-001 Multi-step form: company verification; job title; department;
  reporting line; location and work mode; compensation range and
  currency; headcount; skills; qualifications; seniority; timeline;
  hiring stages; interview panel; contract type; work authorization;
  contact; terms acknowledgment.
FR-BRF-002 Draft saving when authenticated [S]; server-side validation;
  preview; acknowledgment on submission. A brief never publishes a job
  automatically.

8.6 Services (/services and detail pages)
Pages: permanent-recruitment [M]; it-and-data-recruitment [M];
bfsi-and-finance-recruitment [M]; executive-search [S];
contract-staffing (only when legally and operationally supported) [F];
recruitment-process-outsourcing [F].
Each page: who it serves, methodology, typical roles, timeline
considerations, deliverables, inquiry CTA, FAQ, accurate terms.

8.7 Candidate Marketing, Company and Resource Pages
- Candidates: /candidates, /candidates/how-it-works,
  /candidates/career-advice [M/S].
- Industries and locations: /industries, /industries/[slug],
  /locations, /locations/[slug] - published only when original, useful
  content exists [S].
- Company: /about, /about/our-process, /about/why-atsai,
  /about/leadership (real team only, with consent) [M/S].
- Support: /contact, /faq [M].
- Content: /resources, /resources/[slug], /resources/category/[slug] [S].
- /success-stories/[slug] only with consent and evidence [F].
- Trust utilities: /report-job, /verify-recruiter, /accessibility,
  /security [M]; /status [S].
- Technical: /search (sitewide, noindex policy), /sitemap.xml,
  /robots.txt, /manifest.webmanifest, /404, /500, maintenance page [M].

8.8 Legal and Trust Pages [M] (legal review mandatory before publication)
- /legal/privacy-policy: data categories, purposes, lawful basis or
  consent, processors, retention, user rights, contact, cross-border
  transfers, children and minors, breach contact.
- /legal/terms-of-use; /legal/candidate-terms; /legal/employer-terms.
- /legal/recruitment-services-agreement: separately executed B2B
  template: fee triggers, invoicing, replacement/refund conditions,
  candidate ownership, confidentiality, termination, disputes.
- /legal/cookie-policy plus cookie settings; non-essential cookies are
  inactive until consent where required.
- /legal/data-retention, /legal/acceptable-use, /legal/anti-fraud,
  /legal/grievance-redressal, /legal/disclaimer, /legal/ai-transparency,
  /legal/accessibility-statement.
- Each document shows version, effective date, change log, legal entity
  and contact; consent evidence is recorded. Documents are drafted for
  review and never presented as final or as legal advice until counsel
  signs off.

======================================================================
9. AUTHENTICATION AND ACCOUNT LIFECYCLE
======================================================================
Routes: /login, /register, /register/candidate, /register/employer,
/forgot-password, /reset-password, /verify-email, /auth/callback,
/account/locked, /account/delete, /consent/preferences.

FR-AUTH-001 [M] Email verification before account activation.
FR-AUTH-002 [M] Password-reset responses never reveal whether an account
  exists; reset links are single-use and time-limited.
FR-AUTH-003 [M] MFA mandatory for all staff roles (recruiter, admin,
  editor, support). MFA required for employer owner/admin roles and
  strongly offered to all other users.
FR-AUTH-004 [M] Secure httpOnly session cookies, session rotation on
  privilege change, configurable idle and absolute expiry.
FR-AUTH-005 [S] Device and session management; "log out of all devices".
FR-AUTH-006 [M] Brute-force protection: rate limiting, progressive
  delays, account lock with secure recovery.
FR-AUTH-007 [M] Account deletion flow routed through the privacy-request
  process (Journey J5).
FR-AUTH-008 [S] Accessible authentication: no cognitive-test-only
  challenges; password managers and paste permitted (WCAG 2.2).

======================================================================
10. CANDIDATE PORTAL (AUTHENTICATED) - Phase P3 unless marked
======================================================================
Routes: /candidate/dashboard, /profile, /resumes, /applications,
/applications/[id], /saved-jobs, /job-alerts, /interviews, /messages,
/notifications, /settings, /privacy, /support.

FR-CAN-001 Dashboard: next steps, active applications, interview
  schedule, saved jobs, explainable and opt-out recommendations, profile
  completeness. No manipulative progress pressure.
FR-CAN-002 Profile: name, contact, location, work preferences,
  experience, education, skills, certifications, portfolio links, notice
  period, optional salary expectation, work authorization where lawful.
  Field-level visibility; explicit consent before any sharing with an
  employer.
FR-CAN-003 [M at P1 for guest apply; full management P3] Resume: multiple
  versions, labels, preview, default designation, malware scan and
  validation, private encrypted storage, deletion and retention rules,
  never publicly indexed.
FR-CAN-004 Application statuses visible to candidates: Draft, Submitted,
  Under Review, Shortlisted, Interview, Offer, Hired, Rejected,
  Withdrawn. Recruiter-only internal statuses are hidden. Notifications
  are sent only when a status truly changes.
FR-CAN-005 Saved jobs and alerts: opt-in, frequency control,
  unsubscribe, de-duplication.
FR-CAN-006 Interviews: time-zone aware; reschedule and cancel;
  accessibility accommodation requests; no exposure of panelist PII.
FR-CAN-007 Privacy center: download data, consent history, withdraw
  consent, request deletion, notification controls, account closure and
  request status.

======================================================================
11. EMPLOYER PORTAL - Phase P3 unless marked
======================================================================
Routes: /employer/dashboard, /company, /verification, /jobs, /jobs/new,
/jobs/[id]/edit, /candidates, /pipeline, /interviews, /messages, /team,
/analytics, /contracts, /invoices, /settings, /support.

FR-ER-001 [M at P2, operator-assisted] Onboarding: registered entity
  name, website, business email, authorized representative, business
  details, evidence upload, manual verification, verified status with
  date, appeal path. Domain/email verification to prevent impersonation.
FR-ER-002 Team RBAC: owner, admin, hiring manager, interviewer, billing.
  Invitations expire; scoped visibility; audit log.
FR-ER-003 Job lifecycle: Draft > Submitted > In Review > Approved >
  Published > Paused > (Filled | Closed | Expired | Rejected). Mandatory
  fields and an approval gate before publication.
FR-ER-004 Candidate access limited to candidates shared for that
  employer's approved role with valid consent; time-limited signed
  resume links; no bulk export by default.
FR-ER-005 Pipeline: stage moves, interview feedback, decision rationale,
  offer outcomes, activity log, filters. Avoid recording protected
  characteristics unnecessarily.
FR-ER-006 Reporting: job views, applicant sources, screening progression,
  time-to-hire, placements; suppress small-group sensitive analytics.
FR-ER-007 Billing: mandates, signed contracts, placement trigger,
  invoices, tax settings, payment status. No fabricated payments and no
  automatic fee calculation without a configured agreement.

======================================================================
12. RECRUITER ATS (INTERNAL)
======================================================================
Routes: /recruiter/dashboard, /requisitions, /talent-pool,
/candidates/[id], /pipelines, /submissions, /interviews, /placements,
/tasks, /communications, /reports.

FR-REC-001 [M] Requisitions: employer mandate, owner, SLA, priority, fee
  model, hiring criteria, approval, expiry, source, attachments.
FR-REC-002 [M] Candidate CRM: consent status, provenance/source, resume
  versions, de-duplication, tags, recruiter notes, engagement history,
  access-request and erasure handling.
FR-REC-003 [M] Workflow: Source > Contact > Consent > Screen > Shortlist
  > Employer Submission > Interview > Offer > Placement > Post-placement
  follow-up. Every transition is audited; workflows are configurable per
  mandate.
FR-REC-004 [M] Employer submission requires role-specific consent and
  records the exact disclosure event (what, to whom, when, by whom).
FR-REC-005 [S] Scheduling: opt-in calendar integrations, availability,
  time zones, feedback forms, conflict detection, reminders,
  rescheduling.
FR-REC-006 [M] Placements: offer acceptance, start date, invoice
  eligibility, replacement window, payment tracking.
FR-REC-007 [F] AI assist behind a feature flag (see Section 22).

======================================================================
13. SUPER ADMIN, OPERATIONS AND CMS
======================================================================
Routes: /admin/dashboard, /users, /roles, /employers, /verifications,
/jobs, /applications, /recruiters, /mandates, /placements, /billing,
/leads, /content, /media, /seo, /taxonomies, /notifications,
/templates, /feature-flags, /audit, /security, /privacy-requests,
/reports, /integrations, /settings.

FR-ADM-001 [M] Four-eyes review for employer verification and for
  high-risk job publication.
FR-ADM-002 [M] Moderation queue, abuse reports, account suspension with
  appeal path, emergency job takedown, legal hold, role management,
  rate-limit control.
FR-ADM-003 [M] Data export and erasure tooling tied to privacy requests.
FR-ADM-004 [M] CMS: draft > review > schedule > publish > unpublish,
  revision history, canonical/meta/social image, media alt text,
  redirects, author attribution, approval and preview. CMS roles cannot
  bypass authorization.
FR-ADM-005 [S] Analytics: business funnel, recruiting funnel, sources,
  consent, fraud, uptime; role-scoped and privacy-preserving.
FR-ADM-006 [M] Append-only audit log for permission changes, job
  approvals, candidate disclosures, data exports, consent updates,
  invoice events and admin actions; restricted access; defined
  retention.

======================================================================
14. CRITICAL END-TO-END JOURNEYS AND STATE MACHINES
======================================================================
14.1 Journeys
J1  Candidate: search > filter > read real job > upload resume > give
    role-specific consent > submit > receive reference ID > track status
    > withdraw (optional).
J2  Employer: inquiry > identity verified > commercial terms agreed >
    hiring brief submitted > internal review > real job published >
    shortlist delivered > interview > hire > invoice.
J3  Recruiter: receive mandate > source candidate > obtain role-specific
    consent > screen > share shortlist > track interviews > record
    offer/placement.
J4  Fraud report: report > ticket > triage > temporary suppression if
    high risk > evidence review > decision > notify parties > appeal.
J5  Deletion: candidate requests deletion > verify requester > check
    legal holds > revoke access > erase or anonymize per policy >
    confirmation and audit entry.
J6  Expiry: job expires > removed from listings and structured data >
    applications stopped > affected users notified where appropriate >
    archived.

Each journey requires acceptance tests for: success, cancellation,
network failure, duplicate submission, invalid data, session expiry and
accessibility.

14.2 State Machines (enforced server-side; illegal transitions rejected
     and logged)
Job:
  Draft > Submitted > In Review > Approved > Published
  Published > Paused > Published
  Published > Filled | Closed | Expired
  In Review > Rejected (with reason) > Draft (after edits)
  Any state > Taken Down (emergency, admin only, audited)
Application:
  Draft > Submitted > Under Review > Shortlisted > Interview > Offer >
  Hired
  Any pre-Hired state > Rejected | Withdrawn
  (Candidate-visible labels map to internal sub-statuses; internal
  sub-statuses are never exposed.)
Employer verification:
  Not Started > Pending > In Review > Verified | Rejected
  Verified > Re-verification Required (on sensitive change) > Pending
Privacy request:
  Received > Identity Verified > In Progress > Completed | Declined (with
  lawful reason) ; SLA clock tracked at each stage.
Mandate:
  Draft > Pending Agreement > Active > On Hold > Filled | Cancelled |
  Expired

14.3 Default Business Rules (configurable, pending approval)
- Job validity: default 60 days, range 30-90; reconfirmation reminder at
  day 45; auto-expiry at end of validity.
- Duplicate applications: one active application per candidate per job.
- Abandoned drafts: purged after a defined period set in the retention
  policy.

======================================================================
15. DATA MODEL (POSTGRESQL)
======================================================================
Standards: UUID/ULID primary keys; created_at and updated_at on all
tables; deleted_at only where soft-delete is appropriate; strict foreign
keys; tenant/employer scoping; timestamps stored in UTC; reversible
migrations; audit logging.

Core tables:
  Identity/access : users, identities, sessions, roles, permissions,
                    role_assignments
  Organizations   : organizations, organization_members,
                    organization_verifications, recruiter_profiles
  Candidates      : candidate_profiles, candidate_skills,
                    candidate_experience, candidate_education, resumes,
                    resume_versions, consent_records, privacy_requests
  Hiring          : employer_leads, hiring_mandates, jobs, job_versions,
                    job_locations, job_skills, job_questions,
                    applications, application_answers,
                    application_events, candidate_submissions,
                    saved_jobs, job_alerts
  Interviews/deals: interviews, interview_participants,
                    interview_feedback, offers, placements, contracts
  Billing         : invoices, invoice_lines, payments
  Communication   : conversations, messages, notifications,
                    notification_preferences
  Content         : blog_posts, pages, media_assets, seo_redirects,
                    taxonomies
  Platform        : audit_events, abuse_reports, feature_flags,
                    webhook_events, idempotency_keys, outbox_events

Constraints:
- One active application per candidate and job unless explicitly allowed.
- Slugs unique per resource type.
- State machine enforced server-side.
- Verified-employer references on published jobs.
- Row-level access enforced by policy plus application checks.
- No direct object-storage URLs exposed.
- PII encrypted where appropriate; sensitive fields access-logged.

Indexes (initial; refine with EXPLAIN plans): jobs(status, published_at);
jobs(location, work_mode, type); full-text and trigram index for role
search; applications(candidate_id, created_at);
applications(job_id, status); mandates(employer_id, status);
audit_events(actor_id, occurred_at).

Data classification:
  Public      : published job content, published editorial content
  Internal    : operational metrics, templates, configuration
  Confidential: employer commercial terms, mandates, invoices
  Restricted  : resumes, candidate identity, contact details, private
                recruiter notes, consent records, authentication data

Retention: configurable, policy-approved and purpose-specific, with
automated expiry jobs, verified deletion evidence and legal-hold
exceptions. Default periods are proposed by Legal and approved before
launch (Section 32).

======================================================================
16. API AND BACKEND CONTRACT
======================================================================
- Base URL: https://api.atsai.pro/v1 (future); same-origin /api/v1 proxy
  acceptable initially. OpenAPI 3.1 specification and generated typed SDK
  shared by web and mobile. REST first; signed webhooks for integrations.
- Core resources: /auth, /me, /jobs, /jobs/{id}, /applications,
  /applications/{id}, /candidate/profile, /candidate/resumes,
  /employers, /employers/{id}, /employer/jobs, /mandates, /submissions,
  /interviews, /notifications, /consents, /privacy-requests,
  /admin/reviews, /reports, /billing.

API standards (all endpoints) [M]:
- Versioned; cursor pagination for large sets.
- Consistent error schema: code, message, fieldErrors, requestId.
- ISO-8601 timestamps; UTC persistence.
- Server-side input validation; authorization on every call.
- Rate limiting; request IDs; idempotency keys on mutating requests.
- No internal error details leaked.
- ETag/conditional GET where useful.
- Webhooks: signed payloads, retries with backoff, dead-letter queue,
  de-duplication.

File uploads [M]: signed upload intent; size, MIME and extension checks;
antivirus scanning; quarantine until clean; no execution or rendering of
untrusted files on servers; metadata stripping where appropriate; access
TTL and audit trail. Limits (default, configurable): resume max 5 MB;
PDF and DOCX only.

======================================================================
17. TECHNOLOGY STACK AND ARCHITECTURE
======================================================================
Frontend: Next.js App Router (current stable at implementation), React,
  strict TypeScript, Tailwind CSS, shadcn/ui or Radix primitives, Lucide
  React, React Hook Form + Zod, TanStack Query, next-intl-ready
  structure, next/font.
Backend: Next.js server components/actions for bounded web concerns plus
  modular TypeScript domain services and a REST API. Extract a dedicated
  NestJS or Fastify API at scale without changing domain contracts.
  Avoid premature microservices.
Database: managed PostgreSQL; Prisma or Drizzle (one chosen via ADR);
  migrations; pooler-compatible connections. Redis for caching,
  rate-limits and queues as needed; BullMQ workers for async jobs.
Search: PostgreSQL full text + trigram initially; Meilisearch or
  OpenSearch later behind a search adapter.
Storage: S3-compatible private buckets, encryption at rest, signed URLs,
  lifecycle policies.
Auth: audited provider or Auth.js-compatible solution; email
  verification; httpOnly cookies; CSRF protection; session rotation; MFA;
  scoped RBAC and tenant checks.
Email: transactional provider with SPF, DKIM, DMARC; templates; delivery
  status; bounce suppression; unsubscribe where applicable. SMS/WhatsApp
  optional and opt-in, later.
CMS: internal editorial CMS or headless CMS with review workflow.
Payments: gateway only after commercial readiness; invoices first; no
  candidate fees.
Observability: OpenTelemetry-compatible traces, structured redacted
  logs, error reporting, uptime monitors, privacy-safe product analytics;
  no resume content or credentials in telemetry.
Deployment: GitHub and GitHub Actions CI/CD; managed hosting for
  Next.js; managed DB; object storage; isolated staging and production;
  DNS/SSL; secrets manager; backups; rollback procedure.
Repository layout: apps/web, apps/api (when extracted), apps/worker,
  apps/mobile (future), packages/ui, packages/contracts,
  packages/config, packages/utils, packages/email, infra, docs.
Architecture governance: every significant technology choice recorded as
  an Architecture Decision Record (ADR).
Future mobile: Expo/React Native using the shared API SDK, design tokens
  and validation schemas; native auth and deep links; push notifications;
  offline saved jobs; secure credential storage; store-policy compliance.
  Mobile clients never scrape web HTML as an API.

======================================================================
18. NON-FUNCTIONAL REQUIREMENTS (MEASURABLE)
======================================================================
NFR-PERF-001 Core Web Vitals at p75 (field): LCP <= 2.5 s, INP <= 200 ms,
  CLS <= 0.1.
NFR-PERF-002 API p95 latency for read endpoints <= 500 ms and for job
  search <= 800 ms under expected load (to be validated by load tests).
NFR-AVAIL-001 Public site availability SLO 99.9% monthly after launch.
  This is an internal objective, not a marketing claim.
NFR-AVAIL-002 Graceful degradation: if search, email or AI services
  fail, core browsing and application submission still function or fail
  with clear, recoverable messaging.
NFR-DR-001 Backups: automated daily with point-in-time recovery where
  supported; proposed targets RPO <= 15 minutes and RTO <= 4 hours,
  confirmed by Engineering and Operations; restores tested at least
  quarterly.
NFR-SCALE-001 Initial design capacity: 1,000 active jobs and 10,000
  candidate profiles; load-tested at 10x. Capacity assumptions are
  measured and revised after launch.
NFR-SEC-001 Zero open critical or high security findings at release.
NFR-A11Y-001 WCAG 2.2 AA conformance on all critical journeys.
NFR-I18N-001 Architecture supports localization; launch language is
  English; dates, numbers and currency are locale-aware (INR digit
  grouping by default).
NFR-COMPAT-001 Current Chrome, Edge, Firefox, Safari; Android Chrome; iOS
  Safari; low-end devices; slow 3G/4G; touch and keyboard-only use.
NFR-MAINT-001 Strict TypeScript, linting, formatting, dependency
  scanning, documented APIs, reversible migrations.

======================================================================
19. RESPONSIVE AND ACCESSIBILITY SPECIFICATION
======================================================================
Breakpoints: 320-479 compact mobile; 480-767 large mobile; 768-1023
tablet; 1024-1439 desktop; 1440+ wide. Layouts are fluid, not only
breakpoint snapshots. Support 200-400% zoom and landscape orientation.

Job search on mobile: stacked fields, prominent filter drawer with
sticky Apply/Reset, visible result counts, large cards, simple apply
flow, no sideways scroll.
Employer forms: single column on mobile, step indicator, autosave,
back/next, inline errors, upload progress.
Dashboards: collapsible side navigation, cards before tables; wide
tables scroll only inside a contained region with a visible affordance;
alternate card-style rows on mobile; sticky headings where useful.

Accessibility requirements: WCAG 2.2 AA; semantic HTML; skip links;
visible focus; screen-reader labels; aria-live announcements for results
and validation; modal focus trap with Escape to close; correct
fieldsets and legends; reduced-motion support; accessible charts and
data tables; captions for video; accessible authentication and error
messages. A published accessibility statement documents known
limitations and a feedback channel.

======================================================================
20. TRUST, FRAUD PREVENTION AND MODERATION
======================================================================
Employer verification [M]: business identity check, verified domain,
manual review, contact validation, re-verification after sensitive
changes. Free-mail employers are never auto-trusted.
Job integrity [M]: mandatory real vacancy, clear application
destination, consent to publish, moderation before publication,
periodic reconfirmation, expiry and takedown, scam reporting, screening
for prohibited content (discriminatory, pay-to-apply, misleading), no
pay-to-apply of any kind.
Anti-phishing [M]: official-domain communications, SPF/DKIM/DMARC,
impersonation warnings, /verify-recruiter lookup using approved public
information only, no public display of private contact details.
Candidate safety [M]: no application fees, transparent employer
visibility, abuse reporting, secure documents, clear withdrawal and
deletion, no unnecessary identity-document collection at early stages.
Abuse defenses [M]: privacy-conscious bot detection, rate limiting,
email verification, upload scanning, moderation queue, abuse metrics,
account suspension with appeals.
Response targets (proposed, to be approved): acknowledge abuse reports
within 24 hours; high-risk listings suppressed pending review within
the same business day.

======================================================================
21. PRIVACY, SECURITY AND COMPLIANCE
======================================================================
21.1 Legal and Regulatory Review (India-qualified counsel required)
Counsel reviews, at minimum: the Digital Personal Data Protection Act
2023 and DPDP Rules 2025 (including their phased commencement dates,
which must be verified at implementation time); the Information
Technology Act and applicable rules; recruitment and employment
requirements; GST and invoicing; consumer protection; accessibility
obligations; labour and staffing obligations if contract staffing is
offered; and Emigration Act registration requirements if any overseas
placement is ever offered. A generic policy is not assumed to be
compliant.

21.2 Privacy Program
- Data mapping and records of processing.
- Separate, specific notices and consents for: job application, talent
  pool, marketing, and AI assistance. Granular withdrawal.
- Data subject rights handling with defined SLAs, grievance officer
  contact, and breach-notification evaluation.
- Minors policy with age-appropriate controls and legal review.
- Processor contracts and vendor inventory; cross-border transfer
  assessment.
- Data minimization: collect only what each stage needs.

21.3 Security Baseline
OWASP ASVS (target Level 2); threat model before build and updated per
phase; least privilege; MFA; secrets management; encryption in transit
and at rest; field-level access control for restricted data; protection
against SSRF, XSS, CSRF and SQL injection; content security policy;
strict CORS; secure headers; encrypted backups; restore drills;
vulnerability scanning; scheduled dependency updates; independent
penetration test before scale-up.

21.4 Breach and Incident Response
Detection; containment; forensics; legal notification evaluation;
named incident owners; communication templates; tabletop exercise before
launch. Retention and deletion jobs generate verifiable evidence, with
legal-hold exceptions.

======================================================================
22. AI GOVERNANCE
======================================================================
Principles: AI is assistive, optional and transparent. It never makes
final employment decisions.
- No hidden automated rejection or ranking that excludes candidates
  without human review.
- No inference of sensitive traits (for example religion, caste, health,
  gender identity, ethnicity).
- Recommendations are explainable and candidates can opt out where
  feasible.
- Human reviewer accountable for each AI-assisted decision.
- Bias and error evaluation before enablement and at regular intervals;
  results documented.
- Provider data-processing terms reviewed; no training on candidate data
  without explicit consent; retention limits applied.
- Prompts and outputs audited without exposing unnecessary PII.
- Public disclosure on /legal/ai-transparency.
- Every AI feature is behind a feature flag, off by default.

======================================================================
23. SEO, CONTENT AND ANALYTICS
======================================================================
Metadata: unique title and description; canonical URLs; OG/Twitter
images; robots rules; partitioned XML sitemaps (pages, jobs, blog);
hreflang only for genuinely localized content; breadcrumb schema;
Organization schema with verified details; FAQ schema only where
applicable.
JobPosting JSON-LD: only on an individual, active, visible job page;
data must exactly match visible content (including salary if marked up);
never on directory or search pages; removed promptly on expiry;
validThrough managed; job descriptions readable without login. Follow
Google's job posting and structured data policies.
Webmaster tools: Google Search Console and Bing Webmaster Tools.
Analytics (privacy-controlled, consent-aware): job_search, filter_apply,
job_view, application_start, application_submit, employer_lead_submit,
mandate_created, job_publish, interview_scheduled. No PII in event
payloads.
Content strategy: original, sourced salary guides; interview advice;
role skills guides; employer hiring playbooks; industry hiring trends.
No mass-generated thin location or job pages and no fabricated salary
data. Editorial ownership, review and update cadence defined.
Performance practices: optimized images, streaming, caching, server
rendering, code splitting, query-plan review, CDN, restrained prefetch.

======================================================================
24. EMAILS, NOTIFICATIONS AND COPY STANDARDS
======================================================================
Templates [M unless noted]: welcome/verify; password reset; application
received; status changed; interview invitation, reminder and reschedule;
employer lead received; mandate approved; job published and expired;
shortlist submitted; offer/placement update; invoice issued; privacy
request received and completed; security alert; suspicious job removed.
Every message: ATSAI branding; accurate context; one clear action;
expiry where relevant; support address; preferences/unsubscribe for
non-transactional mail; plain-text alternative; mobile-friendly HTML. No
promises of placement and no invented response times.
Approved example copy:
- Supporting line: "ATSAI Talent Solutions connects organizations with
  qualified professionals and helps candidates discover genuine career
  opportunities."
- Job notice: "ATSAI does not charge candidates to apply for jobs.
  Report any payment request claiming to represent us."
Copy review: all recruitment claims and consent text reviewed by Product
and Legal before release.

======================================================================
25. OPERATIONS, RELIABILITY AND SUPPORT
======================================================================
Monitoring and alerts: error rates; queue lag; email bounces; unusual
application spikes; authentication anomalies; database saturation;
certificate expiry; backup failures.
Runbooks and on-call: documented runbooks for incidents, rollback,
restore and takedown; named incident owner and escalation path; public
status communication.
Environments: separate development, staging and production data. No
production resumes or real personal data in non-production environments.
Support model: support email and contact form; grievance redressal
contact; business hours and response targets (to be defined in Section
32); ticketing with categories (candidate, employer, abuse, privacy).
Release management: feature flags default to safe; staged rollouts;
rollback plan; release checklist signed off by Product, Engineering, QA
and Legal.

======================================================================
26. TESTING STRATEGY AND ACCEPTANCE CRITERIA
======================================================================
Unit: state machines, validations, permissions, salary and location
formatting, consent logic, fee calculations.
Integration: database, auth, file scanning, notifications, webhooks,
billing, job publication and expiry.
End-to-end (Playwright): desktop and mobile job search; filter
persistence; apply; withdrawal; employer mandate; recruiter shortlist;
interview; admin moderation; privacy requests.
Security: IDOR and tenant isolation; privilege escalation; session
fixation; CSRF; XSS; SQL injection; malicious uploads; brute force;
rate limits; PII in logs; expired links; webhook spoofing.
Accessibility: axe automation plus manual keyboard and screen-reader
testing of critical journeys.
Performance: Lighthouse and real-user metrics; load testing at 10x.
SEO: JobPosting validation; sitemap; canonicals; 404/410 handling for
expired jobs.

Sample acceptance criteria:
- AC-JOB-01: Given a published, unexpired job, when a visitor opens its
  URL, then the full description is readable without login and valid
  JobPosting markup matching visible content is present.
- AC-JOB-02: Given a job past its validThrough date, when a visitor opens
  it, then Apply is disabled, JobPosting markup is absent, and related
  jobs are offered.
- AC-APP-01: Given a network failure during submission, when the
  candidate retries, then exactly one application exists and entered
  data is preserved.
- AC-APP-02: Given an infected file upload, then it is quarantined, never
  attached to an application, and the user sees a clear message.
- AC-CON-01: Given a recruiter submits a candidate to an employer, then
  role-specific consent exists and a disclosure event is recorded.
- AC-PRV-01: Given a verified deletion request with no legal hold, then
  personal data is erased or anonymized within the approved SLA and
  confirmation plus audit evidence are produced.
- AC-AUTH-01: Given a password-reset request for an unknown email, then
  the response is identical to that for a known email.

Release gates (all required): no critical or high security defects; no
placeholder jobs, content or claims; functional legal and contact pages;
tested backup restore; documented support process; verified employer
flow; email deliverability validated; consent and deletion path working;
responsive QA complete; admin emergency takedown tested.

======================================================================
27. ROADMAP, PHASES AND RELEASE CRITERIA
======================================================================
P0 Foundation (weeks 1-2): requirements sign-off; legal and brand
  clearance; design tokens; architecture and ADRs; schema; CI/CD;
  auth/RBAC skeleton; CMS foundation; monitoring.
  Exit: approved PRD, working pipeline, staging environment.
P1 Public Agency MVP (weeks 3-6): home, services, about, employers,
  contact, legal pages (approved), jobs directory and details,
  application workflow, employer leads, admin moderation, SEO.
  Exit: release gates in Section 26 met for public launch.
P2 Operational ATS (weeks 7-11): recruiter mandates; candidate CRM and
  consent; employer verification; submissions; interviews;
  notifications; placements; invoices.
  Exit: one full mandate-to-invoice cycle completed in staging with test
  data and reviewed by Operations.
P3 Self-Service (weeks 12-16): candidate and employer dashboards; saved
  jobs and alerts; employer posting workflow; analytics; privacy center;
  messaging.
P4 Marketplace Scale (post-validation): subscriptions; advanced search;
  recommendations; multilingual support; API hardening; integrations.
P5 Mobile Apps: Expo React Native candidate app first, employer app
  second; push; deep links; store launch; shared APIs.
Dates are planning estimates, not commitments, and are re-estimated
after staffing and vendor decisions. P3+ start only after P1/P2 outcome
review.

======================================================================
28. ENGINEERING WORK BREAKDOWN AND DELIVERABLES
======================================================================
A. Monorepo, strict TypeScript, lint/format/test, environment schema,
   commit hooks, dependency scanning.
B. Design tokens, component library, Storybook, responsive layouts,
   accessibility tests.
C. PostgreSQL, migrations, clearly fictional development-only seed data,
   private object storage, auth, RBAC, audit events.
D. Public pages and CMS; real legal content only after approval; all
   external links validated.
E. Jobs workflow, indexing, directory filters, detail pages, moderation,
   expiry jobs.
F. Candidate profile, resume upload and scan, consent, apply, status,
   notifications, privacy requests.
G. Employer leads, verification, mandate workflow, jobs, team
   permissions, interviews.
H. Recruiter CRM, submissions, pipeline, placements, invoice triggers.
I. Admin moderation, analytics, CMS, templates, support tickets, abuse
   reporting, feature flags.
J. SEO structured data, sitemap, metrics, accessibility, security and
   load tests.
K. Deployment scripts, runbooks, backup drills, rollback, launch
   checklist.
L. OpenAPI contract and mobile-ready shared SDK before any mobile client.

Required deliverables: full repository; README and setup guide;
.env.example; database schema; OpenAPI spec; seeded local development
data; CI workflows; QA report; design token reference; release
checklist; architecture decision records.

======================================================================
29. DEFINITION OF DONE (EVERY FEATURE)
======================================================================
- Meets written acceptance criteria and a real user workflow.
- Tested on mobile, tablet and desktop; keyboard and screen-reader
  tested; loading, empty and error states handled.
- Server-side authorization, validation, audit and privacy behavior
  verified.
- Automated tests and the CI quality gate pass.
- Monitoring and support behavior documented.
- No dead links, dummy CTAs, placeholder forms, fabricated content or
  inaccessible controls.
- Copy reviewed for truthful recruitment claims and clear consent.
- API contract and migration documented; feature flags default safe.

======================================================================
30. ENGINEERING PRINCIPLES AND NON-NEGOTIABLES
======================================================================
1. Greenfield build. Existing atsai.pro code, content and deployment are
   ignored; production is not overwritten without explicit release
   approval and a verified backup.
2. No lorem ipsum, fake employers, fake testimonials, fabricated jobs or
   misleading verification badges in production. Development fixtures
   are unmistakably labeled and never indexed.
3. Every visible control works, or is hidden or clearly disabled with a
   truthful explanation.
4. Legal documents are review-ready drafts until counsel approves; none
   is presented as final or as legal advice before sign-off.
5. Resumes, applicant identities, private notes and employer commercial
   information are protected by default.
6. Real recruitment operations take priority over decorative dashboards
   and speculative AI.
7. Brand consistency across web, portals, emails and future apps.
8. Clean semantic code, documented APIs, robust tests, reversible
   migrations.
9. Completion is claimed only after end-to-end flows pass their
   acceptance criteria.

======================================================================
31. RISK REGISTER
======================================================================
ID   Risk                                   Impact  Mitigation
R1   Empty job inventory at launch          High    Secure signed mandates
                                                    before launch; honest
                                                    empty state; talent
                                                    community
R2   Fake or fraudulent employers/jobs      High    Verification, four-eyes
                                                    review, reporting,
                                                    takedown
R3   Data breach of resumes                 High    Encryption, least
                                                    privilege, scanning,
                                                    pen test, IR plan
R4   DPDP or staffing non-compliance        High    Early legal review,
                                                    consent design,
                                                    retention policy
R5   Trademark/name conflict                Medium  Clearance in P0
R6   Scope creep (portals before core)      Medium  Strict phase gates and
                                                    change control
R7   Low organic traffic                    Medium  Original content, SEO
                                                    hygiene, employer
                                                    referrals
R8   AI bias or error                       Medium  Feature flags, human
                                                    review, evaluation
R9   Email deliverability problems          Medium  SPF/DKIM/DMARC, warmup,
                                                    monitoring
R10  Vendor lock-in or cost overrun         Medium  Adapters, ADRs, cost
                                                    review
R11  Key-person dependency                  Medium  Documentation,
                                                    runbooks, cross-
                                                    training
R12  Accessibility regressions              Medium  Automated and manual
                                                    audits in CI

======================================================================
32. OPEN DECISIONS AND OWNERS (resolve before go-live)
======================================================================
Decision                                              Owner       Needed by
D1  Legal entity, trademark, final trading name       Sponsor/    P0
                                                      Legal
D2  Verified company address, grievance and           Sponsor     P0
    official support contacts
D3  Actual service offerings and staffing/overseas    Sponsor/    P0
    regulatory obligations                            Legal
D4  Applicant login policy (guest apply vs login)     Product     P0
D5  Candidate data retention schedule                 Legal/      P1
                                                      Product
D6  Hosting, DB, email, SMS, file scanning and auth   Engineering P0
    vendors (security and cost review)
D7  Employer verification standard and commercial     Ops/Legal   P1
    recruitment agreement
D8  Privacy notices and DPDP compliance plan          Legal       P1
D9  Launch markets, languages and first verified      Sponsor/    P1
    job inventory                                     Recruitment
D10 Support hours, incident ownership, escalation     Ops         P1
    and abuse-report SLAs
D11 Home hero headline selection                      Product/    P0
                                                      Design
D12 Targets for RPO/RTO and API latency               Engineering P0

======================================================================
33. ROLES AND RESPONSIBILITIES (RACI)
======================================================================
R = Responsible, A = Accountable, C = Consulted, I = Informed
Activity                  Sponsor Product Eng   Design Legal Ops  QA
Scope and priorities        A       R      C     C      C    C    I
Brand and visual system     C       A      I     R      C    I    I
Architecture and security   I       C      A     I      C    C    C
Legal and privacy text      C       C      I     I      A    C    I
Employer verification       I       C      C     I      C    A    I
Job moderation policy       I       C      I     I      C    A    I
Build and delivery          I       C      A     C      I    I    R
Release approval            A       R      R     C      R    C    R
Incident response           I       C      R     I      C    A    I

======================================================================
34. GLOSSARY
======================================================================
ATS        Applicant Tracking System
Mandate    A formal engagement from an employer for ATSAI to fill a role
Requisition Internal record of a hiring need within a mandate
Submission Formal presentation of a candidate to an employer
Placement  A candidate accepting an offer and starting through ATSAI
DPDP       India's Digital Personal Data Protection Act 2023 and Rules
RBAC       Role-based access control
MFA        Multi-factor authentication
IDOR       Insecure direct object reference
PITR       Point-in-time recovery
RPO / RTO  Recovery point objective / recovery time objective
SLO        Service level objective
ADR        Architecture decision record
Confidential Employer  Job listing with the employer's name withheld
                       publicly but verified internally

======================================================================
35. REFERENCES
======================================================================
Google JobPosting structured data:
  https://developers.google.com/search/docs/appearance/structured-data/job-posting
Google structured data policies:
  https://developers.google.com/search/docs/appearance/structured-data/sd-policies
India MeitY DPDP Rules 2025:
  https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
WCAG 2.2: https://www.w3.org/TR/WCAG22/
OWASP ASVS:
  https://owasp.org/www-project-application-security-verification-standard/
Next.js: https://nextjs.org/docs
React: https://react.dev/
Implementers must confirm that each reference reflects the current
version at the time of use.

======================================================================
APPENDIX A. REQUIREMENT PRIORITY KEY
======================================================================
[M] Must   : required for the phase in which it appears; launch blocker
[S] Should : important; delivered in the phase unless capacity-limited
[C] Could  : desirable; included if time and budget allow
[F] Future : planned for a later phase; not built in MVP
Requirements without a tag inherit the priority of their phase.

======================================================================
APPENDIX B. SUMMARY OF IMPROVEMENTS FROM v2.0
======================================================================
1. Added formal PRD structure: document control, revision history,
   executive summary, problem statement, goals, scope boundaries,
   personas, assumptions, constraints, dependencies.
2. Introduced requirement IDs and MoSCoW priorities for traceability.
3. Added explicit MVP cut-line; v2.0 scheduled portals and billing too
   aggressively. Self-service portals moved behind operator-assisted
   workflows at launch.
4. Resolved inconsistencies:
   a. Two conflicting hero headlines; one is now selected at design
      sign-off (decision D11).
   b. MFA scope clarified (mandatory for staff and employer
      owners/admins).
   c. Applicant login vs guest apply made an explicit decision (D4).
   d. slate-500 contrast risk flagged and tested per pairing.
   e. Job lifecycle and application statuses formalized as state
      machines with allowed transitions.
5. Converted "instructions to implementation agent" into neutral
   engineering principles suitable for a formal document.
6. Added measurable non-functional requirements (latency, RPO/RTO,
   availability, capacity) marked for validation.
7. Added acceptance criteria samples in Given/When/Then form.
8. Added data classification, default business rules (job validity,
   duplicates), file upload limits.
9. Expanded compliance scope (DPDP phasing, staffing, Emigration Act
   check) while requiring counsel verification.
10. Added AI governance section, risk register, open-decision owners
    and due phases, RACI and glossary.

END OF MASTER PRD
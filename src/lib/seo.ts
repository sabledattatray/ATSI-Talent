import type { Metadata } from "next";

export const SITE_URL = "https://www.atsai.pro";



// Preview deployments and local development must stay out of search results.

export const PUBLIC_INDEXING = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";



export const PUBLIC_SITEMAP_PATHS = [

  "/", "/about", "/services", "/services/permanent-recruitment",

  "/services/it-and-data-recruitment", "/services/bfsi-and-finance-recruitment",

  "/services/executive-search", "/services/contract-staffing",

  "/candidates", "/candidates/how-it-works", "/employers", "/jobs",

  "/blog", "/contact", "/faq", "/accessibility",

] as const;



export const PRIVATE_SEARCH_PATHS = [

  "/admin", "/api", "/candidate", "/employer", "/recruiter",

  "/login", "/signup", "/forgot-password", "/legal", "/status",

  "/privacy-request", "/report-job", "/verify-recruiter", "/employers/request-talent", "/security",

] as const;





export const BRAND_NAME = "ATSAI Technologies";

export const SOCIAL_IMAGE = "/brand/atsai-social.png";

export function absoluteUrl(path: string) { return new URL(path, SITE_URL).href; }

export function pageMetadata(path: string, title: string, description: string, image = SOCIAL_IMAGE): Metadata {

  const cleanTitle = title.replace(/\s*[|–-]\s*(?:ATSAI(?: Talent Solutions| Technologies)?|ATS AI(?: Talent Solutions| Technologies)?)$/i, "").trim();

  const fullTitle = path === "/" ? "ATSAI Technologies | Recruitment Software & HR Technology Solutions" : `${cleanTitle} | ATSAI`;

  return {

    title: { absolute: fullTitle }, description,

    alternates: { canonical: absoluteUrl(path) },

    robots: { index: PUBLIC_INDEXING, follow: true, googleBot: { index: PUBLIC_INDEXING, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },

    openGraph: { type: "website", locale: "en_IN", siteName: BRAND_NAME, title: fullTitle, description, url: absoluteUrl(path), images: [{ url: absoluteUrl(image), ...(image === SOCIAL_IMAGE ? { width: 1200, height: 630 } : {}), alt: `${BRAND_NAME} — recruitment and careers` }] },

    twitter: { card: "summary_large_image", title: fullTitle, description, images: [absoluteUrl(image)] },

  };

}

export const PAGE_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {

  "/": { title: "ATSAI Technologies | Recruitment Software & HR Technology Solutions", description: "Discover jobs across industries and countries. Manage job postings, applicants, interviews and hiring decisions with ATSAI Technologies recruitment software.", keywords: ["ATSAI Technologies", "applicant tracking system", "recruitment software", "HR technology solutions"] },

  "/jobs": { title: "Explore Job Openings Across India | ATSAI Technologies", description: "Find verified career openings across technology, AI, analytics, finance, operations, and product in Bengaluru, Pune, Mumbai, Hyderabad, and Delhi NCR.", keywords: ["jobs India", "Bengaluru tech jobs", "Pune IT jobs", "Mumbai finance jobs", "Hyderabad developer jobs", "remote jobs India"] },

  "/about": { title: "About ATSAI Technologies", description: "ATSAI Technologies builds recruitment software and HR technology solutions connecting candidates and hiring teams across industries and countries.", keywords: ["ATSAI Talent Solutions", "recruitment consultancy Pune Mumbai"] },

  "/services": { title: "Recruitment Software & HR Technology Solutions", description: "Explore ATSAI Technologies applicant tracking, job publishing, interview scheduling, team collaboration and candidate profile tools for international hiring.", keywords: ["recruitment services India", "talent acquisition", "staffing services"] },

  "/services/permanent-recruitment": { title: "Global Enterprise & Contingent Recruitment | ATSAI", description: "Scale permanent hiring across software engineering, AI, product, operations, and finance. ATSAI connects companies with calibrated global talent.", keywords: ["global recruitment", "enterprise staffing", "permanent talent acquisition", "worldwide hiring"] },

  "/services/it-and-data-recruitment": { title: "Global IT, Cloud & Software Engineering Recruitment | ATSAI", description: "Hire world-class AI/ML engineers, full-stack developers, cloud architects, and data engineers worldwide. Discuss technical talent needs with ATSAI.", keywords: ["global IT recruitment", "AI engineer hiring", "cloud architect recruitment", "software engineering jobs"] },

  "/services/bfsi-and-finance-recruitment": { title: "Global BFSI, FinTech & Quantitative Risk Recruitment | ATSAI", description: "Recruit credentialed professionals for quantitative research, credit risk, algorithmic trading, FinTech, and financial analytics globally.", keywords: ["quantitative finance recruitment", "credit risk hiring", "fintech talent acquisition", "global finance careers"] },

  "/services/executive-search": { title: "Global Executive & Leadership Search | ATSAI", description: "Retained executive search for CTOs, Chief AI Officers, VP of Engineering, and business unit heads across Americas, EMEA, and APAC.", keywords: ["executive search", "CTO recruitment", "leadership talent acquisition", "C-suite search"] },

  "/services/contract-staffing": { title: "International Contract & Project Staffing | ATSAI", description: "Agile specialist deployment for cloud migrations, AI pilots, ERP integrations, and technical sprints across time zones with ATSAI.", keywords: ["contract staffing", "interim tech consultants", "fractional AI engineers", "project staffing"] },

  "/candidates": { title: "Job Openings Across India & Live ATS Candidate Portal | ATSAI", description: "Discover career opportunities across India in AI, software engineering, cloud, finance, and operations. Free candidate account with live real-time ATS application tracking.", keywords: ["jobs in India", "candidate portal", "applicant tracking India", "tech careers India"] },

  "/candidates/how-it-works": { title: "How to Find & Apply for Jobs on ATSAI", description: "Learn how to create a candidate profile, save openings and apply on ATSAI or through an employer’s careers site. Track your ATSAI applications online.", keywords: ["how to apply for jobs", "ATSAI candidate account"] },

  "/employers": { title: "Applicant Tracking Software for Hiring Teams", description: "Create your company workspace. Publish jobs, track applications, schedule interviews and collaborate with recruiters using ATSAI Technologies.", keywords: ["applicant tracking software", "company hiring workspace", "recruitment management"] },

  "/blog": { title: "Career Advice, Recruitment & Hiring Insights", description: "Read ATSAI articles on careers, job applications, analytics skills and hiring. Explore practical guidance for job seekers and employers.", keywords: ["career advice", "recruitment insights", "hiring advice"] },

  "/contact": { title: "Contact ATSAI for Recruitment & Career Enquiries", description: "Contact ATSAI Talent Solutions about hiring, job opportunities or your account. Email contact@atsai.pro or send a message through our contact form.", keywords: ["contact ATSAI", "recruitment enquiry", "hiring enquiry"] },

  "/faq": { title: "Job Applications, Candidate Accounts & Hiring FAQs", description: "Find answers about ATSAI candidate accounts, applications, resume links, hiring briefs and contacting the team. Candidate registration and applications are free.", keywords: ["ATSAI FAQ", "job application help", "candidate account help"] },

  "/accessibility": { title: "Website Accessibility & Support", description: "Learn about accessibility on ATSAI and how to report a problem with navigation, forms or career information. Contact the team for assistance.", keywords: ["ATSAI accessibility"] },

};

export function staticMetadata(path: string): Metadata {

  const entry = PAGE_SEO[path];

  return { ...pageMetadata(path, entry.title, entry.description), keywords: entry.keywords };

}

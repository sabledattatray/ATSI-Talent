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





export const BRAND_NAME = "ATSAI Talent Solutions";

export const SOCIAL_IMAGE = "/brand/atsai-social.png";

export function absoluteUrl(path: string) { return new URL(path, SITE_URL).href; }

export function pageMetadata(path: string, title: string, description: string, image = SOCIAL_IMAGE): Metadata {

  const cleanTitle = title.replace(/\s*[|–-]\s*(?:ATSAI(?: Talent Solutions)?|ATS AI(?: Talent Solutions)?)$/i, "").trim();

  const fullTitle = `${cleanTitle} | ATSAI`;

  return {

    title: { absolute: fullTitle }, description,

    alternates: { canonical: absoluteUrl(path) },

    robots: { index: PUBLIC_INDEXING, follow: true, googleBot: { index: PUBLIC_INDEXING, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },

    openGraph: { type: "website", locale: "en_IN", siteName: BRAND_NAME, title: fullTitle, description, url: absoluteUrl(path), images: [{ url: absoluteUrl(image), ...(image === SOCIAL_IMAGE ? { width: 1200, height: 630 } : {}), alt: `${BRAND_NAME} — recruitment and careers` }] },

    twitter: { card: "summary_large_image", title: fullTitle, description, images: [absoluteUrl(image)] },

  };

}

export const PAGE_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {

  "/": { title: "Recruitment Agency for Analytics, MIS, IT & Finance", description: "Find jobs and hire talent with ATSAI. Recruitment for data analytics, MIS, Power BI, IT and finance, serving employers and professionals across India.", keywords: ["recruitment agency India", "data analytics recruitment", "MIS recruitment", "IT recruitment", "finance recruitment"] },

  "/jobs": { title: "Data Analytics, MIS, IT & Finance Jobs in India", description: "Browse current analytics, MIS, Power BI, SQL, IT and finance jobs. Compare role requirements, locations and application routes. No candidate fees.", keywords: ["data analyst jobs India", "MIS jobs", "Power BI jobs", "SQL jobs", "finance jobs"] },

  "/about": { title: "About ATSAI Recruitment & Talent Solutions", description: "Meet ATSAI Talent Solutions and learn about our recruitment focus in analytics, MIS, IT and finance, with roots in Pune and Mumbai.", keywords: ["ATSAI Talent Solutions", "recruitment consultancy Pune Mumbai"] },

  "/services": { title: "Recruitment Services for Employers in India", description: "Explore permanent recruitment, IT and data hiring, BFSI recruitment, executive search and contract staffing. Share your hiring needs with ATSAI.", keywords: ["recruitment services India", "talent acquisition", "staffing services"] },

  "/services/permanent-recruitment": { title: "Permanent Recruitment for MIS, Analytics & Operations", description: "Discuss permanent hiring for MIS, analytics, finance and operations roles. ATSAI helps define requirements, source candidates and coordinate selection.", keywords: ["permanent recruitment India", "MIS recruitment", "operations hiring"] },

  "/services/it-and-data-recruitment": { title: "IT, Data Analytics & Power BI Recruitment", description: "Hire SQL, Power BI, data engineering and software specialists with ATSAI. Discuss your technical requirements and recruitment process with our team.", keywords: ["IT recruitment India", "data analytics recruitment", "Power BI recruitment", "SQL developer hiring"] },

  "/services/bfsi-and-finance-recruitment": { title: "BFSI & Finance Recruitment Services", description: "Recruit professionals for banking, financial services, insurance, risk and financial analytics. Share your finance hiring requirements with ATSAI.", keywords: ["BFSI recruitment", "finance recruitment India", "risk analytics hiring"] },

  "/services/executive-search": { title: "Executive Search & Leadership Recruitment", description: "Discuss a focused search for senior leaders with ATSAI. Define the role, business priorities and selection process for your leadership hiring needs.", keywords: ["executive search India", "leadership recruitment"] },

  "/services/contract-staffing": { title: "Contract Staffing & Project Recruitment", description: "Discuss contract hiring for technology, analytics and business projects. Agree role scope, staffing requirements and engagement terms with ATSAI.", keywords: ["contract staffing India", "contract recruitment", "project staffing"] },

  "/candidates": { title: "Job Seeker Support & Free Candidate Accounts", description: "Explore jobs in analytics, MIS, finance and technology. Create a free ATSAI candidate account to save jobs and track applications submitted on the platform.", keywords: ["job seeker support", "free candidate registration", "analytics careers"] },

  "/candidates/how-it-works": { title: "How to Find & Apply for Jobs on ATSAI", description: "Learn how to create a candidate profile, save openings and apply on ATSAI or through an employer’s careers site. Track your ATSAI applications online.", keywords: ["how to apply for jobs", "ATSAI candidate account"] },

  "/employers": { title: "Hire Analytics, MIS, IT & Finance Talent", description: "Share your hiring brief with ATSAI Talent Solutions. Discuss recruitment for analytics, MIS, software, banking and finance roles across India.", keywords: ["hire data analysts", "hire MIS professionals", "IT hiring services", "finance hiring"] },

  "/blog": { title: "Career Advice, Recruitment & Hiring Insights", description: "Read ATSAI articles on careers, job applications, analytics skills and hiring. Explore practical guidance for job seekers and employers.", keywords: ["career advice", "recruitment insights", "hiring advice"] },

  "/contact": { title: "Contact ATSAI for Recruitment & Career Enquiries", description: "Contact ATSAI Talent Solutions about hiring, job opportunities or your account. Email contact@atsai.pro or send a message through our contact form.", keywords: ["contact ATSAI", "recruitment enquiry", "hiring enquiry"] },

  "/faq": { title: "Job Applications, Candidate Accounts & Hiring FAQs", description: "Find answers about ATSAI candidate accounts, applications, resume links, hiring briefs and contacting the team. Candidate registration and applications are free.", keywords: ["ATSAI FAQ", "job application help", "candidate account help"] },

  "/accessibility": { title: "Website Accessibility & Support", description: "Learn about accessibility on ATSAI and how to report a problem with navigation, forms or career information. Contact the team for assistance.", keywords: ["ATSAI accessibility"] },

};

export function staticMetadata(path: string): Metadata {

  const entry = PAGE_SEO[path];

  return { ...pageMetadata(path, entry.title, entry.description), keywords: entry.keywords };

}

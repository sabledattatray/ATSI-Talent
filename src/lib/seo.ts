export const SITE_URL = "https://www.atsai.pro";

// Preview deployments and local development must stay out of search results.
export const PUBLIC_INDEXING = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

export const PUBLIC_SITEMAP_PATHS = [
  "/", "/about", "/services", "/services/permanent-recruitment",
  "/services/it-and-data-recruitment", "/services/bfsi-and-finance-recruitment",
  "/services/executive-search", "/services/contract-staffing",
  "/candidates", "/candidates/how-it-works", "/employers", "/jobs",
  "/blog", "/resources", "/contact", "/faq", "/accessibility",
] as const;

export const PRIVATE_SEARCH_PATHS = [
  "/admin", "/api", "/candidate", "/employer", "/recruiter",
  "/login", "/signup", "/forgot-password", "/legal", "/status",
  "/privacy-request", "/report-job", "/verify-recruiter", "/employers/request-talent", "/security",
] as const;

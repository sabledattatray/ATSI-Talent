import type { ContentRecord, RichNode } from "@/lib/admin/types";
import { absoluteUrl, SITE_URL, BRAND_NAME } from "@/lib/seo";
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"); }
const escape = (value: string) => value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export function descriptionHtml(node: RichNode): string {
  if (node.type === "text") return escape(node.text || "");
  if (node.type === "hardBreak") return "<br>";
  const children = (node.content || []).map(descriptionHtml).join("");
  const tags: Record<string,string> = { paragraph: "p", bulletList: "ul", orderedList: "ol", listItem: "li", blockquote: "blockquote", heading: "h2" };
  const tag = tags[node.type];
  return tag ? `<${tag}>${children}</${tag}>` : children;
}
export function organizationGraph() { return { "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: BRAND_NAME, alternateName: "ATS AI", url: SITE_URL, logo: { "@type": "ImageObject", url: absoluteUrl("/brand/atsai-symbol-1024.png") }, email: "contact@atsai.pro", areaServed: "Worldwide" },
  { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: BRAND_NAME, alternateName: "ATSAI", inLanguage: "en-IN", publisher: { "@id": `${SITE_URL}/#organization` }, creator: { "@type": "Person", name: "Datta Sable", url: "https://dattasable.com" } },
] }; }
export function breadcrumbs(items: { name: string; path: string }[]) { return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ name: "Home", path: "/" }, ...items].map((item,index) => ({ "@type": "ListItem", position: index+1, name: item.name, item: absoluteUrl(item.path) })) }; }
export function jobPosting(job: ContentRecord, now = Date.now()) {
  // The publisher must confirm original employer facts; imported vacancies do not
  // inherit invented dates, addresses, salary, or a direct-apply claim.
  if (!job.googleJobs || job.status !== "published" || !job.publishedAt || Date.parse(job.publishedAt) > now || (job.expiresAt && Date.parse(job.expiresAt) <= now) || !job.jobOriginalDate || !job.jobCountry || (job.workMode !== "Remote" && !job.jobCity)) return null;
  const employment: Record<string,string> = { "Full-time": "FULL_TIME", "Part-time": "PART_TIME", Contract: "CONTRACTOR", Executive: "FULL_TIME", Temporary: "TEMPORARY", Internship: "INTERN", Volunteer: "VOLUNTEER" };
  return { "@context": "https://schema.org", "@type": "JobPosting", title: job.title, description: descriptionHtml(job.content), datePosted: job.jobOriginalDate, url: absoluteUrl(`/jobs/${job.slug}`), identifier: { "@type": "PropertyValue", name: BRAND_NAME, value: job.id }, hiringOrganization: { "@type": "Organization", name: job.company },
    ...(employment[job.employmentType] ? { employmentType: employment[job.employmentType] } : {}),
    ...(job.expiresAt ? { validThrough: job.expiresAt } : {}),
    ...(job.workMode === "Remote" ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: job.jobCountry } } : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.jobCity, ...(job.jobRegion ? { addressRegion: job.jobRegion } : {}), addressCountry: job.jobCountry } } }),
    ...(job.salaryMin > 0 && job.salaryMax > 0 ? { baseSalary: { "@type": "MonetaryAmount", currency: job.salaryCurrency || "INR", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, maxValue: job.salaryMax, unitText: job.salaryPeriod || "YEAR" } } } : {}),
    ...(job.skills ? { skills: job.skills } : {}),
  };
}
export function articlePosting(post: ContentRecord) { return { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, datePublished: post.publishedAt, dateModified: post.updatedAt, mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`), url: absoluteUrl(`/blog/${post.slug}`), author: { "@type": /ATSAI|ATS AI/i.test(post.author) ? "Organization" : "Person", name: post.author }, publisher: { "@id": `${SITE_URL}/#organization` }, ...(post.cover ? { image: absoluteUrl(post.cover) } : {}) }; }

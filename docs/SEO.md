# ATSAI search visibility and SEO

Implemented 18 October 2026. Production canonical origin: https://www.atsai.pro.

## Technical changes

- Each of the 16 main indexable routes has its own title, description, canonical, Open Graph and Twitter metadata. Editor SEO fields override job/article defaults, with the brand suffix normalized once.
- Homepage and directory render published job links in server HTML, while retaining interactive filters, saved jobs and client refresh.
- `/sitemap.xml` reads durable published records on every request. Jobs and articles appear after publishing, and drafts, archived, scheduled and expired records are omitted. Dynamic entries use their actual stored `updatedAt`; static pages have no fabricated last-modified date. A database outage is allowed to fail rather than publish a misleading empty sitemap.
- `/resources` permanently redirects to `/blog` to consolidate identical content; internal navigation points directly to the journal.
- Organization/WebSite identity, service, article and breadcrumb JSON-LD uses actual public information. No invented addresses, reviews, ratings, employer affiliations or achievements.
- Private workspaces and APIs remain noindex. Public uploaded media is allowed through robots and response headers. Preview deployments remain noindex and robots-disallowed.
- Missing or expired jobs and articles invoke Next.js notFound. Non-streamed responses return 404; a response whose static shell has already streamed can retain HTTP 200 with an injected noindex meta tag. Smoke checks accept only 404 or that explicit noindex response. These URLs are also excluded from the sitemap and JobPosting markup. Static marketing routes remain prerendered.
- A 1200 × 630 branded social image is supplied. Existing fonts use swap. No search ranking or Core Web Vitals score is claimed without field data.

## Google Jobs details in the editor

Enable the Google Jobs checkbox only for an actual open vacancy whose employer facts you have confirmed. Enter the employer’s original posting date, actual work city/region and two-letter country code. For fully remote roles the country is the eligible applicant country, shown on the page. Remote markup is not used for hybrid roles. Dates, salary and application simplicity are never invented. Salary schema is only present when both INR annual bounds are supplied and positive. There is no automatic directApply assertion.

For the externally sourced Amazon listing, obtain the original posting date and confirm the actual work arrangement from the employer before opting in. Keep the employer’s application link and source attribution. Do not guess Hybrid, an experience maximum, salary or a closing date. Ordinary page indexing, metadata and breadcrumbs work without opting in to Google Jobs.

Structured data creates eligibility, not a promise of a Google Jobs appearance. Expired jobs are excluded by the existing publishing query and render the unavailable page with noindex; maintain accurate closing dates and archive roles when filled.

## Keyword and search-intent map

These are editorial targets, not measured search-volume or ranking claims. Use the words naturally in useful, accurate content. Google does not use meta keywords as a web-ranking signal; the keywords array is descriptive configuration, not a ranking mechanism.

| Page | Primary topic | Supporting terms |
|---|---|---|
| Home | recruitment agency India | analytics, MIS, IT and finance recruitment |
| Jobs | analytics and MIS jobs in India | data analyst, Power BI, SQL, finance jobs |
| Permanent recruitment | permanent recruitment | MIS and operations hiring |
| IT and data recruitment | IT and data analytics recruitment | Power BI, SQL, data engineering hiring |
| BFSI and finance | finance and BFSI recruitment | banking, risk and financial analytics |
| Executive search | leadership recruitment | executive search India |
| Contract staffing | contract staffing | technology and analytics project hiring |
| Employers | hire analytics and IT talent | MIS and finance recruitment |
| Candidates | job seeker support | free candidate accounts, applications |
| About / Contact | ATSAI Talent Solutions | recruitment enquiries, Pune and Mumbai |
| Blog | practical career and hiring advice | original role guides and useful employer insights |

The full per-page title/description/topic map is maintained in `src/lib/seo.ts`.

## Google Search Console steps

1. Open https://search.google.com/search-console and choose the verified property covering `https://www.atsai.pro`.
2. Submit `https://www.atsai.pro/sitemap.xml` under Sitemaps. If already submitted, it will be fetched again; check its last-read time and discovered URLs.
3. Inspect the homepage, jobs directory, one real published job, and key service pages. Run Test live URL, confirm indexing is allowed and canonical is correct, and request indexing where available.
4. Test an opted-in job at https://search.google.com/test/rich-results and resolve required-property errors before expecting Google Jobs eligibility.
5. Review Page indexing, Performance and Core Web Vitals after Google has collected data. Search Console access, sitemap submission and Google recrawling are not performed by repository code.

If HTML verification is needed, add `GOOGLE_SITE_VERIFICATION` in Vercel Production with only the verification token and redeploy. DNS verification is normally preferable for a domain property; an already verified property needs no new token. Do not expose account credentials.

## Content and authority work

Publish real, current jobs with original useful context; a copied vacancy alone may add little value. Remove the fictional test vacancy from public listings. Write original articles answering specific candidate and employer questions, show a genuine author, and link relevant articles to services and live roles. Keep employer facts current and avoid manufactured verification badges. Any business-directory profile or external link should represent the real business; do not create paid link schemes, fake reviews or thin city pages. If a genuine eligible local business has accurate address/service-area details, the owner can manage its Google Business Profile separately.

## Verification

`npm run check:seo` performs read-only live checks of up to 50 sitemap URLs for status, unique titles, descriptions, canonicals, a single H1 and valid JSON-LD, plus private noindex and missing-job exclusion. For the local production server use `npm run check:seo -- http://127.0.0.1:3003`.

Regression tests cover sitemap publishing and expiry, metadata uniqueness, safe JSON-LD, external source facts, remote versus hybrid schema and existing account/application workflows. All fixture writes are confined to local test databases.

## Primary references

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/appearance/structured-data/job-posting
- https://developers.google.com/search/docs/essentials/spam-policies

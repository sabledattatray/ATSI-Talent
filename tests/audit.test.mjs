import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Evaluate actual TypeScript sources without adding a test framework dependency.
function app(environment = "development") {
  const records = new Map();
  const events = new EventTarget();
  const context = vm.createContext({ console, structuredClone, crypto: nativeRequire("node:crypto").webcrypto,
    Buffer, process: { cwd: () => path.resolve(__dirname, ".."), env: { NODE_ENV: environment, NEXT_PUBLIC_ATSAI_DEMO: environment === "development" ? "true" : "false", ATSAI_DATABASE_PATH: ":memory:" } }, Date, URL, Request, Response, Event,
    window: events, sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key,value) => records.set(key,value) },
  });
  const cache = new Map();
  function load(file) {
    const full = path.resolve(__dirname, "..", file);
    if (cache.has(full)) return cache.get(full).exports;
    const loaded = { exports: {} }; cache.set(full, loaded);
    const source = ts.transpileModule(fs.readFileSync(full,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = id => id === "next/server" ? { ...nativeRequire("next/server"), connection: async () => {} } : id === "server-only" ? {} : id === "next/headers" ? { cookies: async () => ({ get: () => undefined }) } : id.startsWith("@/") ? load(`src/${id.slice(2)}.ts`) : id.startsWith(".") ? load(path.relative(path.resolve(__dirname,".."),path.resolve(path.dirname(full),id+".ts"))) : nativeRequire(id);
    const fn = vm.runInContext(`(function(require,module,exports){${source}\n})`,context,{filename:full});
    fn(localRequire,loaded,loaded.exports); return loaded.exports;
  }
  return { load, records, context };
}

test("production contains no sample collections", () => {
  const { load } = app("production");
  for (const records of Object.values(load("src/lib/store.ts"))) assert.equal(records.length,0);
  assert.throws(() => load("src/lib/dataService.ts").DataService.toggleSaveJob("job-1"), /unavailable/);
});
test("fallback records cannot mutate shared fixtures", () => {
  const { load } = app(); const service = load("src/lib/dataService.ts").DataService;
  service.getJobs()[0].status = "Paused";
  assert.equal(service.getJobs()[0].status,"Published");
});
test("takedown persists in demo and storage is isolated from legacy keys", () => {
  const { load,records } = app(); const service = load("src/lib/dataService.ts").DataService;
  const job = service.getJobs()[0];service.saveJob({...job,status:"Paused"});
  assert.equal(service.getJobById(job.id).status,"Paused");
  assert.ok([...records.keys()].every(key => key.startsWith("atsai_demo_")));
});
test("malformed storage safely falls back", () => {
  const { load,records } = app(); const service = load("src/lib/dataService.ts").DataService;
  for(const invalid of ["{}", "[null]", '[{"id":"broken"}]']) { records.set("atsai_demo_jobs_v2",invalid);assert.ok(service.getJobs()[0].title); }
});
test("withdrawal revokes consent and cannot be advanced", () => {
  const { load } = app();const service=load("src/lib/dataService.ts").DataService;
  const application=service.getApplications()[0];assert.equal(service.withdrawApplication(application.id,"demo"),true);
  assert.equal(service.getApplicationById(application.id).roleSpecificConsentGiven,false);
  assert.equal(service.updateApplicationStatus(application.id,"Interview","test","Recruiter"),false);
  assert.equal(service.withdrawApplication(application.id,"demo"),false);
});
test("application consent, duplicate detection and closed jobs are enforced", () => {
  const { load } = app();const service=load("src/lib/dataService.ts").DataService;
  const job=service.getJobs()[0];service.saveJob({...job,publishedAt:"2020-01-01",expiresAt:"2100-01-01"});
  const application={...service.getApplications()[0],candidateEmail:"audit@example.test",roleSpecificConsentGiven:false};
  assert.throws(()=>service.submitApplication(application),/consent/);
  application.roleSpecificConsentGiven=true;
  const created=service.submitApplication(application);assert.ok(created.referenceId.startsWith("APP-"));
  assert.throws(()=>service.submitApplication(application),/already exists/);
  service.saveJob({...job,status:"Paused"});assert.throws(()=>service.submitApplication({...application,candidateEmail:"other@example.test"}),/not accepting/);
});
test("storage failures do not return a success record", () => {
  const { load,context }=app();context.sessionStorage.setItem=()=>{throw Error("quota");};
  assert.throws(()=>load("src/lib/dataService.ts").DataService.submitEmployerLead({companyName:"Test"}),/Could not save/);
});
test("job visibility and confidential keyword checks",()=>{
  const {load}=app();const {isJobOpen,matchesKeyword}=load("src/lib/jobs.ts");const job=load("src/lib/store.ts").INITIAL_JOBS[0];
  assert.equal(isJobOpen({...job,expiresAt:"2000-01-01"},Date.now()),false);
  assert.equal(isJobOpen({...job,status:"Draft"},Date.now()),false);
  assert.equal(matchesKeyword({...job,isEmployerConfidential:true,employerName:"HiddenSecretCorp"},"HiddenSecretCorp"),false);
});
test("private recruitment APIs reject anonymous reads and candidate applications require sign-in", async () => {
  const {load}=app();
  for(const path of ["applications","employers/leads"]){const api=load(`src/app/api/v1/${path}/route.ts`);assert.equal((await api.GET(new Request(`http://localhost/api/v1/${path}`))).status,401);}
  const response=await load("src/app/api/v1/applications/route.ts").POST(new Request("http://localhost/api/v1/applications",{method:"POST",headers:{origin:"http://localhost","content-type":"application/json"},body:"{}"}));
  assert.equal(response.status,401);
});
test("invalid public submissions never fabricate receipt or notification", async () => {
  const {load}=app();
  for(const path of ["report-job","privacy-request"]){const response=await load(`src/app/api/v1/${path}/route.ts`).POST(new Request(`http://localhost/api/v1/${path}`,{method:"POST",headers:{origin:"http://localhost","content-type":"application/json"},body:"{}"}));assert.equal(response.status,400);assert.equal((await response.json()).reference,undefined);}
  assert.equal((await load("src/app/api/v1/verify-recruiter/route.ts").GET(new Request("http://localhost/api/v1/verify-recruiter"))).status,400);
});

test("job API rejects invalid ranges and non-integer filters",async()=>{
  const {load}=app();const {GET}=load("src/app/api/v1/jobs/route.ts");
  for(const query of ["expMin=5abc","expMin=-1","expMin=9&expMax=3","workMode=invalid","sort=invalid"]){assert.equal((await GET(new Request(`http://localhost/api/v1/jobs?${query}`))).status,400);}
});
test("production job API is empty and status has no invented metrics",async()=>{
  const {load}=app("production");const response=await load("src/app/api/v1/jobs/route.ts").GET(new Request("http://localhost/api/v1/jobs"));assert.equal((await response.json()).data.length,0);
  const status=await load("src/app/api/v1/status/route.ts").GET().json();assert.equal(status.status,"available");assert.equal(status.services.authentication,"candidate-employer-and-admin-sessions");assert.equal(status.services.database,"local-sqlite");assert.equal(status.services.recruitmentSubmissions,"company-applicant-tracking");assert.equal(status.uptime,undefined);
});

test("sitemap lists canonical public routes and excludes duplicate resources", async () => {
  const { load } = app("production");
  const entries = await load("src/app/sitemap.ts").default();
  assert.equal(entries.length, 17);
  assert.ok(entries.some(entry => entry.url === "https://www.atsai.pro/interview-guides"));
  assert.equal(new Set(entries.map(e => e.url)).size, entries.length);
  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.origin, "https://www.atsai.pro");
    assert.ok(!/^\/(admin|api|candidate|employer|recruiter)(?:\/|$)/.test(url.pathname));
    const page = path.join(__dirname, "..", "src/app", url.pathname, "page.tsx");
    const service = path.join(__dirname, "..", "src/app/services/[slug]/page.tsx");
    assert.ok(fs.existsSync(page) || (url.pathname.startsWith("/services/") && fs.readFileSync(service,"utf8").includes(`"${url.pathname.split("/").pop()}":`)));
  }
});

test("production robots permit public pages without blocking candidates and employers", () => {
  const { load } = app("production");
  const robots = load("src/app/robots.ts").default();
  assert.equal(robots.sitemap, "https://www.atsai.pro/sitemap.xml");
  assert.ok(robots.rules.allow.includes("/"));
  assert.ok(robots.rules.allow.includes("/api/media/"));
  assert.ok(robots.rules.disallow.includes("/admin/"));
  assert.ok(robots.rules.disallow.includes("/candidate$"));
  assert.ok(!robots.rules.disallow.includes("/candidate"));
  assert.ok(!robots.rules.disallow.includes("/employer"));
});

test("preview deployments stay noindex while production limits noindex headers to private routes", async () => {
  const preview = app("production");
  preview.context.process.env.VERCEL_ENV = "preview";
  assert.equal(preview.load("src/app/robots.ts").default().rules.disallow, "/");
  const previewHeaders = await preview.load("next.config.ts").default.headers();
  assert.ok(previewHeaders.some(rule => rule.source === "/:path*" && rule.headers.some(h => h.key === "X-Robots-Tag")));
  const production = app("production");
  const headers = await production.load("next.config.ts").default.headers();
  assert.ok(!headers.some(rule => rule.source === "/:path*" && rule.headers.some(h => h.key === "X-Robots-Tag")));
  assert.ok(headers.some(rule => rule.source === "/admin/:path*" && rule.headers.some(h => h.key === "X-Robots-Tag")));
  assert.equal(app().load("src/app/robots.ts").default().rules.disallow, "/");
});

test("public metadata has distinct titles, canonical URLs and complete sharing cards", () => {
  const { load } = app("production");
  const seo = load("src/lib/seo.ts");
  const titles = new Set();
  for (const route of seo.PUBLIC_SITEMAP_PATHS) {
    const meta = seo.staticMetadata(route);
    assert.ok(meta.description.length > 50);
    assert.equal(meta.alternates.canonical, new URL(route, seo.SITE_URL).href);
    assert.equal(meta.openGraph.url, meta.alternates.canonical);
    assert.equal(meta.twitter.card, "summary_large_image");
    assert.equal(meta.robots.index, true);
    assert.ok(!titles.has(meta.title.absolute)); titles.add(meta.title.absolute);
  }
  assert.equal(seo.pageMetadata("/jobs/example", "Example | ATSAI", "Description").title.absolute, "Example | ATSAI");
});

test("job schema uses confirmed facts, full descriptions and excludes expired or unconfirmed jobs", () => {
  const { load } = app("production");
  const { jobPosting, jsonLd, articlePosting } = load("src/lib/structured-data.ts");
  const base = { ...load("src/lib/admin/types.ts").blankRecord("job", "Fixture Owner"), id: "schema-test", slug: "analyst", title: "Data Analyst", company: "Fixture Company", location: "Pune, Maharashtra, India", status: "published", publishedAt: "2026-10-01T00:00:00Z", googleJobs: true, jobOriginalDate: "2026-09-30", jobCity: "Pune", jobRegion: "Maharashtra", jobCountry: "IN", workMode: "Hybrid", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Analyse data & report findings." }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Strong SQL skills required." }] }] }] }] } };
  const now = Date.parse("2026-10-18T00:00:00Z");
  const schema = jobPosting(base, now);
  assert.equal(schema.datePosted, "2026-09-30");
  assert.equal(schema.hiringOrganization.name, "Fixture Company");
  assert.equal(schema.jobLocation.address.addressCountry, "IN");
  assert.ok(schema.description.includes("<ul>"));
  assert.ok(schema.description.includes("Strong SQL"));
  assert.ok(!("baseSalary" in schema));
  assert.ok(!("directApply" in schema));
  assert.ok(!("validThrough" in schema));
  assert.equal(jobPosting({ ...base, googleJobs: false }, now), null);
  assert.equal(jobPosting({ ...base, jobOriginalDate: "" }, now), null);
  assert.equal(jobPosting({ ...base, status: "draft" }, now), null);
  assert.equal(jobPosting({ ...base, expiresAt: "2026-10-17" }, now), null);
  const remote = jobPosting({ ...base, workMode: "Remote", jobCity: "" }, now);
  assert.equal(remote.jobLocationType, "TELECOMMUTE");
  assert.equal(remote.applicantLocationRequirements.name, "IN");
  assert.ok(!("jobLocation" in remote));
  const attack = { headline: "</script><script>alert(1)</script>" };
  assert.ok(!jsonLd(attack).includes("<"));
  assert.equal(JSON.parse(jsonLd(attack)).headline, attack.headline);
  const article = articlePosting({ ...base, kind: "post", author: "Datta Sable", updatedAt: "2026-10-17T00:00:00Z" });
  assert.equal(article.author.name, "Datta Sable");
  assert.equal(article.dateModified, "2026-10-17T00:00:00Z");
});

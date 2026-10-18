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
    Buffer, process: { cwd: () => path.resolve(__dirname, ".."), env: { NODE_ENV: environment, ATSAI_DATABASE_PATH: ":memory:" } }, Date, URL, Request, Response, Event,
    window: events, sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key,value) => records.set(key,value) },
  });
  const cache = new Map();
  function load(file) {
    const full = path.resolve(__dirname, "..", file);
    if (cache.has(full)) return cache.get(full).exports;
    const loaded = { exports: {} }; cache.set(full, loaded);
    const source = ts.transpileModule(fs.readFileSync(full,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = id => id === "server-only" ? {} : id.startsWith("@/") ? load(`src/${id.slice(2)}.ts`) : id.startsWith(".") ? load(path.relative(path.resolve(__dirname,".."),path.resolve(path.dirname(full),id+".ts"))) : nativeRequire(id);
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
test("private API collections reject anonymous reads and all writes",async()=>{
  const {load}=app();for(const route of ["applications","mandates","employers/leads"]){const api=load(`src/app/api/v1/${route}/route.ts`);assert.equal(api.GET().status,401);const response=api.POST();assert.equal(response.status,503);assert.equal((await response.json()).code,"SERVICE_UNAVAILABLE");}
});
test("public submission endpoints never fabricate receipt or notification",()=>{
  const {load}=app();for(const route of ["report-job","privacy-request"]){assert.equal(load(`src/app/api/v1/${route}/route.ts`).POST().status,503);}
  assert.equal(load("src/app/api/v1/verify-recruiter/route.ts").GET().status,503);
});
test("job API rejects invalid ranges and non-integer filters",async()=>{
  const {load}=app();const {GET}=load("src/app/api/v1/jobs/route.ts");
  for(const query of ["expMin=5abc","expMin=-1","expMin=9&expMax=3","workMode=invalid","sort=invalid"]){assert.equal((await GET(new Request(`http://localhost/api/v1/jobs?${query}`))).status,400);}
});
test("production job API is empty and status has no invented metrics",async()=>{
  const {load}=app("production");const response=await load("src/app/api/v1/jobs/route.ts").GET(new Request("http://localhost/api/v1/jobs"));assert.equal((await response.json()).data.length,0);
  const status=await load("src/app/api/v1/status/route.ts").GET().json();assert.equal(status.status,"prototype");assert.equal(status.services.authentication,"admin-sessions-configured");assert.equal(status.services.database,"admin-publishing-sqlite");assert.equal(status.services.recruitmentSubmissions,"not-configured");assert.equal(status.uptime,undefined);
});

test("sitemap lists existing public routes on the live www host without database access", () => {
  const { load } = app("production");
  const entries = load("src/app/sitemap.ts").default();
  assert.equal(entries.length, 17);
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
  assert.equal(robots.rules.allow, "/");
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

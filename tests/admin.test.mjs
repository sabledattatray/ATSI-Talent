import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
function environment(mode = "development") {
  const jar = new Map(); const cookieOptions = new Map(); const cache = new Map();
  const context = vm.createContext({ console, Buffer, URL, Request, Response, File, FormData, Date, setTimeout, clearTimeout, structuredClone, process: { cwd: () => root, env: { NODE_ENV: mode, ATSAI_DATABASE_PATH: ":memory:", ATSAI_ADMIN_SETUP_TOKEN: "test-setup-key-at-least-thirty-two-characters" } } });
  const cookieJar = { get: k => jar.has(k) ? { value: jar.get(k) } : undefined, set: (k, v, options) => { jar.set(k, v); cookieOptions.set(k, options); }, delete: k => jar.delete(k) };
  function load(file) {
    const full = path.resolve(root, file); if (cache.has(full)) return cache.get(full).exports;
    const loaded = { exports: {} }; cache.set(full, loaded);
    const source = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const require = id => id === "server-only" ? {} : id === "next/headers" ? { cookies: async () => cookieJar } : id.startsWith("@/") ? load(`src/${id.slice(2)}.ts`) : id.startsWith(".") ? load(path.resolve(path.dirname(full), `${id}.ts`)) : nativeRequire(id);
    vm.runInContext(`(function(require,module,exports){${source}\n})`, context, { filename: full })(require, loaded, loaded.exports); return loaded.exports;
  }
  const route = load("src/app/api/admin/[...path]/route.ts");
  async function request(endpoint, body, method = "POST", origin = "http://localhost:3001") {
    const headers = { origin }; if (!(body instanceof FormData)) headers["content-type"] = "application/json";
    return route[method](new Request(`http://localhost:3001/api/admin/${endpoint}`, { method, headers, body: method === "GET" ? undefined : body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }), { params: Promise.resolve({ path: endpoint.split("/") }) });
  }
  return { load, request, jar, cookieOptions };
}
const owner = { name: "Test Owner", email: "owner@example.test", password: "Strong-test-passphrase-2026" };
test("admin authentication, publishing, authorization, media and session lifecycle", async () => {
  const e = environment(); const { request, load, jar } = e;
  assert.equal((await request("workspace", undefined, "GET")).status, 401);
  assert.equal((await request("auth/signup", owner, "POST", "https://attacker.test")).status, 403);
  assert.equal((await request("auth/signup", owner)).status, 201);
  const cookie = e.cookieOptions.get("atsai_admin_session"); assert.equal(cookie.httpOnly, true); assert.equal(cookie.sameSite, "strict");
  const database = load("src/lib/admin/db.ts").db();
  const stored = database.prepare("SELECT password FROM users WHERE email=?").get(owner.email).password;
  assert.notEqual(stored, owner.password); assert.match(stored, /^[a-f0-9]+:[a-f0-9]+$/);
  const types = load("src/lib/admin/types.ts");
  const draft = { ...types.blankRecord("post", "Editorial Team"), title: "A useful career guide", slug: "a-useful-career-guide", excerpt: "Practical guidance for your next career move.", content: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A thoughtful next step" }] }, { type: "paragraph", content: [{ type: "text", text: "This is a complete test article, with useful details for job seekers.", marks: [{ type: "bold" }] }] }] } };
  let result = await request("content", draft); assert.equal(result.status, 200); let post = (await result.json()).record;
  assert.equal(load("src/lib/admin/db.ts").records("post", true).length, 0, "drafts stay private");
  result = await request("content", { ...post, status: "published" }); assert.equal(result.status, 200); post = (await result.json()).record;
  assert.equal(load("src/lib/admin/db.ts").records("post", true).length, 1);
  assert.equal((await request("content", { ...post, version: 1 })).status, 409, "stale writes are rejected");
  assert.equal((await request("content", { ...draft, id: "", content: { type: "doc", content: [{ type: "script", text: "alert(1)" }] } })).status, 400);
  assert.equal((await request("content", { ...draft, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bad link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] } })).status, 400);
  const job = { ...types.blankRecord("job", "Hiring Team"), title: "Senior Data Analyst", slug: "senior-data-analyst", status: "published", excerpt: "An opportunity to build meaningful analytics.", company: "Test Company", location: "Pune", content: draft.content };
  result = await request("content", job); assert.equal(result.status, 200); const savedJob = (await result.json()).record;
  assert.equal(load("src/lib/admin/public.ts").publicJobs()[0].title, job.title);
  assert.equal((await request("content", { ...savedJob, expiresAt: "2000-01-01" })).status, 400);
  const unsafe = new FormData(); unsafe.set("file", new File(["<svg onload='alert(1)'/>"], "bad.png", { type: "image/png" })); assert.equal((await request("media", unsafe)).status, 400);
  const png = new FormData(); png.set("file", new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64")], "test.png", { type: "image/png" })); result = await request("media", png); assert.equal(result.status, 201); const image = (await result.json()).media;
  result = await request("content", { ...post, cover: image.url }); assert.equal(result.status, 200); post = (await result.json()).record;
  assert.equal((await request(`media/${image.id}`, undefined, "DELETE")).status, 409, "in-use media cannot be deleted");
  result = await request("invites", { email: "editor@example.test" }); assert.equal(result.status, 200); const invitation = new URL((await result.json()).url, "http://localhost").searchParams.get("invite");
  await request("auth/logout", {}); assert.equal((await request("workspace", undefined, "GET")).status, 401);
  assert.equal((await request("auth/signup", { ...owner, email: "uninvited@example.test" })).status, 403);
  result = await request("auth/signup", { name: "Editor", email: "editor@example.test", password: owner.password, invite: invitation }); assert.equal(result.status, 201);
  assert.equal((await request("settings", { siteName: "Hijacked" })).status, 403);
  assert.equal((await request("invites", { email: "another@example.test" })).status, 403);
  const editorSession = jar.get("atsai_admin_session");
  assert.equal((await request("auth/login", owner)).status, 200);
  assert.equal((await request(`content/${savedJob.id}`, undefined, "DELETE")).status, 200);
  assert.equal(load("src/lib/admin/public.ts").publicJobs().length, 0, "archiving removes public jobs");
  const editorId = database.prepare("SELECT id FROM users WHERE email=?").get("editor@example.test").id;
  assert.equal((await request(`users/${editorId}`, undefined, "DELETE")).status, 200);
  jar.set("atsai_admin_session", editorSession); assert.equal((await request("workspace", undefined, "GET")).status, 401, "revoked users lose all sessions");
  assert.ok(load("src/lib/admin/db.ts").activity().length > 5);
});
test("production owner setup requires the server setup key", async () => {
  const e = environment("production"); assert.equal((await e.request("auth/signup", owner)).status, 403);
  assert.equal((await e.request("auth/signup", { ...owner, setupToken: "test-setup-key-at-least-thirty-two-characters" })).status, 201);
  assert.equal(e.cookieOptions.get("atsai_admin_session").secure, true);
});
test("password guesses are rate limited", async () => { const e = environment(); for (let i = 0; i < 12; i++) assert.equal((await e.request("auth/login", owner)).status, 401); assert.equal((await e.request("auth/login", owner)).status, 429); });

test("malformed editor documents are rejected without server errors", async () => {
  const e = environment();
  assert.equal((await e.request("auth/signup", owner)).status, 201);
  const blank = e.load("src/lib/admin/types.ts").blankRecord("post", "Editorial Team");
  const base = { ...blank, title: "Validation regression", slug: "validation-regression", excerpt: "A real summary for this validation regression test." };
  for (const node of [
    { type: "paragraph", content: [{ type: "text", text: "Invalid formatting", marks: [null] }] },
    { type: "paragraph", content: [{ type: "text", text: "Invalid formatting", marks: null }] },
    { type: "heading", attrs: { level: 99 }, content: [{ type: "text", text: "Invalid heading level" }] },
    { type: "paragraph", attrs: [], content: [{ type: "text", text: "Invalid attributes" }] },
    { type: "image", attrs: { src: "" } },
  ]) {
    assert.equal((await e.request("content", { ...base, content: { type: "doc", content: [node] } })).status, 400);
  }
  const empty = { type: "doc", content: [{ type: "paragraph", attrs: { textAlign: "left" } }, { type: "paragraph", attrs: { textAlign: "center" } }] };
  assert.equal((await e.request("content", { ...base, status: "published", content: empty })).status, 400, "Empty documents cannot be published by padding their JSON");
  assert.equal((await e.request("content", { ...base, status: "draft", content: empty })).status, 200, "Empty drafts remain valid");
});

test("non-ASCII setup-key guesses return an authorization error", async () => {
  const e = environment("production");
  const setupToken = "é".repeat("test-setup-key-at-least-thirty-two-characters".length);
  assert.equal((await e.request("auth/signup", { ...owner, setupToken })).status, 403);
});

test("published jobs are available consistently through list and detail APIs", async () => {
  const e = environment();
  await e.request("auth/signup", owner);
  const blank = e.load("src/lib/admin/types.ts").blankRecord("job", "Hiring Team");
  const input = { ...blank, title: "Public API job", slug: "public-api-job", status: "published", company: "Example Employer", location: "Pune", excerpt: "A published opportunity for the API integration test.", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "This role requires strong communication and analytical thinking." }] }] } };
  const saved = await (await e.request("content", input)).json();
  const list = await e.load("src/app/api/v1/jobs/route.ts").GET(new Request("http://localhost/api/v1/jobs?q=Public"));
  assert.ok((await list.json()).data.some(j => j.id === saved.record.id));
  const detailApi = e.load("src/app/api/v1/jobs/[id]/route.ts");
  const context = { params: Promise.resolve({ id: input.slug }) };
  assert.equal((await detailApi.GET(new Request("http://localhost/api/v1/jobs/public-api-job"), context)).status, 200);
  await e.request(`content/${saved.record.id}`, undefined, "DELETE");
  assert.equal((await detailApi.GET(new Request("http://localhost/api/v1/jobs/public-api-job"), context)).status, 404);
});

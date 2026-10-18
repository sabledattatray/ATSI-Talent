import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
function environment(mode = "development", overrides = {}, clientFactory) {
  const jar = new Map(); const cookieOptions = new Map(); const cache = new Map();
  const context = vm.createContext({ console, Buffer, URL, Request, Response, File, FormData, Date, setTimeout, clearTimeout, structuredClone, process: { cwd: () => root, env: { NODE_ENV: mode, ATSAI_DATABASE_PATH: ":memory:", ATSAI_ADMIN_SETUP_TOKEN: "test-setup-key-at-least-thirty-two-characters", ...overrides } } });
  const cookieJar = { get: k => jar.has(k) ? { value: jar.get(k) } : undefined, set: (k, v, options) => { jar.set(k, v); cookieOptions.set(k, options); }, delete: k => jar.delete(k) };
  function load(file) {
    const full = path.resolve(root, file); if (cache.has(full)) return cache.get(full).exports;
    const loaded = { exports: {} }; cache.set(full, loaded);
    const source = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const require = id => id === "@libsql/client" && clientFactory ? { createClient: clientFactory } : id === "server-only" ? {} : id === "next/headers" ? { cookies: async () => cookieJar } : id.startsWith("@/") ? load(`src/${id.slice(2)}.ts`) : id.startsWith(".") ? load(path.resolve(path.dirname(full), `${id}.ts`)) : nativeRequire(id);
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
  const stored = (await database.prepare("SELECT password FROM users WHERE email=?").get(owner.email)).password;
  assert.notEqual(stored, owner.password); assert.match(stored, /^[a-f0-9]+:[a-f0-9]+$/);
  const types = load("src/lib/admin/types.ts");
  const draft = { ...types.blankRecord("post", "Editorial Team"), title: "A useful career guide", slug: "a-useful-career-guide", excerpt: "Practical guidance for your next career move.", content: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A thoughtful next step" }] }, { type: "paragraph", content: [{ type: "text", text: "This is a complete test article, with useful details for job seekers.", marks: [{ type: "bold" }] }] }] } };
  let result = await request("content", draft); assert.equal(result.status, 200); let post = (await result.json()).record;
  assert.equal((await load("src/lib/admin/db.ts").records("post", true)).length, 0, "drafts stay private");
  result = await request("content", { ...post, status: "published" }); assert.equal(result.status, 200); post = (await result.json()).record;
  assert.equal((await load("src/lib/admin/db.ts").records("post", true)).length, 1);
  assert.equal((await request("content", { ...post, version: 1 })).status, 409, "stale writes are rejected");
  assert.equal((await request("content", { ...draft, id: "", content: { type: "doc", content: [{ type: "script", text: "alert(1)" }] } })).status, 400);
  assert.equal((await request("content", { ...draft, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bad link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] } })).status, 400);
  const job = { ...types.blankRecord("job", "Hiring Team"), title: "Senior Data Analyst", slug: "senior-data-analyst", status: "published", excerpt: "An opportunity to build meaningful analytics.", company: "Test Company", location: "Pune", content: draft.content };
  result = await request("content", job); assert.equal(result.status, 200); const savedJob = (await result.json()).record;
  assert.equal((await load("src/lib/admin/public.ts").publicJobs())[0].title, job.title);
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
  assert.equal((await load("src/lib/admin/public.ts").publicJobs()).length, 0, "archiving removes public jobs");
  const editorId = (await database.prepare("SELECT id FROM users WHERE email=?").get("editor@example.test")).id;
  assert.equal((await request(`users/${editorId}`, undefined, "DELETE")).status, 200);
  jar.set("atsai_admin_session", editorSession); assert.equal((await request("workspace", undefined, "GET")).status, 401, "revoked users lose all sessions");
  assert.ok((await load("src/lib/admin/db.ts").activity()).length > 5);
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

test("Vercel uses Turso credentials and initializes the existing schema", async () => {
  let supplied;
  const e = environment("production", { VERCEL: "1", TURSO_DATABASE_URL: "libsql://example.turso.io", TURSO_AUTH_TOKEN: "fictional-test-token", ATSAI_DATABASE_PATH: "/unwritable/should-not-be-used.sqlite" }, config => {
    supplied = config;
    return nativeRequire("@libsql/client").createClient({ url: ":memory:" });
  });
  const setup = await e.request("setup", undefined, "GET");
  assert.equal(setup.status, 200);
  assert.equal((await setup.json()).needsSetup, true);
  assert.equal(supplied.url, "libsql://example.turso.io");
  assert.equal(supplied.authToken, "fictional-test-token");
  assert.equal((await e.request("auth/signup", { ...owner, setupToken: "test-setup-key-at-least-thirty-two-characters" })).status, 201);
  assert.equal((await e.request("workspace", undefined, "GET")).status, 200);
});

test("missing or partial Turso configuration never falls back to Vercel filesystem storage", async () => {
  for (const config of [{}, { TURSO_DATABASE_URL: "libsql://example.turso.io" }, { TURSO_AUTH_TOKEN: "fictional-test-token" }]) {
    const e = environment("production", { VERCEL: "1", ...config });
    assert.equal((await e.request("setup", undefined, "GET")).status, 503);
  }
});

test("async transactions roll back all writes when a later operation fails", async () => {
  const e = environment();
  const storage = e.load("src/lib/admin/db.ts");
  await assert.rejects(storage.transaction(async () => {
    await storage.db().prepare("INSERT INTO audit VALUES (?,?,?,?,?)").run("rollback-test", "test", "Should roll back", "fixture", new Date().toISOString());
    await Promise.resolve();
    throw new Error("Stop the transaction");
  }), /Stop the transaction/);
  assert.equal((await storage.activity()).length, 0);
  await storage.audit("test", "After rollback", "A subsequent operation still works");
  assert.equal((await storage.activity()).length, 1);
});

test("concurrent edits preserve version checks across asynchronous transactions", async () => {
  const e = environment();
  await e.request("auth/signup", owner);
  const blank = e.load("src/lib/admin/types.ts").blankRecord("post", "Test editor");
  const record = (await (await e.request("content", { ...blank, title: "Concurrent article", slug: "concurrent-article" })).json()).record;
  const responses = await Promise.all([
    e.request("content", { ...record, title: "First edit" }),
    e.request("content", { ...record, title: "Second edit" }),
  ]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const saved = await e.load("src/lib/admin/db.ts").records("post");
  assert.equal(saved[0].version, record.version + 1);
});

test("uploaded images are read back correctly through async BLOB queries", async () => {
  const e = environment();
  await e.request("auth/signup", owner);
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64");
  const body = new FormData(); body.set("file", new File([bytes], "fixture.png", { type: "image/png" }));
  const uploaded = await (await e.request("media", body)).json();
  const response = await e.load("src/app/api/media/[id]/route.ts").GET(new Request("http://localhost/api/media/fixture"), { params: Promise.resolve({ id: uploaded.media.id }) });
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
});

test("archiving and concurrent editing cannot silently restore an archived record", async () => {
  const e = environment();
  await e.request("auth/signup", owner);
  const blank = e.load("src/lib/admin/types.ts").blankRecord("post", "Test editor");
  const record = (await (await e.request("content", { ...blank, title: "Archive race", slug: "archive-race" })).json()).record;
  const responses = await Promise.all([
    e.request(`content/${record.id}`, undefined, "DELETE"),
    e.request("content", { ...record, title: "Stale edit" }),
  ]);
  assert.equal(responses[0].status, 200);
  assert.ok([200,409].includes(responses[1].status));
  const saved = (await e.load("src/lib/admin/db.ts").records("post"))[0];
  assert.equal(saved.status, "archived");
});

test("pinned database credentials override the integration as a pair and fail closed when incomplete", async () => {
  const integration = { VERCEL: "1", TURSO_DATABASE_URL: "libsql://integration.turso.io", TURSO_AUTH_TOKEN: "integration-fixture" };
  let supplied;
  const e = environment("production", { ...integration, ATSAI_TURSO_DATABASE_URL: "libsql://owner-branch.turso.io", ATSAI_TURSO_AUTH_TOKEN: "pinned-fixture" }, config => {
    supplied = config;
    return nativeRequire("@libsql/client").createClient({ url: ":memory:" });
  });
  assert.equal((await e.request("setup", undefined, "GET")).status, 200);
  assert.equal(supplied.url, "libsql://owner-branch.turso.io");
  assert.equal(supplied.authToken, "pinned-fixture");
  for (const partial of [{ ATSAI_TURSO_DATABASE_URL: "libsql://owner-branch.turso.io" }, { ATSAI_TURSO_AUTH_TOKEN: "pinned-fixture" }]) {
    const broken = environment("production", { ...integration, ...partial });
    assert.equal((await broken.request("setup", undefined, "GET")).status, 503);
  }
});

test("font size and color survive publishing while unsafe styles are rejected", async () => {
  const e = environment();
  await e.request("auth/signup", owner);
  const makeDoc = attrs => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "A useful role with custom typography for candidates.", marks: [{ type: "bold" }, { type: "textStyle", attrs }] }] }] });
  const content = makeDoc({ color: "#2456aa", fontSize: "24px" });
  const record = { ...e.load("src/lib/admin/types.ts").blankRecord("post", "Test Owner"), title: "Formatted recruitment guide", slug: "formatted-recruitment-guide", excerpt: "Typography fixture", status: "published", content };
  const response = await e.request("content", record);
  assert.equal(response.status, 200);
  const saved = (await response.json()).record;
  const stored = (await e.load("src/lib/admin/db.ts").records("post", true)).find(row => row.id === saved.id);
  assert.equal(JSON.stringify(stored.content), JSON.stringify(content));
  const { validDocument } = e.load("src/lib/admin/validation.ts");
  assert.equal(validDocument(makeDoc({ color: "rgb(36, 86, 170)", fontSize: "96px" })), true);
  for (const attrs of [{ color: "url(https://example.test)" }, { fontSize: "200px" }, { fontSize: "1px;display:none" }, { color: "rgb(999,0,0)" }, { position: "fixed" }]) {
    assert.equal(validDocument(makeDoc(attrs)), false);
  }
  const compiled = ts.transpileModule(fs.readFileSync("src/components/admin/RichContent.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`)(id => id === "@/lib/admin/text-style" ? e.load("src/lib/admin/text-style.ts") : nativeRequire(id), mod, mod.exports);
  const html = nativeRequire("react-dom/server").renderToStaticMarkup(nativeRequire("react").createElement(mod.exports.RichContent, { document: stored.content }));
  assert.match(html, /color:#2456aa;font-size:24px/);
  assert.match(html, /<strong>/);
});

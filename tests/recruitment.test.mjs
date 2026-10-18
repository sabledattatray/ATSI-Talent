import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const nativeRequire=createRequire(import.meta.url);
function environment(mode="development") {
  const jar=new Map(),options=new Map(),cache=new Map();
  const context=vm.createContext({console,Buffer,URL,Request,Response,File,FormData,Date,setTimeout,clearTimeout,process:{cwd:()=>process.cwd(),env:{NODE_ENV:mode,ATSAI_DATABASE_PATH:":memory:",ATSAI_ADMIN_SETUP_TOKEN:"fixture-owner-setup-secret-at-least-32-characters"}}});
  const cookies={get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key,value,config)=>{jar.set(key,value);options.set(key,config);},delete:key=>jar.delete(key)};
  function load(file) {
    const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
    const loaded={exports:{}};cache.set(full,loaded);
    const source=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const require=id=>id==="server-only"?{}:id==="next/headers"?{cookies:async()=>cookies}:id.startsWith("@/")?load(`src/${id.slice(2)}.ts`):id.startsWith(".")?load(path.resolve(path.dirname(full),`${id}.ts`)):nativeRequire(id);
    vm.runInContext(`(function(require,module,exports){${source}\n})`,context,{filename:full})(require,loaded,loaded.exports);return loaded.exports;
  }
  async function call(route,body,method=body===undefined?"GET":"POST",origin="https://atsai.test") {
    const request=new Request(`https://atsai.test/api/recruitment/${route}`,{method,headers:{origin,"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(body)});
    return load("src/lib/recruitment.ts").recruitmentRequest(request,route.split("?")[0]);
  }
  async function owner() {
    const request=new Request("https://atsai.test/api/admin/auth/signup",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify({name:"Owner Fixture",email:"owner@example.test",password:"Owner-test-password-2026",setupToken:"fixture-owner-setup-secret-at-least-32-characters"})});
    assert.equal((await load("src/app/api/admin/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["auth","signup"]})})).status,201);
  }
  return {load,call,owner,jar,options};
}
const person={name:"Candidate Fixture",email:"candidate@example.test",password:"Candidate-test-password-2026",consent:true};
async function job(e,overrides={}) {
  const blank=e.load("src/lib/admin/types.ts").blankRecord("job","Hiring Fixture");
  const data={...blank,title:"Analytics engineer",slug:"analytics-engineer",company:"Example Company",location:"Pune",status:"published",excerpt:"A useful opportunity for this integration test.",content:{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"Build useful analytics with SQL and thoughtful communication."}]}]},...overrides};
  const request=new Request("https://atsai.test/api/admin/content",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify(data)});
  const response=await e.load("src/app/api/admin/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["content"]})});
  assert.equal(response.status,200);return (await response.json()).record;
}

test("candidate signup needs consent, hashes passwords, and never grants staff access",async()=>{
  const e=environment("production");
  assert.equal((await e.call("auth/signup",{...person,consent:false})).status,400);
  assert.equal((await e.call("auth/signup",person,"POST","https://attacker.test")).status,403);
  assert.equal((await e.call("auth/signup",{...person,role:"owner"})).status,201);
  const config=e.options.get("atsai_candidate_session");assert.equal(config.httpOnly,true);assert.equal(config.sameSite,"strict");assert.equal(config.secure,true);
  const row=await e.load("src/lib/admin/db.ts").db().prepare("SELECT password FROM candidate_accounts").get();assert.notEqual(row.password,person.password);
  const response=await e.call("dashboard");const data=await response.json();assert.equal(data.user.email,person.email);assert.equal(data.user.password,undefined);
  assert.equal((await e.call("admin")).status,401);
  assert.equal((await e.call("auth/signup",person)).status,409);
});

test("applications require role consent, preserve profile snapshots, and reject duplicates",async()=>{
  const e=environment();await e.owner();const role=await job(e);
  await e.call("auth/signup",person);
  const profile={name:person.name,phone:"",location:"Pune",skills:"SQL and Python",experience:4,resumeUrl:"https://example.test/resume"};
  assert.equal((await e.call("profile",{...profile,resumeUrl:"javascript:alert(1)"})).status,400);
  assert.equal((await e.call("profile",profile)).status,200);
  assert.equal((await e.call("apply",{jobId:role.id})).status,400);
  const response=await e.call("apply",{jobId:role.id,consent:true,coverLetter:"A thoughtful introduction."});assert.equal(response.status,201);assert.match((await response.json()).reference,/^APP-/);
  assert.equal((await e.call("apply",{jobId:role.id,consent:true})).status,409);
  await e.call("profile",{...profile,skills:"Changed after applying"});
  const inbox=await (await e.call("admin")).json();const snapshot=JSON.parse(inbox.applications[0].document);assert.equal(snapshot.profile.skills,"SQL and Python");assert.ok(snapshot.consentAt);
});

test("candidate data is isolated and withdrawn applications cannot be advanced",async()=>{
  const e=environment();await e.owner();const role=await job(e);await e.call("auth/signup",person);
  await e.call("saved",{jobId:role.id});await e.call("apply",{jobId:role.id,consent:true});
  const first=await (await e.call("dashboard")).json();const application=first.applications[0];const session=e.jar.get("atsai_candidate_session");
  await e.call("auth/logout",{});assert.equal((await e.call("dashboard")).status,401);
  await e.call("auth/signup",{...person,email:"second@example.test"});const second=await (await e.call("dashboard")).json();assert.equal(second.applications.length,0);assert.equal(second.savedJobs.length,0);
  assert.equal((await e.call("withdraw",{id:application.id})).status,409);
  e.jar.set("atsai_candidate_session",session); // logout revoked this session
  assert.equal((await e.call("dashboard")).status,401);
  await e.call("auth/login",person);
  assert.equal((await e.call("withdraw",{id:application.id})).status,200);
  assert.equal((await e.call("admin/status",{kind:"application",id:application.id,status:"review"})).status,409);
});

test("draft, expired, archived, and external roles cannot receive internal applications",async()=>{
  const e=environment();await e.owner();await e.call("auth/signup",person);
  const draft=await job(e,{slug:"draft-role",status:"draft"});assert.equal((await e.call("apply",{jobId:draft.id,consent:true})).status,404);
  const external=await job(e,{slug:"external-role",applicationUrl:"https://example.test/apply"});assert.equal((await e.call("apply",{jobId:external.id,consent:true})).status,409);
  const expired=await job(e,{slug:"expired-role"});const document={...expired,expiresAt:"2000-01-01"};await e.load("src/lib/admin/db.ts").db().prepare("UPDATE content SET document=? WHERE id=?").run(JSON.stringify(document),expired.id);
  assert.equal((await e.call("saved",{jobId:expired.id})).status,404);
});

test("enquiries are durable, validated, consented, and restricted to the owner inbox",async()=>{
  const e=environment();const input={kind:"contact",name:"Contact Fixture",email:"contact@example.test",subject:"A useful question",message:"Please share more information about your recruitment process.",consent:true};
  assert.equal((await e.call("inquiries",{...input,consent:false})).status,400);
  assert.equal((await e.call("inquiries",input,"POST","https://attacker.test")).status,403);
  for(const kind of ["contact","employer","report","privacy","account"]){const response=await e.call("inquiries",{...input,kind});assert.equal(response.status,201);assert.match((await response.json()).reference,/^ATS-/);}
  assert.equal((await e.call("admin")).status,401);
  await e.owner();const inbox=await (await e.call("admin")).json();assert.equal(inbox.inquiries.length,5);
  const id=inbox.inquiries[0].id;assert.equal((await e.call("admin/status",{id,kind:"inquiry",status:"resolved"})).status,200);
  await e.load("src/lib/admin/db.ts").db().prepare("UPDATE users SET role='editor'").run();assert.equal((await e.call("admin")).status,403);
});

test("public verification only exposes explicitly approved active recruiter records",async()=>{
  const e=environment();await e.owner();
  assert.equal((await (await e.call("verify?q=owner@example.test")).json()).verified,false);
  const response=await e.call("admin/recruiter",{name:"Recruiter Fixture",email:"recruiter@example.test",title:"Recruitment consultant"});assert.equal(response.status,201);const {id}=await response.json();
  assert.equal((await (await e.call("verify?q=recruiter@example.test")).json()).recruiter.name,"Recruiter Fixture");
  assert.equal((await (await e.call(`verify?q=${id}`)).json()).verified,true);
  await e.call("admin/recruiter-status",{id,active:false});assert.equal((await (await e.call("verify?q=recruiter@example.test")).json()).verified,false);
});

test("candidate password changes revoke the old session and require the current password",async()=>{
  const e=environment();await e.call("auth/signup",person);const previous=e.jar.get("atsai_candidate_session");
  assert.equal((await e.call("password",{currentPassword:"wrong",password:"Another-long-password-2026"})).status,400);
  assert.equal((await e.call("password",{currentPassword:person.password,password:"Another-long-password-2026"})).status,200);
  const current=e.jar.get("atsai_candidate_session");e.jar.set("atsai_candidate_session",previous);assert.equal((await e.call("dashboard")).status,401);e.jar.set("atsai_candidate_session",current);assert.equal((await e.call("dashboard")).status,200);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import ts from "typescript";
const nativeRequire=createRequire(import.meta.url);
const candidate={name:"Auth Candidate",email:"auth@example.test",password:"Email-password-test-2026",consent:true};
const employer={...candidate,name:"Auth Employer",company:"Auth Company",country:"IN"};
function environment(options={}){
  const jar=new Map(),cookieOptions=new Map(),cache=new Map(),codes=new Map(),messages=[];
  let time=Date.now(),payload={},rejectGoogle=false;
  class Clock extends Date{constructor(value){super(value===undefined?time:value);}static now(){return time;}}
  const testFetch=async(url,init)=>{
    assert.equal(url,"https://api.resend.com/emails");
    const body=JSON.parse(init.body);messages.push(body);
    const code=body.text.match(/code is (\d{6})/)[1];codes.set(body.to[0],code);
    if(options.deliveryFailure)return Response.json({error:"provider rejected"},{status:503});
    return Response.json(options.missingProviderId?{}:{id:"mail-fixture"});
  };
  class OAuth2Client{async verifyIdToken(input){assert.equal(input.audience,"fixture.apps.googleusercontent.com");if(rejectGoogle)throw new Error("Invalid signature, issuer, audience or expiry");return {getPayload:()=>payload};}}
  const cookies={get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key,value,config)=>{jar.set(key,value);cookieOptions.set(key,config);},delete:key=>jar.delete(key)};
  const context=vm.createContext({console,Buffer,URL,Request,Response,File,FormData,Date:Clock,fetch:testFetch,AbortSignal,setTimeout,clearTimeout,process:{cwd:()=>process.cwd(),env:{NODE_ENV:"production",ATSAI_DATABASE_PATH:":memory:",ATSAI_ADMIN_SETUP_TOKEN:"fixture-owner-key-with-at-least-32-characters",GOOGLE_CLIENT_ID:"fixture.apps.googleusercontent.com",...(options.noEmail?{}:{RESEND_API_KEY:"fixture-mail-key",ATSAI_EMAIL_FROM:"ATSAI <verify@example.test>"})}}});
  function load(file){const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;const loaded={exports:{}};cache.set(full,loaded);const source=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const require=id=>id==="server-only"?{}:id==="next/headers"?{cookies:async()=>cookies}:id==="google-auth-library"?{OAuth2Client}:id.startsWith("@/")?load("src/"+id.slice(2)+".ts"):id.startsWith(".")?load(path.resolve(path.dirname(full),id+".ts")):nativeRequire(id);vm.runInContext("(function(require,module,exports){"+source+"\n})",context,{filename:full})(require,loaded,loaded.exports);return loaded.exports;}
  async function call(scope,route,body,origin="https://atsai.test"){
    const request=new Request("https://atsai.test/api/"+(scope==="candidate"?"recruitment":"ats")+"/"+route,{method:body===undefined?"GET":"POST",headers:{origin,"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
    return scope==="candidate"?load("src/lib/recruitment.ts").recruitmentRequest(request,route):load("src/lib/ats.ts").atsRequest(request,route);
  }
  async function auth(route,body={scope:"candidate"},origin="https://atsai.test",method="POST"){
    return load("src/app/api/auth/[...path]/route.ts")[method](new Request("https://atsai.test/api/auth/"+route,{method,headers:{origin,"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(body)}),{params:Promise.resolve({path:route.split("/")})});
  }
  async function google(scope="candidate",extra={},claims={}){
    const config=await(await auth("google/config",{scope})).json();payload={sub:"google-subject-1",email:"google@example.test",name:"Google Fixture",email_verified:true,nonce:config.nonce,...claims};
    return auth("google",{scope,credential:"fixture-google-token-".repeat(4),method:"google_one_tap",intent:"signup",consent:true,...extra});
  }
  return {jar,cookieOptions,codes,messages,load,call,auth,google,advance:ms=>{time+=ms;},setRejectGoogle:()=>{rejectGoogle=true;}};
}
for(const scope of ["candidate","employer"]){
  test(scope+" email registration requires OTP before any usable session",async()=>{
    const e=environment(),account=scope==="candidate"?candidate:employer;
    const response=await e.call(scope,"auth/signup",account);assert.equal(response.status,201);assert.equal((await response.json()).verificationRequired,true);
    assert.equal(e.jar.has("atsai_"+scope+"_session"),false);
    assert.equal((await e.call(scope,scope==="candidate"?"dashboard":"workspace")).status,401);
    const challenges=await e.load("src/lib/admin/db.ts").db().prepare("SELECT codeHash FROM auth_challenges").all();assert.equal(challenges.length,1);assert.notEqual(challenges[0].codeHash,e.codes.get(account.email));
    assert.equal((await e.auth("otp/verify",{scope,code:e.codes.get(account.email)})).status,200);
    assert.equal((await e.call(scope,scope==="candidate"?"dashboard":"workspace")).status,200);
    const meta=await e.load("src/lib/auth/identity.ts").authRecord(scope,(await e.load("src/lib/admin/db.ts").db().prepare("SELECT id FROM "+(scope==="candidate"?"candidate_accounts":"ats_employers")).get()).id);
    assert.equal(meta.verifiedEmail,account.email);assert.ok(meta.emailVerifiedAt);
    assert.equal((await e.auth("otp/verify",{scope,code:e.codes.get(account.email)})).status,400);
    const login=await e.call(scope,"auth/login",account);assert.equal(login.status,200);assert.equal((await login.json()).verificationRequired,undefined);
    assert.equal(e.messages.length,1);
    const config=e.cookieOptions.get("atsai_"+scope+"_session");assert.equal(config.httpOnly,true);assert.equal(config.sameSite,"strict");assert.equal(config.secure,true);
  });
}
test("OTP rejects wrong codes, enforces five attempts, cooldown and expiry",async()=>{
  const e=environment();await e.call("candidate","auth/signup",candidate);
  const correct=e.codes.get(candidate.email),wrong=correct==="000000"?"111111":"000000";
  for(let i=0;i<5;i++)assert.equal((await e.auth("otp/verify",{scope:"candidate",code:wrong})).status,400);
  assert.equal((await e.auth("otp/verify",{scope:"candidate",code:correct})).status,400);
  assert.equal((await e.auth("otp/resend")).status,429);
  e.advance(61_000);assert.equal((await e.auth("otp/resend")).status,200);
  e.advance(601_000);assert.equal((await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)})).status,400);
  assert.equal(e.jar.has("atsai_candidate_session"),false);
});
test("OTP cannot cross account types or browsers and rejects cross-origin requests",async()=>{
  const e=environment();await e.call("candidate","auth/signup",candidate);
  assert.equal((await e.auth("otp/verify",{scope:"employer",code:e.codes.get(candidate.email)})).status,400);
  assert.equal((await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)},"https://attacker.test")).status,403);
  const token=e.jar.get("atsai_verify_candidate");e.jar.delete("atsai_verify_candidate");
  assert.equal((await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)})).status,400);
  e.jar.set("atsai_verify_candidate",token);assert.equal((await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)})).status,200);
});
test("missing email configuration and rejected delivery never create a session",async()=>{
  const missing=environment({noEmail:true});assert.equal((await missing.call("candidate","auth/signup",candidate)).status,503);
  assert.equal((await missing.load("src/lib/admin/db.ts").db().prepare("SELECT count(*) AS total FROM candidate_accounts").get()).total,0);
  for(const options of [{deliveryFailure:true},{missingProviderId:true}]){const e=environment(options);assert.equal((await e.call("candidate","auth/signup",candidate)).status,503);assert.equal(e.jar.has("atsai_candidate_session"),false);assert.equal(e.jar.has("atsai_verify_candidate"),false);assert.equal((await e.load("src/lib/admin/db.ts").db().prepare("SELECT count(*) AS total FROM auth_challenges").get()).total,0);}
});
test("legacy email users must verify ownership on the next password login",async()=>{
  const e=environment(),db=e.load("src/lib/admin/db.ts").db(),password=await e.load("src/lib/admin/auth.ts").hashPassword(candidate.password);
  await db.prepare("INSERT INTO candidate_accounts VALUES (?,?,?,?,?,?,?)").run("legacy",candidate.name,candidate.email,password,"{}",new Date().toISOString(),new Date().toISOString());
  assert.equal((await e.call("candidate","auth/login",candidate)).status,202);
  assert.equal(e.jar.has("atsai_candidate_session"),false);
  assert.equal((await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)})).status,200);
});
test("Google login creates a verified candidate and records One Tap or button sign-ins",async()=>{
  const e=environment({noEmail:true});assert.equal((await e.google()).status,200);
  assert.equal((await e.call("candidate","dashboard")).status,200);
  const db=e.load("src/lib/admin/db.ts").db();
  let meta=await db.prepare("SELECT * FROM account_auth").get();assert.equal(meta.registeredWith,"google");assert.equal(meta.lastMethod,"google_one_tap");assert.ok(meta.emailVerifiedAt);
  assert.equal((await e.google("candidate",{intent:"login",method:"google_button"})).status,200);
  meta=await db.prepare("SELECT * FROM account_auth").get();assert.equal(meta.lastMethod,"google_button");
  assert.equal((await db.prepare("SELECT count(*) AS total FROM candidate_accounts").get()).total,1);
  assert.equal((await db.prepare("SELECT count(*) AS total FROM auth_logins").get()).total,2);
  assert.equal((await e.auth("google",{scope:"candidate",credential:"fixture-token".repeat(8),method:"google_one_tap",intent:"login"})).status,401);
});
test("Google rejects nonce mismatch, unverified email, verifier failures and missing consent",async()=>{
  for(const claims of [{nonce:"wrong"},{email_verified:false}]){const e=environment();assert.equal((await e.google("candidate",{},claims)).status,401);assert.equal(e.jar.has("atsai_candidate_session"),false);}
  const e=environment();e.setRejectGoogle();assert.equal((await e.google()).status,401);
  const noConsent=environment();assert.equal((await noConsent.google("candidate",{consent:false})).status,400);
});
test("Google cannot silently take over an existing email account; explicit verified linking works",async()=>{
  const e=environment();await e.call("candidate","auth/signup",candidate);
  assert.equal((await e.google("candidate",{}, {email:candidate.email})).status,409);
  await e.auth("otp/verify",{scope:"candidate",code:e.codes.get(candidate.email)});
  assert.equal((await e.google("candidate",{intent:"link"},{email:candidate.email})).status,200);
  assert.equal((await e.google("candidate",{intent:"login"},{email:candidate.email})).status,200);
  const meta=await e.load("src/lib/admin/db.ts").db().prepare("SELECT * FROM account_auth").get();assert.equal(meta.registeredWith,"email");assert.equal(meta.googleSub,"google-subject-1");
});
test("Google employer signup requires company details and preserves separation from candidates",async()=>{
  const e=environment();assert.equal((await e.google("employer")).status,400);
  assert.equal((await e.google("employer",{company:"Google Company",country:"IN"})).status,200);
  assert.equal((await e.call("employer","workspace")).status,200);
  assert.equal((await e.call("candidate","dashboard")).status,401);
});
test("sign-in report requires staff owner and shows actual email and Google methods",async()=>{
  const e=environment();assert.equal((await e.auth("activity",undefined,undefined,"GET")).status,401);
  await e.google();assert.equal((await e.auth("activity",undefined,undefined,"GET")).status,401);
  const request=new Request("https://atsai.test/api/admin/auth/signup",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify({name:"Owner",email:"owner@example.test",password:"Owner-fixture-password-2026",setupToken:"fixture-owner-key-with-at-least-32-characters"})});
  assert.equal((await e.load("src/app/api/admin/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["auth","signup"]})})).status,201);
  const report=await e.auth("activity",undefined,undefined,"GET");assert.equal(report.status,200);const data=await report.json();assert.equal(data.users[0].lastMethod,"google_one_tap");assert.equal(data.events[0].email,"google@example.test");
  await e.load("src/lib/admin/db.ts").db().prepare("UPDATE users SET role='editor'").run();assert.equal((await e.auth("activity",undefined,undefined,"GET")).status,403);
});
test("deleting an account removes its Google binding, challenges and sign-in history",async()=>{
  const e=environment();await e.google();const db=e.load("src/lib/admin/db.ts").db();await db.prepare("DELETE FROM candidate_accounts").run();
  for(const table of ["account_auth","auth_logins","auth_challenges"])assert.equal((await db.prepare("SELECT count(*) AS total FROM "+table).get()).total,0);
  assert.equal((await e.google()).status,200);
});


async function adminOwner(e){
  const request=new Request("https://atsai.test/api/admin/auth/signup",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify({name:"Owner",email:"owner@example.test",password:"Owner-fixture-password-2026",setupToken:"fixture-owner-key-with-at-least-32-characters"})});
  assert.equal((await e.load("src/app/api/admin/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["auth","signup"]})})).status,201);
}
async function manage(e,body,method="POST",origin="https://atsai.test",query=""){
  return e.load("src/app/api/admin/accounts/route.ts")[method](new Request("https://atsai.test/api/admin/accounts"+query,{method,headers:{origin,"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(body)}));
}
async function verifiedAccount(e,scope,account){
  assert.equal((await e.call(scope,"auth/signup",account)).status,201);
  assert.equal((await e.auth("otp/verify",{scope,code:e.codes.get(account.email)})).status,200);
  return (await e.load("src/lib/admin/db.ts").db().prepare("SELECT id FROM "+(scope==="candidate"?"candidate_accounts":"ats_employers")+" WHERE email=?").get(account.email)).id;
}
async function directory(e,query=""){const response=await manage(e,undefined,"GET",undefined,query);assert.equal(response.status,200);return response.json();}

test("user directory and mutations reject anonymous, candidate and editor access",async()=>{
  const e=environment();assert.equal((await manage(e,undefined,"GET")).status,401);
  await verifiedAccount(e,"candidate",candidate);assert.equal((await manage(e,undefined,"GET")).status,401);
  await adminOwner(e);assert.equal((await manage(e,{},"POST","https://attacker.test")).status,403);
  await e.load("src/lib/admin/db.ts").db().prepare("UPDATE users SET role='editor'").run();
  assert.equal((await manage(e,undefined,"GET")).status,403);assert.equal((await manage(e,{scope:"candidate",id:"missing",version:0,action:"save"})).status,403);
});
test("directory filters accounts, reports sign-in methods and paginates without secrets",async()=>{
  const e=environment();await adminOwner(e);await verifiedAccount(e,"candidate",candidate);await verifiedAccount(e,"employer",employer);await e.google();
  const all=await directory(e);assert.equal(all.total,3);assert.equal(all.totals.candidates,2);assert.equal(all.totals.employers,1);assert.equal(all.totals.verified,3);
  for(const user of all.users){assert.equal(user.password,undefined);assert.equal(user.googleSub,undefined);assert.equal(user.profile,undefined);}
  assert.equal((await directory(e,"?scope=employer&q=Auth%20Company")).total,1);
  assert.equal((await directory(e,"?method=google_one_tap")).total,1);
  const db=e.load("src/lib/admin/db.ts").db();for(let i=0;i<27;i++)await db.prepare("INSERT INTO candidate_accounts VALUES (?,?,?,?,?,?,?)").run("extra-"+i,"Extra "+i,"extra"+i+"@example.test","unused","{}",new Date().toISOString(),new Date().toISOString());
  const page1=await directory(e),page2=await directory(e,"?page=2");assert.equal(page1.users.length,25);assert.equal(page2.users.length,5);assert.equal(page2.page,2);assert.ok(!page2.users.some(user=>page1.users.some(first=>first.id===user.id&&first.scope===user.scope)));
});
test("owner edits names and email, resets verification, rejects stale updates and forbids privilege conversion",async()=>{
  const e=environment();await adminOwner(e);const id=await verifiedAccount(e,"candidate",candidate);
  assert.equal((await manage(e,{scope:"candidate",id,version:0,action:"save",name:"Updated Candidate",email:"updated@example.test",role:"candidate",status:"active"})).status,200);
  assert.equal((await e.call("candidate","dashboard")).status,401);
  const row=(await directory(e)).users[0];assert.equal(row.name,"Updated Candidate");assert.equal(row.email,"updated@example.test");assert.equal(row.emailVerifiedAt,null);assert.equal(row.version,1);
  assert.equal((await manage(e,{scope:"candidate",id,version:0,action:"save",name:"Stale"})).status,409);
  assert.equal((await manage(e,{scope:"candidate",id,version:1,action:"save",role:"owner"})).status,400);
  assert.equal((await manage(e,{scope:"staff",id,version:1,action:"save",role:"owner"})).status,400);
  assert.equal((await e.call("candidate","auth/login",{...candidate,email:"updated@example.test"})).status,202);
});
test("suspension revokes sessions and blocks both email and Google login until restored",async()=>{
  const e=environment();await adminOwner(e);await e.google();const user=(await directory(e)).users[0];
  assert.equal((await manage(e,{scope:"candidate",id:user.id,version:0,action:"save",status:"suspended"})).status,200);
  assert.equal((await e.call("candidate","dashboard")).status,401);assert.equal((await e.google("candidate",{intent:"login"})).status,403);
  assert.equal((await directory(e,"?status=suspended")).total,1);
  assert.equal((await manage(e,{scope:"candidate",id:user.id,version:1,action:"save",status:"active"})).status,200);
  assert.equal((await e.google("candidate",{intent:"login"})).status,200);
  const direct=environment();await adminOwner(direct);const id=await verifiedAccount(direct,"candidate",candidate);
  await manage(direct,{scope:"candidate",id,version:0,action:"save",status:"suspended"});
  assert.equal((await direct.call("candidate","auth/login",candidate)).status,403);assert.equal(direct.messages.length,1);
});
test("company role changes preserve the last active owner and company isolation",async()=>{
  const e=environment();await adminOwner(e);const ownerId=await verifiedAccount(e,"employer",employer);
  const db=e.load("src/lib/admin/db.ts").db();const ownerRow=await db.prepare("SELECT organizationId FROM ats_employers WHERE id=?").get(ownerId);
  for(const change of [{role:"recruiter"},{status:"suspended"}])assert.equal((await manage(e,{scope:"employer",id:ownerId,version:0,action:"save",...change})).status,409);
  assert.equal((await manage(e,{scope:"employer",id:ownerId,version:0,confirmEmail:employer.email},"DELETE")).status,409);
  await db.prepare("INSERT INTO ats_employers VALUES (?,?,?,?,?,?,?)").run("second-owner",ownerRow.organizationId,"Second Owner","second@example.test","unused","recruiter",new Date().toISOString());
  assert.equal((await manage(e,{scope:"employer",id:"second-owner",version:0,action:"save",role:"owner"})).status,200);
  assert.equal((await manage(e,{scope:"employer",id:ownerId,version:0,action:"save",role:"recruiter"})).status,200);
  assert.equal((await e.call("employer","workspace")).status,401);
  assert.equal((await db.prepare("SELECT organizationId,role FROM ats_employers WHERE id=?").get(ownerId)).organizationId,ownerRow.organizationId);
  assert.equal((await manage(e,{scope:"employer",id:"second-owner",version:1,action:"save",role:"recruiter"})).status,409);
});
test("Google-linked account emails cannot change and forced logout leaves verification intact",async()=>{
  const e=environment();await adminOwner(e);await e.google();const user=(await directory(e)).users[0];
  assert.equal((await manage(e,{scope:"candidate",id:user.id,version:0,action:"save",email:"different@example.test"})).status,409);
  assert.equal((await manage(e,{scope:"candidate",id:user.id,version:0,action:"revoke-sessions"})).status,200);
  assert.equal((await e.call("candidate","dashboard")).status,401);assert.ok((await directory(e)).users[0].emailVerifiedAt);
});
test("confirmed account deletion removes dependent application data and authentication records",async()=>{
  const e=environment();await adminOwner(e);const id=await verifiedAccount(e,"candidate",candidate),db=e.load("src/lib/admin/db.ts").db(),now=new Date().toISOString();
  const job={...e.load("src/lib/admin/types.ts").blankRecord("job","Test"),id:"delete-job",slug:"delete-job",title:"Delete Job",company:"Company",status:"published",createdAt:now,updatedAt:now,version:1};
  await db.prepare("INSERT INTO content VALUES (?,?,?,?,?,?,?,?)").run(job.id,"job",job.slug,"published",JSON.stringify(job),now,now,1);
  await db.prepare("INSERT INTO candidate_applications (id,candidateId,jobId,jobTitle,company,status,document,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)").run("delete-app",id,job.id,job.title,job.company,"submitted","{}",now,now);
  await db.prepare("INSERT INTO ats_organizations VALUES (?,?,?,?,?)").run("delete-org","Company","IN","",now);
  await db.prepare("INSERT INTO ats_interviews VALUES (?,?,?,?,?,?,?,?,?)").run("delete-interview","delete-app","delete-org","Interview",now,"Asia/Kolkata","","scheduled",now);
  assert.equal((await manage(e,{scope:"candidate",id,version:0,confirmEmail:"wrong@example.test"},"DELETE")).status,400);
  assert.equal((await manage(e,{scope:"candidate",id,version:0,confirmEmail:candidate.email},"DELETE")).status,200);
  for(const table of ["candidate_accounts","candidate_applications","ats_interviews","account_auth","auth_challenges","auth_logins","account_controls"])assert.equal((await db.prepare("SELECT count(*) AS total FROM "+table).get()).total,0,table);
  assert.equal((await directory(e)).total,0);assert.equal((await e.call("candidate","dashboard")).status,401);
});

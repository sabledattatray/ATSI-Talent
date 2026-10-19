import { pdfFixture } from "./fixtures/pdf.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const nativeRequire=createRequire(import.meta.url);
function environment(mode="development", Clock=Date, mail={}) {
  const jar=new Map(),options=new Map(),cache=new Map();
  const codes=new Map();
  const testFetch=async(url,options={})=>{const payload=options.body?JSON.parse(options.body):{};if(String(url)==="https://api.resend.com/emails"&&payload.subject==="Your ATSAI email verification code"){codes.set(payload.to[0],payload.text.match(/code is (\d{6})/)[1]);return Response.json({id:"otp-fixture"});}return (mail.fetch||fetch)(url,options);};
  async function verifyFixture(response,scope){if(!response.headers.get("content-type")?.includes("application/json"))return response;const body=await response.clone().json();if(response.ok&&body.verificationRequired){const request=new Request("https://atsai.test/api/auth/otp/verify",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify({scope,code:codes.get(body.email)})});const verified=await load("src/app/api/auth/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["otp","verify"]})});assert.equal(verified.status,200,JSON.stringify(await verified.json()));}return response;}
  const context=vm.createContext({console,Buffer,URL,Request,Response,File,FormData,TextEncoder,ReadableStream,AbortSignal,fetch:testFetch,Date:Clock,setTimeout,clearTimeout,process:{cwd:()=>process.cwd(),env:{NODE_ENV:mode,ATSAI_AUTH_RESEND_API_KEY:"test-otp-key",ATSAI_AUTH_EMAIL_FROM:"ATSAI <verify@example.test>",ATSAI_DATABASE_PATH:":memory:",ATSAI_ADMIN_SETUP_TOKEN:"fixture-owner-setup-secret-at-least-32-characters",...mail.env}}});
  const cookies={get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key,value,config)=>{jar.set(key,value);options.set(key,config);},delete:key=>jar.delete(key)};
  function load(file) {
    const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
    const loaded={exports:{}};cache.set(full,loaded);
    const source=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const require=id=>id==="server-only"?{}:id==="next/headers"?{cookies:async()=>cookies}:id.startsWith("@/")?load(`src/${id.slice(2)}.ts`):id.startsWith(".")?load(path.resolve(path.dirname(full),`${id}.ts`)):mail.modules?.[id]||nativeRequire(id);
    vm.runInContext(`(function(require,module,exports){${source}\n})`,context,{filename:full})(require,loaded,loaded.exports);return loaded.exports;
  }
  async function call(route,body,method=body===undefined?"GET":"POST",origin="https://atsai.test") {
    const request=new Request(`https://atsai.test/api/recruitment/${route}`,{method,headers:{origin,"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(body)});
    return verifyFixture(await load("src/lib/recruitment.ts").recruitmentRequest(request,route.split("?")[0]),"candidate");
  }
  async function callFormData(route,formData,origin="https://atsai.test") {
    const request=new Request(`https://atsai.test/api/recruitment/${route}`,{method:"POST",headers:{origin},body:formData});
    return load("src/lib/recruitment.ts").recruitmentRequest(request,route.split("?")[0]);
  }
  async function owner() {
    const request=new Request("https://atsai.test/api/admin/auth/signup",{method:"POST",headers:{origin:"https://atsai.test","content-type":"application/json"},body:JSON.stringify({name:"Owner Fixture",email:"owner@example.test",password:"Owner-test-password-2026",setupToken:"fixture-owner-setup-secret-at-least-32-characters"})});
    assert.equal((await load("src/app/api/admin/[...path]/route.ts").POST(request,{params:Promise.resolve({path:["auth","signup"]})})).status,201);
  }
  async function callATS(route,body,method=body===undefined?"GET":"POST",origin="https://atsai.test") {
    const request=new Request(`https://atsai.test/api/ats/${route}`,{method,headers:{origin,"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(body)});
    return verifyFixture(await load("src/lib/ats.ts").atsRequest(request,route.split("?")[0]),"employer");
  }
  return {load,call,callATS,callFormData,owner,jar,options};
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

test("complete candidate profile stores structured history, preferences, and validates secure links",async()=>{
  const e=environment();await e.call("auth/signup",person);
  const fullProfile={
    name:"Full Candidate",
    phone:"+91 98765 43210",
    location:"Bengaluru, India",
    headline:"Senior Full-Stack Engineer | Next.js, Node & TypeScript",
    bio:"Over 6 years of experience scaling modern web applications.",
    skills:"TypeScript, React, Next.js, Node.js, PostgreSQL",
    experience:6.5,
    certifications:"AWS Certified Solutions Architect",
    targetRole:"Lead Frontend Engineer",
    employmentType:"Full-time",
    preferredLocation:"Remote / Bengaluru",
    noticePeriod:"30 Days",
    expectedSalary:"₹28 LPA",
    openToRelocation:true,
    resumeUrl:"https://example.test/resume.pdf",
    linkedinUrl:"https://linkedin.com/in/candidate",
    githubUrl:"https://github.com/candidate",
    portfolioUrl:"https://candidate.test",
    workHistory:[{id:"w1",title:"Senior Engineer",company:"Acme Tech",location:"Remote",startDate:"2022-01",endDate:"",current:true,description:"Spearheaded frontend platform team."}],
    educationHistory:[{id:"e1",degree:"B.Tech",field:"Computer Science",institution:"National Tech University",graduationYear:"2019"}]
  };
  assert.equal((await e.call("profile",{...fullProfile,linkedinUrl:"http://insecure.test"})).status,400);
  assert.equal((await e.call("profile",{...fullProfile,githubUrl:"ftp://insecure.test"})).status,400);
  assert.equal((await e.call("profile",fullProfile)).status,200);
  const dashboard=await (await e.call("dashboard")).json();
  assert.equal(dashboard.user.profile.headline,"Senior Full-Stack Engineer | Next.js, Node & TypeScript");
  assert.equal(dashboard.user.profile.workHistory.length,1);
  assert.equal(dashboard.user.profile.workHistory[0].title,"Senior Engineer");
  assert.equal(dashboard.user.profile.educationHistory.length,1);
  assert.equal(dashboard.user.profile.openToRelocation,true);
});

test("candidate resume parser extracts structured details from resume text and files",async()=>{
  const e=environment();await e.call("auth/signup",person);
  const resumeText=`
Jane Doe
Senior Full-Stack Engineer
Email: jane.doe@example.test | Phone: +91 91234 56789 | Location: Pune, India
LinkedIn: https://linkedin.com/in/janedoe | GitHub: https://github.com/janedoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5 years of background in cloud platforms and web engineering.

SKILLS
React, Next.js, TypeScript, PostgreSQL, Docker, AWS

WORK EXPERIENCE
Senior Engineer | CloudCorp | Pune
Jan 2021 - Present
- Built multi-tenant cloud services.

EDUCATION
B.Tech in Computer Science
Pune University | 2020
`;
  const res=await e.call("parse-resume",{text:resumeText});
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.ok,true);
  assert.equal(data.parsed.name,"Jane Doe");
  assert.equal(data.parsed.headline,"Senior Full-Stack Engineer");
  assert.equal(data.parsed.phone,"+91 91234 56789");
  assert.equal(data.parsed.location,"Pune, India");
  assert.equal(data.parsed.workHistory.length,1);
  assert.equal(data.parsed.workHistory[0].title,"Senior Engineer");
  assert.equal(data.parsed.workHistory[0].company,"CloudCorp");
  assert.equal(data.parsed.workHistory[0].current,true);
  assert.equal(data.parsed.educationHistory.length,1);
});

test("candidate can upload and manage profile photo, validate format and persist to profile",async()=>{
  const e=environment();await e.call("auth/signup",person);
  const pngBytes=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137]);
  const pngFile=new File([pngBytes],"avatar.png",{type:"image/png"});
  const form=new FormData();
  form.append("file",pngFile);
  const uploadRes=await e.callFormData("photo",form);
  assert.equal(uploadRes.status,200);
  const {photoUrl}=await uploadRes.json();
  assert.match(photoUrl,/^\/api\/media\//);

  const textFile=new File(["not an image"],"bad.txt",{type:"text/plain"});
  const badForm=new FormData();
  badForm.append("file",textFile);
  assert.equal((await e.callFormData("photo",badForm)).status,400);

  assert.equal((await e.call("profile",{name:person.name,photoUrl})).status,200);
  const dashboard=await (await e.call("dashboard")).json();
  assert.equal(dashboard.user.profile.photoUrl,photoUrl);
});


test("resume parsing handles inline sections, several degrees and mixed employment layouts", () => {
  const e=environment(); const {parseResumeText}=e.load("src/lib/resumeParser.ts");
  const p=parseResumeText(`PRIYA DESHMUKH
Data Analyst
priya@example.test | +91 98765 43210 | Pune, Maharashtra, India
linkedin.com/in/priyad | github.com/priyad
Summary: Analyst focused on reliable reporting.
Technical Skills: SQL, Excel, Power BI; Python
WORK EXPERIENCE
Data Analyst | Acme Analytics | Pune | Jan 2022 – Dec 2023
• Built reporting dashboards.
Beta Systems
Senior Data Analyst
01/2023 to 12/2023
• Automated reporting with SQL.
Gamma Ltd | Business Analyst | 2025-01 - 2025-12
• Analysed product data.
EDUCATION
MBA in Finance | Pune University | 2020 - 2022
B.Com | Mumbai University | 2017 - 2020
PROJECTS
Data platform prototype
CERTIFICATIONS
Microsoft Power BI
Notice period: 60 days`,new Date("2026-10-18T00:00:00Z"));
  assert.equal(p.name,"PRIYA DESHMUKH"); assert.equal(p.phone,"+91 98765 43210");
  assert.equal(p.location,"Pune, Maharashtra, India"); assert.equal(p.headline,"Data Analyst");
  assert.equal(p.linkedinUrl,"https://linkedin.com/in/priyad");
  assert.equal(p.skills,"SQL, Excel, Power BI, Python");
  assert.equal(p.workHistory.length,3); assert.equal(p.workHistory[0].company,"Acme Analytics");
  assert.equal(p.workHistory[1].company,"Beta Systems");assert.equal(p.workHistory[1].title,"Senior Data Analyst");
  assert.equal(p.workHistory[2].company,"Gamma Ltd"); assert.equal(p.experience,3);
  assert.equal(p.educationHistory.length,2);assert.equal(p.educationHistory[0].graduationYear,"2022");
  assert.equal(p.educationHistory[1].institution,"Mumbai University");
  assert.equal(p.noticePeriod,"60 Days");assert.equal(p.openToRelocation,undefined);
  assert.ok(!p.skills.includes("PROJECTS"));
});

test("resume parsing avoids dates as phones, invented availability and body cities as home location", () => {
  const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
  const p=parseResumeText(`José Fernandes
Software Engineer
SUMMARY
Engineer building useful applications.
SKILLS: TypeScript, React
EXPERIENCE
Engineer | Example Ltd
2020 - 2022
Developed applications for London clients.
EDUCATION
B.Tech | Example University | 2019`);
  assert.equal(p.name,"José Fernandes");assert.equal(p.phone,"");assert.equal(p.location,"");
  assert.equal(p.noticePeriod,"");assert.equal(p.openToRelocation,undefined);
  assert.equal(p.educationHistory[0].institution,"Example University");
});

test("resume import fills gaps, preserves edits, adds history once and permits explicit replacement", () => {
  const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
  const {mergeResumeProfile}=e.load("src/lib/resumeMerge.ts");
  const parsed=parseResumeText(`Jane Doe
Data Analyst
Phone: +91 98765 43210
SKILLS: SQL, Python
EXPERIENCE
Analyst | Example Ltd
Jan 2020 - Dec 2021
• Built dashboards.
EDUCATION
B.Tech | Example University | 2019`);
  const current={name:"Jane Verified",phone:"+91 91234 56789",location:"Pune",skills:"Excel, SQL",experience:7,noticePeriod:"90 Days",openToRelocation:true,resumeUrl:"https://example.test/resume.pdf",workHistory:[],educationHistory:[]};
  const merged=mergeResumeProfile(current,parsed);
  assert.equal(merged.name,current.name);assert.equal(merged.phone,current.phone);assert.equal(merged.headline,"Data Analyst");
  assert.equal(merged.skills,"Excel, SQL, Python");assert.equal(merged.experience,7);assert.equal(merged.noticePeriod,"90 Days");assert.equal(merged.openToRelocation,true);
  assert.equal(merged.resumeUrl,current.resumeUrl);assert.equal(merged.workHistory.length,1);
  assert.equal(mergeResumeProfile(merged,parsed).workHistory.length,1);
  assert.equal(mergeResumeProfile(merged,parsed).educationHistory.length,1);
  assert.equal(mergeResumeProfile(current,parsed,true).phone,parsed.phone);
});

function docxFixture(lines) {
  const xml=lines.map(s=>`<w:p><w:r><w:t>${s.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</w:t></w:r></w:p>`).join("");
  const files={"[Content_Types].xml":'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',"word/document.xml":`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${xml}</w:body></w:document>`};
  const chunks=[],central=[];let offset=0;
  const crc32=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  for(const [filename,value] of Object.entries(files)){
    const name=Buffer.from(filename),data=Buffer.from(value),crc=crc32(data);
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
    const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42);
    chunks.push(local,name,data);central.push(entry,name);offset+=local.length+name.length+data.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(2,8);end.writeUInt16LE(2,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,directory,end]);
}

test("PDF and Word uploads extract actual document text through the candidate API", async () => {
  const e=environment();await e.call("auth/signup",person);
  const lines=["Jane Doe","Data Analyst","Phone: +91 98765 43210","Location: Pune, India","SKILLS: SQL, Excel, Power BI","EXPERIENCE","Analyst | Acme Ltd | Pune","Jan 2020 - Dec 2022","Built useful reporting dashboards.","EDUCATION","B.Tech | Example University | 2019"];
  for(const [name,bytes] of [["resume.pdf",pdfFixture(lines)],["resume.docx",docxFixture(lines)]]){
    const form=new FormData();form.append("file",new File([bytes],name));
    const response=await e.callFormData("parse-resume",form);const body=await response.json();
    assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.parsed.name,"Jane Doe");
    assert.equal(body.parsed.phone,"+91 98765 43210");assert.equal(body.parsed.workHistory.length,1);
    assert.equal(body.parsed.educationHistory[0].institution,"Example University");
    assert.ok(body.parsed.skills.includes("Power BI"));
  }
});

test("unreadable resume files and invalid text are actionable failures, not binary profile data", async () => {
  const e=environment();await e.call("auth/signup",person);
  for(const [filename,bytes] of [["broken.pdf",Buffer.from("%PDF-invalid")],["broken.docx",Buffer.from("PK invalid archive")],["scan.pdf",pdfFixture([])],["resume.rtf",Buffer.from("{\\rtf1 Jane Doe}")]]){
    const response=await e.call("parse-resume",{filename,base64:bytes.toString("base64")});
    assert.ok([400,422].includes(response.status),`${filename}: ${response.status}`);assert.ok((await response.json()).error);
  }
  assert.equal((await e.call("parse-resume",{text:"a".repeat(150001)})).status,413);
  assert.equal((await e.call("parse-resume",{text:{bad:true}})).status,400);
});


test("table separators and ongoing education preserve field boundaries", () => {
  const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
  const parsed=parseResumeText("Jane Doe\nData Analyst\nTECHNICAL SKILLS & TOOLS\nSQL\tExcel\tPower BI\nEXPERIENCE\nData Analyst\tAcme Ltd\tJan 2020 - Dec 2021\nBuilt useful dashboards.\nEDUCATION\nMBA in Finance | Example University | 2025 - Present");
  assert.equal(parsed.workHistory[0].title,"Data Analyst");assert.equal(parsed.workHistory[0].company,"Acme Ltd");
  assert.equal(parsed.skills,"SQL, Excel, Power BI");assert.equal(parsed.educationHistory[0].graduationYear,"");
});

const companyOwner={name:"Employer Alpha",email:"alpha@example.test",password:"Employer-fixture-password-2026",company:"Alpha Health",country:"GB",website:"https://alpha.example.test",consent:true};
const globalJob={id:"",version:0,title:"Registered Nurse",description:"Support patients and provide evidence-based nursing care in a multidisciplinary team.",excerpt:"Join our nursing team and provide thoughtful, professional patient care.",category:"Healthcare",location:"London, United Kingdom",jobCountry:"GB",jobCity:"London",jobRegion:"England",workMode:"On-site",employmentType:"Full-time",salaryCurrency:"GBP",salaryPeriod:"YEAR",salaryMin:35000,salaryMax:45000,experienceMin:1,experienceMax:10,skills:"Nursing, Patient care",expiresAt:"",status:"published"};

test("company workspaces isolate jobs, applicants and interview actions from other companies",async()=>{
  const e=environment();assert.equal((await e.callATS("workspace")).status,401);
  assert.equal((await e.callATS("auth/signup",companyOwner)).status,201);
  assert.equal((await e.callATS("jobs/save",globalJob)).status,200);
  const a=await(await e.callATS("workspace")).json();assert.equal(a.jobs.length,1);const job=a.jobs[0];
  assert.equal(job.company,"Alpha Health");assert.equal(job.salaryCurrency,"GBP");assert.equal(job.jobCountry,"GB");assert.equal(job.employerVerified,false);
  assert.equal(e.load("src/lib/admin/public.ts").toJobListing(job).location.country,"GB");
  assert.equal(e.load("src/lib/admin/public.ts").toJobListing(job).salaryCurrency,"GBP");
  assert.equal(e.load("src/lib/structured-data.ts").jobPosting(job).baseSalary.currency,"GBP");
  assert.equal((await e.call("auth/signup",person)).status,201);
  assert.equal((await e.call("apply",{jobId:job.id,consent:true})).status,201);
  const workspace=await(await e.callATS("workspace")).json();const application=workspace.applications[0];assert.equal(application.name,person.name);
  assert.equal((await e.callATS("auth/signup",{...companyOwner,email:"beta@example.test",company:"Beta Education"})).status,201);
  const b=await(await e.callATS("workspace")).json();assert.equal(b.jobs.length,0);assert.equal(b.applications.length,0);assert.equal(b.events.length,0);
  assert.equal((await e.callATS("jobs/save",{...globalJob,id:job.id,version:job.version,title:"Stolen role"})).status,404);
  assert.equal((await e.callATS("applications/note",{id:application.id,message:"Unauthorized"})).status,404);
  assert.equal((await e.callATS("applications/stage",{id:application.id,status:"review",updatedAt:application.updatedAt})).status,404);
  assert.equal((await e.callATS("interviews/save",{applicationId:application.id,title:"Private interview",startsAt:new Date(Date.now()+86400000).toISOString(),timeZone:"Europe/London",location:"https://meeting.example.test"})).status,404);
  assert.equal((await e.callATS("auth/login",companyOwner)).status,200);
  assert.equal((await(await e.callATS("workspace")).json()).applications.length,1);
});

test("ATS tracking persists decisions, keeps notes private, handles stale edits and blocks withdrawn applications",async()=>{
  const e=environment();await e.callATS("auth/signup",companyOwner);await e.callATS("jobs/save",globalJob);
  const job=(await(await e.callATS("workspace")).json()).jobs[0];await e.call("auth/signup",person);await e.call("apply",{jobId:job.id,consent:true});
  let app=(await(await e.callATS("workspace")).json()).applications[0];
  assert.equal((await e.callATS("applications/note",{id:app.id,message:"Internal assessment — not for the candidate"})).status,201);
  assert.equal((await e.callATS("applications/stage",{id:app.id,status:"review",updatedAt:app.updatedAt,message:"Your application is being reviewed."})).status,200);
  assert.equal((await e.callATS("applications/stage",{id:app.id,status:"offer",updatedAt:"stale-version"})).status,409);
  const tracking=await(await e.call("tracking?id="+app.id)).json();assert.equal(tracking.status,"review");assert.ok(tracking.events.some(ev=>ev.message.includes("being reviewed")));assert.ok(!JSON.stringify(tracking).includes("Internal assessment"));
  const schedule={applicationId:app.id,title:"Clinical team interview",startsAt:new Date(Date.now()+86400000).toISOString(),timeZone:"Europe/London",location:"https://meet.example.test/room"};
  assert.equal((await e.callATS("interviews/save",{...schedule,timeZone:"Not/AZone"})).status,400);
  assert.equal((await e.callATS("interviews/save",schedule)).status,201);
  let candidate=await(await e.call("tracking?id="+app.id)).json();assert.equal(candidate.interviews.length,1);assert.equal(candidate.interviews[0].timeZone,"Europe/London");
  assert.equal((await e.callATS("interviews/cancel",{id:candidate.interviews[0].id})).status,200);
  candidate=await(await e.call("tracking?id="+app.id)).json();assert.equal(candidate.interviews[0].status,"cancelled");
  assert.equal((await e.call("withdraw",{id:app.id})).status,200);
  app=(await(await e.callATS("workspace")).json()).applications[0];
  assert.equal((await e.callATS("applications/stage",{id:app.id,status:"hired",updatedAt:app.updatedAt})).status,409);
  assert.equal((await e.callATS("interviews/save",schedule)).status,409);
  assert.equal((await(await e.call("tracking?id="+app.id)).json()).status,"withdrawn");
  await e.call("auth/signup",{...person,email:"other-candidate@example.test"});assert.equal((await e.call("tracking?id="+app.id)).status,404);
});

test("company invitations enforce email, expiry, ownership and session revocation",async()=>{
  const e=environment();await e.callATS("auth/signup",companyOwner);
  const {token}=await(await e.callATS("team/invite",{email:"recruiter@example.test"})).json();assert.ok(token);
  const invitee={name:"Recruiter Fixture",email:"recruiter@example.test",password:"Recruiter-fixture-password-2026",invite:token,consent:true};
  assert.equal((await e.callATS("auth/accept",{...invitee,email:"wrong@example.test"})).status,403);
  assert.equal((await e.callATS("auth/accept",invitee)).status,201);
  const recruiter=(await(await e.callATS("workspace")).json()).user;assert.equal(recruiter.role,"recruiter");assert.equal(recruiter.company,companyOwner.company);
  assert.equal((await e.callATS("team/invite",{email:"unauthorized@example.test"})).status,403);
  assert.equal((await e.callATS("jobs/save",globalJob)).status,200);
  assert.equal((await e.callATS("auth/accept",invitee)).status,403);
  await e.callATS("auth/login",companyOwner);assert.equal((await e.callATS("team/remove",{id:recruiter.id})).status,200);
  assert.equal((await e.callATS("auth/login",invitee)).status,401);
  const me=(await(await e.callATS("me")).json()).user;
  assert.equal((await e.callATS("team/remove",{id:me.id})).status,400);
  assert.equal((await e.callATS("password",{currentPassword:companyOwner.password,password:"Updated-employer-password-2026"})).status,200);
  await e.callATS("auth/logout",{});assert.equal((await e.callATS("workspace")).status,401);
  assert.equal((await e.callATS("auth/login",companyOwner)).status,401);
  assert.equal((await e.callATS("auth/login",{...companyOwner,password:"Updated-employer-password-2026"})).status,200);
});

test("international jobs preserve currencies, pay periods and publication version checks",async()=>{
  const e=environment();await e.callATS("auth/signup",companyOwner);
  assert.equal((await e.callATS("jobs/save",{...globalJob,title:"Early Years Educator",category:"Education",employmentType:"Part-time",salaryCurrency:"EUR",salaryPeriod:"HOUR",salaryMin:20,salaryMax:30})).status,200);
  let job=(await(await e.callATS("workspace")).json()).jobs[0];assert.equal(e.load("src/lib/structured-data.ts").jobPosting(job).baseSalary.value.unitText,"HOUR");
  assert.equal((await e.callATS("jobs/save",{...globalJob,id:job.id,version:0})).status,409);
  assert.equal((await e.callATS("jobs/save",{...globalJob,id:job.id,version:job.version,status:"archived"})).status,200);
  assert.equal((await e.load("src/lib/admin/db.ts").records("job",true)).length,0);
  assert.equal((await e.callATS("jobs/save",{...globalJob,salaryMin:50000,salaryMax:100})).status,400);
  assert.equal((await e.callATS("jobs/save",{...globalJob,salaryCurrency:"ZZZ"})).status,400);
  assert.equal((await e.callATS("jobs/save",globalJob,"POST","https://hostile.test")).status,403);
});

test("private resumes enforce candidate ownership, application-based employer access and withdrawal",async()=>{
  const e=environment();await e.callATS("auth/signup",companyOwner);await e.callATS("jobs/save",globalJob);
  const job=(await(await e.callATS("workspace")).json()).jobs[0];await e.call("auth/signup",person);
  const bytes=pdfFixture(["Candidate Fixture","Registered Nurse","SKILLS: Nursing, Patient care","SUMMARY","Experienced nurse committed to safe patient care."]);
  const upload=await e.call("parse-resume",{filename:"nursing-resume.pdf",base64:bytes.toString("base64")});assert.equal(upload.status,200);
  const {parsed}=await upload.json();assert.match(parsed.resumeUrl,/^\/api\/ats\/resume\//);
  assert.equal((await e.call("profile",{name:person.name,resumeUrl:parsed.resumeUrl})).status,200);
  const path=parsed.resumeUrl.replace("/api/ats/","");
  assert.deepEqual(Buffer.from(await(await e.callATS(path)).arrayBuffer()),bytes);
  assert.equal((await e.call("apply",{jobId:job.id,consent:true})).status,201);
  const app=(await(await e.callATS("workspace")).json()).applications[0];
  await e.call("auth/logout",{});assert.equal((await e.callATS(path)).status,200);
  await e.callATS("auth/signup",{...companyOwner,email:"outside-company@example.test",company:"Other Company"});assert.equal((await e.callATS(path)).status,404);
  await e.call("auth/signup",{...person,email:"outside-candidate@example.test"});assert.equal((await e.callATS(path)).status,404);
  assert.equal((await e.call("profile",{name:"Other Candidate",resumeUrl:parsed.resumeUrl})).status,400);
  await e.call("auth/login",person);assert.equal((await e.call("withdraw",{id:app.id})).status,200);
  await e.call("auth/logout",{});await e.callATS("auth/login",companyOwner);assert.equal((await e.callATS(path)).status,404);
  await e.call("auth/login",person);assert.equal((await e.callATS(path)).status,200);
  const files=await(await e.callATS("resumes")).json();assert.equal(files.files.length,1);
  assert.equal((await e.callATS("resumes/delete",{id:files.files[0].id})).status,200);
  assert.equal((await e.callATS(path)).status,404);
  assert.equal((await(await e.call("dashboard")).json()).user.profile.resumeUrl,"");
});


test("ATS stage versions advance even when two updates share the same clock tick",async()=>{
  class FrozenDate extends Date {
    constructor(value){super(value===undefined?"2026-10-18T12:00:00.000Z":value);}
    static now(){return Date.parse("2026-10-18T12:00:00.000Z");}
  }
  const e=environment("development",FrozenDate);await e.callATS("auth/signup",companyOwner);await e.callATS("jobs/save",globalJob);
  const job=(await(await e.callATS("workspace")).json()).jobs[0];await e.call("auth/signup",person);await e.call("apply",{jobId:job.id,consent:true});
  const original=(await(await e.callATS("workspace")).json()).applications[0];
  assert.equal((await e.callATS("applications/stage",{id:original.id,status:"review",updatedAt:original.updatedAt})).status,200);
  const reviewed=(await(await e.callATS("workspace")).json()).applications[0];
  assert.ok(Date.parse(reviewed.updatedAt)>Date.parse(original.updatedAt));
  assert.equal((await e.callATS("applications/stage",{id:original.id,status:"offer",updatedAt:original.updatedAt})).status,409);
  assert.equal((await e.callATS("applications/stage",{id:reviewed.id,status:"shortlisted",updatedAt:reviewed.updatedAt})).status,200);
  const shortlisted=(await(await e.callATS("workspace")).json()).applications[0];
  assert.ok(Date.parse(shortlisted.updatedAt)>Date.parse(reviewed.updatedAt));
});

test("resume deletion preserves profile edits made after the authentication snapshot",async()=>{
  const e=environment();await e.call("auth/signup",person);
  const {storeCandidateResume}=e.load("src/lib/resume-storage.ts");
  const user=(await(await e.call("dashboard")).json()).user;
  const url=await storeCandidateResume(user.id,Buffer.from("Fictional candidate resume text for deletion testing."),"fixture.txt");
  assert.equal((await e.call("profile",{name:person.name,resumeUrl:url,headline:"Original headline"})).status,200);
  const storage=e.load("src/lib/admin/db.ts").db();const prepare=storage.prepare;let injected=false;
  storage.prepare=sql=>{
    const statement=prepare(sql);
    if(!sql.startsWith("SELECT c.id,c.name,c.email,c.profile"))return statement;
    return {...statement,get:async(...args)=>{
      const snapshot=await statement.get(...args);
      if(snapshot&&!injected){injected=true;const profile=JSON.parse(snapshot.profile);await prepare("UPDATE candidate_accounts SET profile=? WHERE id=?").run(JSON.stringify({...profile,headline:"Latest saved headline",skills:"Nursing, Patient care"}),snapshot.id);}
      return snapshot;
    }};
  };
  try{assert.equal((await e.callATS("resumes/delete",{id:url.split("/").at(-1)})).status,200);}finally{storage.prepare=prepare;}
  const saved=(await(await e.call("dashboard")).json()).user.profile;
  assert.equal(saved.headline,"Latest saved headline");assert.equal(saved.skills,"Nursing, Patient care");assert.equal(saved.resumeUrl,"");
  assert.equal((await e.call("profile",{name:person.name,resumeUrl:url})).status,400);
});


test("listed skill matching does not confuse substrings, languages or duplicate aliases",()=>{
  const {matchSkills}=environment().load("src/lib/skill-match.ts");
  const mismatch=matchSkills("Java, C, C++, R, SQL", "JavaScript, C#, Nursing, PostgreSQL");
  assert.equal(mismatch.score,0);assert.equal(mismatch.matched.length,0);
  const aliases=matchSkills("JavaScript, JS; Node.js\nSQL, sql", "JS; nodejs\nSQL");
  assert.equal(aliases.required.length,3);assert.equal(aliases.matched.length,3);assert.equal(aliases.score,100);
  const partial=matchSkills("React, React Native", "React");assert.equal(partial.score,50);
  assert.equal(matchSkills("", "Python").score,0);
});


async function appliedFixture(e){
  await e.callATS("auth/signup",companyOwner);await e.callATS("jobs/save",globalJob);
  const role=(await(await e.callATS("workspace")).json()).jobs[0];
  await e.call("auth/signup",person);await e.call("apply",{jobId:role.id,consent:true});
  return (await(await e.callATS("workspace")).json()).applications[0];
}
test("staff decisions queue public updates atomically, protect versions and support completed interviews and selection",async()=>{
 const e=environment();let app=await appliedFixture(e);const sql=e.load("src/lib/admin/db.ts").db();
 const queue=()=>sql.prepare("SELECT * FROM ats_notifications ORDER BY createdAt").all();
 assert.equal((await queue()).length,1);assert.equal((await queue())[0].status,"blocked");
 await e.callATS("applications/note",{id:app.id,message:"PRIVATE_ASSESSMENT"});assert.equal((await queue()).length,1);
 assert.equal((await e.callATS("applications/stage",{id:app.id,status:"review"})).status,400);
 await e.owner();
 for(const stage of ["review","shortlisted","interview","interviewed","selected","offer","hired"]){
   const old=app.updatedAt;
   const response=await e.call("admin/status",{kind:"application",id:app.id,status:stage,updatedAt:old,message:`Public ${stage} update <script>unsafe</script>`});
   assert.equal(response.status,200,await response.text());
   app=(await(await e.callATS("workspace")).json()).applications[0];assert.notEqual(app.updatedAt,old);
   const candidate=await(await e.call("tracking?id="+app.id)).json();assert.equal(candidate.status,stage);
   assert.equal((await e.callATS("applications/stage",{id:app.id,status:stage,updatedAt:old})).status,409);
 }
 const notifications=await queue();assert.equal(notifications.length,8);
 assert.ok(!JSON.stringify(notifications).includes("PRIVATE_ASSESSMENT"));
 assert.ok(notifications.some(n=>n.html.includes("&lt;script&gt;")));assert.ok(!notifications.some(n=>n.html.includes("<script>")));
 assert.equal((await e.call("admin/status",{kind:"application",id:app.id,status:"rejected",updatedAt:app.updatedAt})).status,409);
 const ownerMail=await(await e.call("admin/notifications?applicationId="+app.id)).json();assert.equal(ownerMail.notifications.length,8);assert.equal(ownerMail.configuration.configured,false);
 const candidateCookie=e.jar.get("atsai_candidate_session");e.jar.delete("atsai_admin_session");e.jar.delete("atsai_employer_session");
 assert.equal((await e.callATS("notifications?applicationId="+app.id)).status,401);assert.equal((await e.call("admin/notifications?applicationId="+app.id)).status,401);
 e.jar.set("atsai_candidate_session",candidateCookie);
});

test("interview scheduling advances the candidate, same-stage messages notify once, and other companies cannot inspect mail",async()=>{
 const e=environment();let app=await appliedFixture(e);
 await e.callATS("interviews/save",{applicationId:app.id,title:"QA interview",startsAt:new Date(Date.now()+86400000).toISOString(),timeZone:"Europe/London",location:"https://meet.example.test/qa"});
 assert.equal((await(await e.call("tracking?id="+app.id)).json()).status,"interview");
 app=(await(await e.callATS("workspace")).json()).applications[0];
 const count=async()=>((await(await e.callATS("notifications?applicationId="+app.id)).json()).notifications).length;
 const before=await count();
 assert.equal((await e.callATS("applications/stage",{id:app.id,status:app.status,updatedAt:app.updatedAt})).status,200);assert.equal(await count(),before);
 assert.equal((await e.callATS("applications/stage",{id:app.id,status:app.status,updatedAt:app.updatedAt,message:"Thank you for joining us."})).status,200);assert.equal(await count(),before+1);
 const mail=(await(await e.callATS("notifications?applicationId="+app.id)).json()).notifications[0];
 await e.callATS("auth/signup",{...companyOwner,email:"separate@example.test",company:"Other Company"});
 assert.equal((await e.callATS("notifications?applicationId="+app.id)).status,404);
 assert.equal((await e.callATS("notifications/retry",{applicationId:app.id,id:mail.id})).status,404);
});

test("Resend outbox uses immutable payloads and stable keys, retries failures and never reports unconfirmed delivery",async()=>{
 const requests=[];let failure=true;
 const e=environment("development",Date,{env:{RESEND_API_KEY:"re_fixture",ATSAI_EMAIL_FROM:"QA <updates@example.test>"},fetch:async(url,options)=>{requests.push({url,options});return failure?new Response("temporary failure",{status:503}):Response.json({id:"resend-fixture-id"});}});
 const app=await appliedFixture(e);const mail=e.load("src/lib/notifications.ts");const sql=e.load("src/lib/admin/db.ts").db();
 const first=await mail.drainEmailOutbox();assert.equal(first.accepted,0);assert.equal(first.processed,1);
 let row=await sql.prepare("SELECT * FROM ats_notifications").get();assert.equal(row.status,"failed");assert.equal(row.attempts,1);assert.equal(row.sentAt,null);assert.ok(row.nextAttemptAt>Date.now());
 assert.equal((await mail.drainEmailOutbox()).processed,0);
 await mail.retryApplicationEmail(row.id,app.id);failure=false;
 const second=await mail.drainEmailOutbox();assert.equal(second.accepted,1);
 row=await sql.prepare("SELECT * FROM ats_notifications").get();assert.equal(row.status,"sent");assert.equal(row.providerId,"resend-fixture-id");assert.ok(row.sentAt);
 assert.equal(requests[0].url,"https://api.resend.com/emails");assert.equal(requests[0].options.headers["Idempotency-Key"],requests[1].options.headers["Idempotency-Key"]);
 assert.equal(requests[0].options.body,requests[1].options.body);assert.equal(JSON.parse(requests[0].options.body).to[0],person.email);
 await assert.rejects(()=>mail.retryApplicationEmail(row.id,app.id));assert.equal((await mail.drainEmailOutbox()).processed,0);
 await mail.queueApplicationEmail(row.eventId,app.id,"submitted","duplicate event");assert.equal((await sql.prepare("SELECT COUNT(*) AS count FROM ats_notifications").get()).count,1);
});

test("outbox remains blocked without credentials, recovers abandoned leases and rolls back public events on failure",async()=>{
 const e=environment();const app=await appliedFixture(e);const mail=e.load("src/lib/notifications.ts");const sql=e.load("src/lib/admin/db.ts").db();
 assert.equal((await mail.drainEmailOutbox()).configured,false);const row=await sql.prepare("SELECT * FROM ats_notifications").get();
 await assert.rejects(()=>mail.retryApplicationEmail(row.id,app.id));assert.equal(row.sentAt,null);
 const before=await sql.prepare("SELECT COUNT(*) AS count FROM ats_events").get();
 await assert.rejects(()=>e.load("src/lib/admin/db.ts").transaction(async()=>{await e.load("src/lib/application-workflow.ts").recordApplicationEvent(app.id,"message",app.status,"Rolled back message","candidate","fixture");throw Error("rollback fixture");}));
 assert.equal((await sql.prepare("SELECT COUNT(*) AS count FROM ats_events").get()).count,before.count);assert.equal((await sql.prepare("SELECT COUNT(*) AS count FROM ats_notifications").get()).count,1);
 const configured=environment("development",Date,{env:{RESEND_API_KEY:"re_fixture",ATSAI_EMAIL_FROM:"QA <updates@example.test>"},fetch:async()=>Response.json({id:"recovered"})});
 await appliedFixture(configured);const db=configured.load("src/lib/admin/db.ts").db();
 await db.prepare("UPDATE ats_notifications SET status='sending',attempts=5,leaseUntil=0").run();
 await configured.load("src/lib/notifications.ts").drainEmailOutbox();assert.equal((await db.prepare("SELECT status FROM ats_notifications").get()).status,"failed");
 await db.prepare("UPDATE ats_notifications SET status='sending',attempts=1,leaseUntil=0").run();
 assert.equal((await configured.load("src/lib/notifications.ts").drainEmailOutbox()).accepted,1);
});

test("authenticated live streams report revisions after staff decisions and close when candidate access is revoked",async()=>{
 const e=environment();const open=e.load("src/lib/live-tracking.ts").openApplicationStream;
 assert.equal((await open(new Request("https://atsai.test/api/recruitment/updates"),"candidate")).status,401);
 const app=await appliedFixture(e);const response=await open(new Request("https://atsai.test/api/recruitment/updates"),"candidate");assert.equal(response.headers.get("content-type"),"text/event-stream");
 const reader=response.body.getReader();const decoder=new TextDecoder();assert.match(decoder.decode((await reader.read()).value),/retry:/);
 const initial=decoder.decode((await reader.read()).value);assert.match(initial,/event: updates/);assert.ok(!initial.includes(person.email));assert.ok(!initial.includes(app.id));
 await e.callATS("applications/stage",{id:app.id,status:"selected",updatedAt:app.updatedAt});
 const changed=decoder.decode((await reader.read()).value);assert.match(changed,/event: updates/);assert.notEqual(changed,initial);
 await e.call("auth/logout",{});assert.equal((await reader.read()).done,true);await reader.cancel();
 const employer=await open(new Request("https://atsai.test/api/ats/updates"),"employer");const employerReader=employer.body.getReader();await employerReader.read();await employerReader.cancel();
});


test("readable PDF text survives broken metadata and cleanup while the page limit is enforced",async()=>{
 let destroyed=0;let total=1;
 class PDFParse {
   async getText(options){assert.equal(options.first,31);assert.equal(options.parseHyperlinks,false);return {total,text:"Jane Doe\nRegistered Nurse\nLocation: London, United Kingdom\nSKILLS: Nursing, Patient care"};}
   async getInfo(){throw Error("Broken annotation dictionary");}
   async destroy(){destroyed++;throw Error("Worker cleanup failed");}
 }
 const e=environment("development",Date,{modules:{"pdf-parse":{PDFParse}}});const {extractTextFromBuffer}=e.load("src/lib/resumeParser.ts");
 assert.match(await extractTextFromBuffer(Buffer.from("%PDF-fixture"),"resume.pdf"),/Jane Doe/);assert.equal(destroyed,1);
 total=31;await assert.rejects(()=>extractTextFromBuffer(Buffer.from("%PDF-fixture"),"resume.pdf"),/30 pages or fewer/);assert.equal(destroyed,2);
});

test("PDF failures distinguish server packaging problems from locked or unreadable files",async()=>{
 let failure=Object.assign(Error("DOMMatrix is not defined"),{name:"ReferenceError"});
 class PDFParse {async getText(){throw failure;}async destroy(){}}
 const e=environment("development",Date,{modules:{"pdf-parse":{PDFParse}}});const {extractTextFromBuffer}=e.load("src/lib/resumeParser.ts");
 await assert.rejects(()=>extractTextFromBuffer(Buffer.from("%PDF-fixture"),"resume.pdf"),error=>error.status===503&&/temporarily unavailable/.test(error.message));
 failure=Object.assign(Error("Password required"),{name:"PasswordException"});
 await assert.rejects(()=>extractTextFromBuffer(Buffer.from("%PDF-fixture"),"resume.pdf"),error=>error.status===422&&/unlocked copy/.test(error.message));
 failure=Object.assign(Error("Invalid structure"),{name:"InvalidPDFException"});
 await assert.rejects(()=>extractTextFromBuffer(Buffer.from("%PDF-fixture"),"resume.pdf"),error=>error.status===422&&/fresh PDF/.test(error.message));
});


test("decorative headings and alternate section names map skills, education and repeated page headers correctly",()=>{
 const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
 const parsed=parseResumeText(`JANE DOE
MIS & Business Intelligence Manager
Location - Thane, Maharashtra, India
Phone: +91 98765 43210
CORE EXPERTISE | Reporting: Power BI | Database: SQL | Tools: Excel
PROFESSIONAL BACKGROUND
JANE DOE
MIS & Business Intelligence Manager
January 2020 - September 2023
- Led reporting projects.
Deputy Manager | Example Finance Ltd.
August 2015 - January 2020
- Built monthly reports.
2. E D U C A T I O N
2015 | B.Com | Example University
2013 | HSC | Example College`,new Date("2026-10-18T00:00:00Z"));
 assert.equal(parsed.name,"JANE DOE");assert.equal(parsed.location,"Thane, Maharashtra, India");
 assert.equal(parsed.skills,"Power BI, SQL, Excel");assert.equal(parsed.workHistory.length,2);
 assert.equal(parsed.workHistory[0].title,"MIS & Business Intelligence Manager");assert.equal(parsed.workHistory[0].company,"");
 assert.equal(parsed.workHistory[1].company,"Example Finance Ltd.");assert.ok(parsed.warnings.some(w=>/employer/.test(w)));
 assert.equal(parsed.educationHistory.length,2);assert.equal(parsed.educationHistory[0].degree,"B.Com");assert.equal(parsed.educationHistory[0].institution,"Example University");assert.equal(parsed.educationHistory[0].graduationYear,"2015");
});

test("global and explicit contact locations work outside the built-in city list without using employment locations",()=>{
 const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
 for(const location of ["Oslo, Norway","Location:Oslo, Norway","Based in Oslo, Norway"]){
  const parsed=parseResumeText(`Jane Doe\nSoftware Engineer\n${location}\nSKILL SET: TypeScript, SQL\nACADEMIC CREDENTIALS\nB.Sc | Example University | 2020`);
  assert.equal(parsed.location,"Oslo, Norway");assert.equal(parsed.skills,"TypeScript, SQL");assert.equal(parsed.educationHistory.length,1);
 }
 const footer=parseResumeText("Jane Doe\nSoftware Engineer\nSKILLS: SQL\nEXPERIENCE\nEngineer | Example Ltd | London\n2020 - 2022\nPERSONAL INFORMATION\nCurrent location:Oslo, Norway");assert.equal(footer.location,"Oslo, Norway");
});

test("PDF field mapping supports alternate skills and academic headings through the upload API",async()=>{
 const e=environment();await e.call("auth/signup",person);
 const bytes=pdfFixture(["Jane Doe","Business Intelligence Manager","City: Thane, India","SKILL SET | SQL | Excel | Power BI","EMPLOYMENT DETAILS","Jane Doe","Business Intelligence Manager | Example Finance Ltd.","January 2020 - September 2023","Delivered reporting improvements.","ACADEMIC PROFILE","2015 | B.Com | Example University"]);
 const form=new FormData();form.append("file",new File([bytes],"alternate-layout.pdf",{type:"application/pdf"}));
 const response=await e.callFormData("parse-resume",form);const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
 assert.equal(body.parsed.skills,"SQL, Excel, Power BI");assert.equal(body.parsed.location,"Thane, India");assert.equal(body.parsed.workHistory[0].company,"Example Finance Ltd.");assert.equal(body.parsed.educationHistory[0].degree,"B.Com");
});

test("unlabelled academic records can be recovered without counting their study dates as work experience",()=>{
 const e=environment();const {parseResumeText}=e.load("src/lib/resumeParser.ts");
 const parsed=parseResumeText(`Jane Doe
Data Analyst
SKILLS: SQL
EXPERIENCE
Analyst | Example Ltd
2020 - 2022
- Built useful reports.
Study records
B.Com | Example University
2012 - 2015`);
 assert.equal(parsed.workHistory.length,1);assert.equal(parsed.educationHistory.length,1);
 assert.equal(parsed.educationHistory[0].degree,"B.Com");assert.equal(parsed.educationHistory[0].graduationYear,"2015");
});

test("admin can edit and delete applications, inquiries, candidates, and recruiters",async()=>{
 const e=environment("production");
 await e.owner();

 // Create an inquiry
 const inqRes = await e.call("inquiries", { kind: "contact", name: "Inquiry Sender", email: "inquiry@test.local", phone: "123456", company: "Test Corp", subject: "Test Subject", message: "This is a detailed message from inquiry sender.", consent: true });
 assert.equal(inqRes.status, 201);
 const adminData = await (await e.call("admin")).json();
 const inquiryId = adminData.inquiries[0].id;
 assert.ok(inquiryId);

 // Edit inquiry
 const editInqRes = await e.call("admin/edit-inquiry", { id: inquiryId, name: "Updated Sender", email: "inquiry@test.local", phone: "987654", company: "Updated Corp", subject: "Updated Subject", message: "Updated message with more details.", status: "in-progress" });
 assert.equal(editInqRes.status, 200);
 const updatedInq = (await (await e.call("admin")).json()).inquiries.find(i => i.id === inquiryId);
 assert.equal(updatedInq.name, "Updated Sender");
 assert.equal(updatedInq.status, "in-progress");

 // Create candidate & application
 await e.call("auth/signup", person);
 const j = await job(e);
 const appRes = await e.call("apply", { jobId: j.id, coverLetter: "Initial cover letter for analytics role.", consent: true });
 assert.equal(appRes.status, 201);

 const freshAdmin = await (await e.call("admin")).json();
 const app = freshAdmin.applications[0];
 assert.ok(app);

 // Edit application
 const editAppRes = await e.call("admin/edit-application", {
   id: app.id,
   jobTitle: "Senior Analytics Lead",
   candidateName: "Updated Candidate Name",
   candidateEmail: "candidate@example.test",
   headline: "Lead Analytics Architect",
   skills: "Python, SQL, Snowflake",
   experience: 7,
   location: "Mumbai, India",
   phone: "+91 9999999999",
   noticePeriod: "Immediate",
   coverLetter: "Updated candidate letter with more qualifications.",
   resumeUrl: "https://example.com/resume.pdf",
   portfolioUrl: "https://example.com/portfolio"
 });
 assert.equal(editAppRes.status, 200);

 const reloadedAdmin = await (await e.call("admin")).json();
 const reloadedApp = reloadedAdmin.applications.find(a => a.id === app.id);
 assert.equal(reloadedApp.jobTitle, "Senior Analytics Lead");
 const doc = JSON.parse(reloadedApp.document);
 assert.equal(doc.profile.headline, "Lead Analytics Architect");
 assert.equal(doc.profile.skills, "Python, SQL, Snowflake");
 assert.equal(doc.coverLetter, "Updated candidate letter with more qualifications.");

 // Delete application
 const delAppRes = await e.call("admin/delete", { kind: "application", id: app.id });
 assert.equal(delAppRes.status, 200);
 const afterAppDelete = await (await e.call("admin")).json();
 assert.equal(afterAppDelete.applications.some(a => a.id === app.id), false);

 // Delete inquiry
 const delInqRes = await e.call("admin/delete", { kind: "inquiry", id: inquiryId });
 assert.equal(delInqRes.status, 200);
 const afterInqDelete = await (await e.call("admin")).json();
 assert.equal(afterInqDelete.inquiries.some(i => i.id === inquiryId), false);

 // Recruiter: add, edit, delete
 const recAdd = await e.call("admin/recruiter", { name: "Recruiter Alice", email: "alice@test.local", title: "Talent Partner" });
 assert.equal(recAdd.status, 201);
 const recruiterId = (await recAdd.json()).id;

 const recEdit = await e.call("admin/edit-recruiter", { id: recruiterId, name: "Alice Smith", email: "alice@test.local", title: "Senior Talent Partner", active: true });
 assert.equal(recEdit.status, 200);

 const recDel = await e.call("admin/delete", { kind: "recruiter", id: recruiterId });
 assert.equal(recDel.status, 200);
 const afterRecDel = await (await e.call("admin")).json();
 assert.equal(afterRecDel.recruiters.some(r => r.id === recruiterId), false);

 // Candidate: edit, delete
 const candId = reloadedAdmin.candidates[0].id;
 const candEdit = await e.call("admin/edit-candidate", { id: candId, name: "Alice Candidate", headline: "Lead BI", skills: "SQL", experience: 5, location: "Pune", phone: "+91 888", resumeUrl: "https://resume.test" });
 assert.equal(candEdit.status, 200);

 const candDel = await e.call("admin/delete", { kind: "candidate", id: candId });
 assert.equal(candDel.status, 200);
 const afterCandDel = await (await e.call("admin")).json();
 assert.equal(afterCandDel.candidates.some(c => c.id === candId), false);
});

test("employer multipart image uploads require authentication and preserve file bytes", async () => {
  const e = environment();
  async function upload(origin = "https://atsai.test") {
    const form = new FormData();
    form.set("file", new File([Buffer.from([137,80,78,71,13,10,26,10,0])], "logo.png", { type: "image/png" }));
    return e.load("src/lib/ats.ts").atsRequest(new Request("https://atsai.test/api/ats/media", { method: "POST", headers: { origin }, body: form }), "media");
  }
  assert.equal((await upload()).status, 401);
  assert.equal((await e.callATS("auth/signup", { name: "Employer Fixture", email: "upload@example.test", password: "Employer-test-password-2026", company: "Upload Company", country: "IN", consent: true })).status, 201);
  assert.equal((await upload("https://attacker.test")).status, 403);
  const response = await upload();
  assert.equal(response.status, 201);
  const { media } = await response.json();
  assert.equal(media.type, "image/png");
  const row = await e.load("src/lib/admin/db.ts").db().prepare("SELECT bytes FROM media WHERE id=?").get(media.id);
  assert.deepEqual(Buffer.from(row.bytes), Buffer.from([137,80,78,71,13,10,26,10,0]));
});
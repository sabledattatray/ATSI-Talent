import { pdfFixture } from "../tests/fixtures/pdf.mjs";
// Writes fictional records only to a local server backed by a separate test database.
import assert from "node:assert/strict";
const base=new URL(process.argv[2]||"http://127.0.0.1:3005");
if(!["127.0.0.1","localhost"].includes(base.hostname))throw new Error("ATS smoke tests may run only against an isolated local server.");
const seed=Date.now();
function client(){let cookie="";return async(path,body,method=body===undefined?"GET":"POST")=>{const response=await fetch(new URL(path,base),{method,headers:{origin:base.origin,...(cookie?{cookie}:{}),...(body instanceof FormData?{}:{"content-type":"application/json"})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body),redirect:"manual"});const cookies=response.headers.getSetCookie();if(cookies.length)cookie=cookies.map(c=>c.split(";")[0]).join("; ");return response;};}
async function result(response,status=200){const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));return body;}
const employer=client(),candidate=client(),outsider=client();
const owner={name:"QA Hiring Owner",email:`qa-employer-${seed}@example.test`,password:"Local-ATS-fixture-password-2026",company:`QA Global Health ${seed}`,country:"GB",consent:true};
await result(await employer("/api/ats/auth/signup",owner),201);
const jobInput={id:"",version:0,title:"QA Registered Nurse",description:"Provide patient-centred nursing care in a multidisciplinary clinical team. Fictional local test role.",excerpt:"A fictional nursing opportunity used only for local workflow verification.",category:"Healthcare",location:"London, United Kingdom",jobCountry:"GB",jobCity:"London",jobRegion:"England",workMode:"On-site",employmentType:"Full-time",salaryCurrency:"GBP",salaryPeriod:"YEAR",salaryMin:35000,salaryMax:45000,experienceMin:0,experienceMax:10,skills:"Nursing, Patient care",expiresAt:"",status:"published"};
await result(await employer("/api/ats/jobs/save",jobInput));
const workspace=await result(await employer("/api/ats/workspace"));const job=workspace.jobs[0];
for(const path of ["/","/jobs","/employers","/employer/login","/employer/signup",`/jobs/${job.slug}`]){const r=await fetch(new URL(path,base));assert.equal(r.status,200,path);const html=await r.text();assert.ok(html.includes("ATSAI"),path);console.log(`PASS public page ${path}`);}
const publicJobs=await result(await employer("/api/v1/jobs"));assert.ok(publicJobs.data.some(j=>j.id===job.id&&j.salaryCurrency==="GBP"&&j.location.country==="GB"));
const person={name:"QA Candidate",email:`qa-candidate-${seed}@example.test`,password:"Local-candidate-fixture-password-2026",consent:true};
await result(await candidate("/api/recruitment/auth/signup",person),201);
const resume=new FormData();resume.append("file",new File([pdfFixture(["QA Candidate","Registered Nurse","Phone: +44 7700 900123","Location: London, United Kingdom","SKILLS: Nursing, Patient care","SUMMARY","A nursing professional committed to safe patient care."])],"qa-resume.pdf",{type:"application/pdf"}));
const {parsed}=await result(await candidate("/api/recruitment/parse-resume",resume));assert.ok(parsed.resumeUrl.startsWith("/api/ats/resume/"));
await result(await candidate("/api/recruitment/profile",{...parsed,name:person.name}));
await result(await candidate("/api/recruitment/apply",{jobId:job.id,consent:true,coverLetter:"Fictional local test application."}),201);
let a=(await result(await employer("/api/ats/workspace"))).applications[0];assert.equal(a.name,person.name);
assert.equal((await employer(parsed.resumeUrl)).status,200);
await result(await employer("/api/ats/applications/note",{id:a.id,message:"INTERNAL NOTE MUST NEVER BE VISIBLE TO CANDIDATE"}),201);
await result(await employer("/api/ats/applications/stage",{id:a.id,updatedAt:a.updatedAt,status:"review",message:"Your application is under review."}));
await result(await employer("/api/ats/interviews/save",{applicationId:a.id,title:"Nursing team interview",startsAt:new Date(Date.now()+86400000).toISOString(),timeZone:"Europe/London",location:"https://meeting.example.test/qa"}),201);
const tracking=await result(await candidate(`/api/recruitment/tracking?id=${a.id}`));assert.equal(tracking.status,"interview");assert.equal(tracking.interviews.length,1);assert.ok(!JSON.stringify(tracking).includes("INTERNAL NOTE"));
await result(await outsider("/api/ats/auth/signup",{...owner,email:`qa-outsider-${seed}@example.test`,company:"QA Other Company"}),201);
assert.equal((await result(await outsider("/api/ats/workspace"))).applications.length,0);assert.equal((await outsider(parsed.resumeUrl)).status,404);assert.equal((await outsider("/api/ats/applications/note",{id:a.id,message:"Unauthorized"})).status,404);
await result(await employer("/api/ats/interviews/cancel",{id:tracking.interviews[0].id}));
await result(await candidate("/api/recruitment/withdraw",{id:a.id}));assert.equal((await employer(parsed.resumeUrl)).status,404);
a=(await result(await employer("/api/ats/workspace"))).applications[0];assert.equal(a.status,"withdrawn");assert.equal((await employer("/api/ats/applications/stage",{id:a.id,status:"hired",updatedAt:a.updatedAt})).status,409);
await result(await employer("/api/ats/jobs/save",{...jobInput,id:job.id,version:job.version,status:"archived"}));
console.log("PASS company signup, international job publishing, private resume upload, application submission, stage updates, notes, interviews, candidate timeline, company isolation, withdrawal and archiving.");

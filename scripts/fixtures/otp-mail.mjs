// Explicit local QA transport: never load on a deployed server.
import fs from "node:fs/promises";
import path from "node:path";
const inbox=process.env.ATSAI_TEST_OTP_INBOX;
const origin=new URL(process.env.ATSAI_ADMIN_ORIGIN||"http://invalid");
if(!inbox||!path.isAbsolute(inbox)||process.env.ATSAI_DATABASE_PATH!==":memory:"||!["localhost","127.0.0.1"].includes(origin.hostname)||process.env.VERCEL||["ATSAI_TURSO_DATABASE_URL","ATSAI_TURSO_AUTH_TOKEN","TURSO_DATABASE_URL","TURSO_AUTH_TOKEN"].some(key=>process.env[key]))throw new Error("OTP fixture requires an isolated local in-memory database and an absolute test inbox path.");
process.env.ATSAI_AUTH_RESEND_API_KEY="local-qa-fixture";
process.env.ATSAI_AUTH_EMAIL_FROM="ATSAI QA <verify@example.test>";
const realFetch=globalThis.fetch.bind(globalThis);
const codes={};await fs.writeFile(inbox,"{}\n");
globalThis.fetch=async(input,options)=>{
  const url=typeof input==="string"?input:input instanceof URL?input.href:input.url;
  if(new URL(url).hostname!=="api.resend.com")return realFetch(input,options);
  const body=JSON.parse(options?.body||"{}");
  if(body.subject!=="Verify your email address | ATSAI"||!body.to?.every(email=>email.endsWith("@example.test")))throw new Error("QA mail transport accepts only fictional verification emails.");
  const code=body.text?.match(/code is (\d{6})/)?.[1];if(!code)throw new Error("Missing fixture OTP");
  for(const email of body.to)codes[email]=code;
  await fs.writeFile(inbox,JSON.stringify(codes));
  return Response.json({id:"qa-verification-message"});
};

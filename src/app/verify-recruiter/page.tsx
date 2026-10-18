import { RecruiterLookup } from "@/components/recruitment/RecruitmentClient";
export const metadata = { title: "Check an ATSAI recruiter" };
export default function Page() { return <div className="talent-container talent-narrow"><span className="talent-eyebrow">CONFIDENCE BEFORE CONNECTION</span><h1>Check who you’re speaking with.</h1><p>Search the owner-maintained public directory using a recruiter’s exact work email or ID. ATSAI does not charge candidates recruitment fees.</p><RecruiterLookup /></div>; }

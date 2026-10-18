import { redirect } from "next/navigation";
export const metadata = { title: "Candidate sign in", robots: { index: false, follow: false } };
export default function Page() { redirect("/candidate/login"); }

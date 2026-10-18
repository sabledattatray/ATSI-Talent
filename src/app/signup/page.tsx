import { redirect } from "next/navigation";
export const metadata = { title: "Create candidate account", robots: { index: false, follow: false } };
export default function Page() { redirect("/candidate/signup"); }

import { redirect } from "next/navigation";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  redirect("/admin/login");
}

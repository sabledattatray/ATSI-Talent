import Link from "next/link";
export const metadata = { title: "Password reset unavailable", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() {
  return <div className="max-w-xl mx-auto px-6 py-16 space-y-6">
    <h1 className="text-3xl font-bold">Password reset unavailable</h1>
    <p>Accounts and transactional email are not connected in this prototype. No reset link has been generated or sent.</p>
    <Link href="/login" className="text-blue-700 underline">Return to workspace preview</Link>
  </div>;
}

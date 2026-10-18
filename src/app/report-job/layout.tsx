import { DEMO_MODE } from "@/lib/runtime";
export default function Layout({ children }: { children: React.ReactNode }) {
  if (DEMO_MODE) return children;
  return <div className="max-w-2xl mx-auto px-6 py-16 space-y-4"><h1 className="text-3xl font-bold">Abuse reporting unavailable</h1><p>This service is not connected in the pre-launch preview. No information is collected, saved or sent.</p></div>;
}

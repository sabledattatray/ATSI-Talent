import { Suspense } from "react";
import { connection } from "next/server";
import { publicJobs } from "@/lib/admin/public";
import { staticMetadata } from "@/lib/seo";
import { ContentSkeleton } from "@/components/common/PageSkeleton";
import { HomeJobs } from "./HomeJobs";
import HomeClient from "./HomeClient";
export const metadata = staticMetadata("/");
async function Opportunities() {
  await connection();
  return <HomeJobs initialJobs={await publicJobs()} />;
}
export default function Page() {
  return <HomeClient opportunities={<Suspense fallback={<section className="platform-section"><h2>Where your next chapter could begin.</h2><ContentSkeleton /></section>}><Opportunities /></Suspense>} />;
}

import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

async function RedirectProfile(): Promise<null> {
  await connection();
  redirect("/candidate/dashboard?tab=profile");
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton title="Your candidate profile" />}>
      <RedirectProfile />
    </Suspense>
  );
}

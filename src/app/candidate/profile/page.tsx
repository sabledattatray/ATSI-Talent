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
    <Suspense fallback={<div className="talent-container">Opening your profile…</div>}>
      <RedirectProfile />
    </Suspense>
  );
}

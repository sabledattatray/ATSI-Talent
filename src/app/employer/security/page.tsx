import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { employerUser } from "@/lib/ats";
import { authRecord } from "@/lib/auth/identity";
import { AccountSecurity } from "@/components/auth/AccountSecurity";
import { PageSkeleton } from "@/components/common/PageSkeleton";
export const metadata={title:"Account security",robots:{index:false,follow:false}};
async function Security(){await connection();const user=await employerUser();if(!user)redirect("/employer/login");const meta=await authRecord("employer",user.id);return <AccountSecurity scope="employer" email={user.email} googleLinked={!!meta?.googleSub} />;}
export default function Page(){return <Suspense fallback={<PageSkeleton title="Account security" />}><Security /></Suspense>;}

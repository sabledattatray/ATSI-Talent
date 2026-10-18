import { connection } from "next/server";
import { currentUser } from "@/lib/admin/auth";
import { activity, hasOwner, media, records, settings, users } from "@/lib/admin/db";
import { redirect } from "next/navigation";
import { AuthForm } from "./AuthForm";
import { AdminWorkspace } from "./AdminWorkspace";
export async function AdminRoute({ section }: { section: string }) {
  await connection();
  const user = await currentUser();
  if (section === "login" || section === "signup") { if (user) redirect("/admin"); return <AuthForm signup={section === "signup"} />; }
  if (!user) redirect(hasOwner() ? "/admin/login" : "/admin/signup");
  return <AdminWorkspace key={section} section={section} initial={JSON.parse(JSON.stringify({ user, records: records(), media: media(), users: user.role === "owner" ? users() : [], activity: activity(), settings: settings() }))} />;
}

import { connection } from "next/server";
import { currentUser } from "@/lib/admin/auth";
import { hasOwner, workspace } from "@/lib/admin/db";
import { redirect } from "next/navigation";
import { AuthForm } from "./AuthForm";
import { AdminWorkspace } from "./AdminWorkspace";
export async function AdminRoute({ section }: { section: string }) {
  await connection();
  const user = await currentUser();
  if (section === "login" || section === "signup") { if (user) redirect("/admin"); return <AuthForm signup={section === "signup"} />; }
  if (!user) redirect(await hasOwner() ? "/admin/login" : "/admin/signup");
  return <AdminWorkspace key={section} section={section} initial={JSON.parse(JSON.stringify(await workspace(user)))} />;
}

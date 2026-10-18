import { Suspense } from "react";
import { AdminRoute } from "@/components/admin/AdminRoute";
export default function Page() { return <Suspense fallback={<div className="cms-boot">Opening your workspace…</div>}><AdminRoute section="overview" /></Suspense>; }

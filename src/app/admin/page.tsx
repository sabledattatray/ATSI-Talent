import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Suspense } from "react";
import { AdminRoute } from "@/components/admin/AdminRoute";
export default function Page() { return <Suspense fallback={<PageSkeleton title="Administration" />}><AdminRoute section="overview" /></Suspense>; }

import { WorkspaceBoundary } from "@/components/common/WorkspaceBoundary";
export const metadata = { robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceBoundary>{children}</WorkspaceBoundary>;
}

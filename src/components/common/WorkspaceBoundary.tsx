import { DEMO_MODE } from "@/lib/runtime";
import { notFound } from "next/navigation";

export function WorkspaceBoundary({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) notFound();
  return children;
}

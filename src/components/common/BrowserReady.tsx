"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
// Storage-backed demos mount only after hydration, avoiding both mismatches and effect cascades.
export function BrowserReady({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return ready ? children : <p role="status" className="p-12 text-center">Loading workspace preview…</p>;
}

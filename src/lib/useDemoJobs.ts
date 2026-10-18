"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isJobOpen } from "./jobs";
import { DataService } from "./dataService";
import { INITIAL_JOBS } from "./store";
import type { JobListing } from "./types";
const serverSnapshot = JSON.stringify(INITIAL_JOBS);
function subscribe(listener: () => void) {
  window.addEventListener("atsai-demo-change", listener);
  return () => window.removeEventListener("atsai-demo-change", listener);
}
export function useDemoJobs(initialJobs: JobListing[] = []): JobListing[] {
  const [published, setPublished] = useState<JobListing[]>(initialJobs);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetch("/api/published/jobs", { cache: "no-store", signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Jobs unavailable"); return r.json(); }).then(data => setPublished(data.jobs)).catch(() => {});
    load(); window.addEventListener("focus", load);
    return () => { controller.abort(); window.removeEventListener("focus", load); };
  }, []);
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(DataService.getJobs().filter(job => isJobOpen(job, Date.now()))), () => serverSnapshot);
  return useMemo(() => [...published, ...(JSON.parse(snapshot) as JobListing[]).filter(job => !published.some(item => item.id === job.id))], [snapshot, published]);
}

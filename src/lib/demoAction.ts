"use client";
// Event-handler errors need visible feedback; React error boundaries do not catch them.
export function runDemoAction(action: () => unknown): void {
  try { action(); }
  catch (error) { window.alert(error instanceof Error ? error.message : "The demo action could not be saved."); }
}

// Explicit opt-in local fixtures; production never uses sample workflows.
export const DEMO_MODE = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ATSAI_DEMO === "true";

import { restricted, unavailable } from "@/lib/api-boundary";

export function GET() { return restricted(); }
export function POST() { return unavailable(); }

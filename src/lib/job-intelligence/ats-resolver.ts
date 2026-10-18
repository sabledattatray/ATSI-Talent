/**
 * Provider-specific ATS detection and official structured data resolver.
 * Detects Greenhouse, Lever, Ashby, Workday, etc., and queries official public APIs where permitted.
 */

export type AtsProviderType = "greenhouse" | "lever" | "ashby" | "workday" | "smartrecruiters" | "generic";

export interface AtsResolvedPayload {
  provider: AtsProviderType;
  sourceUrl: string;
  isApiResolved: boolean;
  jsonData?: Record<string, any>;
  html?: string;
  rawPayload: string;
}

/**
 * Detects the ATS provider from the target URL.
 */
export function detectAtsProvider(rawUrl: string): AtsProviderType {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();

    if (host.includes("greenhouse.io")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("ashbyhq.com")) return "ashby";
    if (host.includes("workdayjobs.com") || host.includes("workday.com")) return "workday";
    if (host.includes("smartrecruiters.com")) return "smartrecruiters";
    return "generic";
  } catch {
    return "generic";
  }
}

/**
 * Fetches structured vacancy payload using official ATS APIs or HTML fallback.
 */
export async function resolveAtsPayload(url: string): Promise<AtsResolvedPayload> {
  const provider = detectAtsProvider(url);

  // 1. Greenhouse Provider Resolution
  if (provider === "greenhouse") {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/([^\/]+)\/jobs\/([^\/?#]+)/);
      if (match) {
        const boardToken = match[1];
        const jobId = match[2];
        const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}?questions=true`;

        const res = await fetch(apiUrl, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const json = await res.json();
          if (json && (json.title || json.content)) {
            return {
              provider: "greenhouse",
              sourceUrl: url,
              isApiResolved: true,
              jsonData: json,
              rawPayload: JSON.stringify(json)
            };
          }
        }
      }
    } catch {
      // Fallback to HTML fetch
    }
  }

  // 2. Lever Provider Resolution
  if (provider === "lever") {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/([^\/]+)\/([a-f0-9-]+)/i);
      if (match) {
        const site = match[1];
        const jobId = match[2];
        const apiUrl = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(jobId)}`;

        const res = await fetch(apiUrl, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const json = await res.json();
          if (json && (json.text || json.description || json.descriptionBody)) {
            return {
              provider: "lever",
              sourceUrl: url,
              isApiResolved: true,
              jsonData: json,
              rawPayload: JSON.stringify(json)
            };
          }
        }
      }
    } catch {
      // Fallback to HTML fetch
    }
  }

  // 3. Fallback: Direct safe HTTP GET
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    throw new Error(`Source server returned HTTP ${res.status}: ${res.statusText}`);
  }

  const rawText = await res.text();
  return {
    provider,
    sourceUrl: url,
    isApiResolved: false,
    html: rawText,
    rawPayload: rawText
  };
}

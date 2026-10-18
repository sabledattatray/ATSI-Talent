import { isIP } from "node:net";

export class SecurityValidationError extends Error {
  code: string;
  constructor(message: string, code = "SECURITY_VIOLATION") {
    super(message);
    this.name = "SecurityValidationError";
    this.code = code;
  }
}

/**
 * Validates a target URL against SSRF, internal network probing, and malicious schemes.
 */
export function validateSafeUrl(rawUrl: string, allowedDomains?: string[]): URL {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new SecurityValidationError("A valid URL string is required.", "INVALID_URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new SecurityValidationError(`Malformed URL: ${rawUrl}`, "MALFORMED_URL");
  }

  // 1. Strict Protocol check
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new SecurityValidationError(`Disallowed URL scheme: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`, "DISALLOWED_SCHEME");
  }

  // Reject credentials in URL (e.g. https://user:pass@example.com)
  if (parsed.username || parsed.password) {
    throw new SecurityValidationError("URLs with embedded user credentials are not permitted.", "EMBEDDED_CREDENTIALS");
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Loopback and internal named hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "local" ||
    hostname.endsWith(".local") ||
    hostname === "internal" ||
    hostname.endsWith(".internal") ||
    hostname === "broadcasthost" ||
    hostname === "ip6-localhost" ||
    hostname === "ip6-loopback"
  ) {
    throw new SecurityValidationError(`Access to internal/loopback host '${hostname}' is strictly blocked.`, "SSRF_LOOPBACK_BLOCKED");
  }

  // 3. IP-based checks
  const ipVersion = isIP(hostname);
  if (ipVersion !== 0) {
    if (isPrivateOrRestrictedIP(hostname)) {
      throw new SecurityValidationError(`Access to private/restricted IP '${hostname}' is strictly blocked.`, "SSRF_PRIVATE_IP_BLOCKED");
    }
  }

  // 4. Source domain allowlist (if provided)
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some(domain => {
      const cleanDomain = domain.toLowerCase().trim();
      if (cleanDomain.startsWith("*.")) {
        const root = cleanDomain.slice(2);
        return hostname === root || hostname.endsWith("." + root);
      }
      return hostname === cleanDomain;
    });

    if (!isAllowed) {
      throw new SecurityValidationError(
        `Hostname '${hostname}' is outside the authorized source domain allowlist [${allowedDomains.join(", ")}].`,
        "DOMAIN_NOT_ALLOWED"
      );
    }
  }

  return parsed;
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, or cloud-metadata subnets.
 */
export function isPrivateOrRestrictedIP(ip: string): boolean {
  // IPv4 checks
  if (ip.includes(".")) {
    const parts = ip.split(".").map(p => Number.parseInt(p, 10));
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
      return true; // invalid IP format treated as unsafe
    }

    const [a, b] = parts;

    // 0.0.0.0/8 (current network)
    if (a === 0) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (private)
    if (a === 10) return true;
    // 172.16.0.0/12 (private: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (link-local, cloud metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET)
    if (a === 192 && b === 0 && parts[2] === 2) return true;
    if (a === 198 && b === 51 && parts[2] === 100) return true;
    if (a === 203 && b === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (multicast)
    if (a >= 224) return true;

    return false;
  }

  // IPv6 checks
  const cleanIPv6 = ip.toLowerCase();
  if (cleanIPv6 === "::1" || cleanIPv6 === "::" || cleanIPv6.startsWith("fe80:") || cleanIPv6.startsWith("fc00:") || cleanIPv6.startsWith("fd00:")) {
    return true;
  }

  return false;
}

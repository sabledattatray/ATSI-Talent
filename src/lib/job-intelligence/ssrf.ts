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
  const ipAddress = hostname.replace(/^\[|\]$/g, "");
  const ipVersion = isIP(ipAddress);
  if (ipVersion !== 0) {
    if (isPrivateOrRestrictedIP(ipAddress)) {
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
  if (ip.includes(".") && !ip.includes(":")) {
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
  const cleanIPv6 = ip.toLowerCase().replace(/^\[|\]$/g, "");
  // URL parsing canonicalizes expanded forms and IPv4-mapped addresses.
  let normalized: string;
  try {
    normalized = new URL(`http://[${cleanIPv6}]/`).hostname.slice(1, -1);
  } catch {
    return true;
  }
  if (normalized.startsWith("::ffff:")) {
    const words = normalized.slice(7).split(":");
    if (words.length !== 2) return true;
    const high = Number.parseInt(words[0], 16), low = Number.parseInt(words[1], 16);
    return isPrivateOrRestrictedIP(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  // Only global unicast IPv6 (2000::/3) is eligible for public fetches.
  const first = Number.parseInt(normalized.split(":")[0], 16);
  return !(first >= 0x2000 && first <= 0x3fff);
}

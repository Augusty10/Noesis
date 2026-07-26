import { URL } from "url";
import dns from "dns";
import { promisify } from "util";

const lookupAsync = promisify(dns.lookup);

/**
 * Validates a URL to protect against SSRF (Server-Side Request Forgery).
 * Rejects non-HTTP(S) protocols and local/private IP ranges.
 */
export async function validateUrl(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;
    // Localhost checks
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return false;
    }

    // Perform DNS lookup to resolve host to IP
    const { address } = await lookupAsync(hostname).catch(() => ({ address: "" }));
    if (!address) {
      return false;
    }

    // Check private/local IPv4 ranges
    if (
      address === "127.0.0.1" ||
      address === "::1" ||
      address.startsWith("127.") ||
      address.startsWith("10.") ||
      address.startsWith("192.168.") ||
      address.startsWith("169.254.") // link-local
    ) {
      return false;
    }

    // Check 172.16.0.0/12 private range
    if (address.startsWith("172.")) {
      const parts = address.split(".");
      if (parts.length === 4) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    return false;
  }
}

import dns from 'dns/promises';
import net from 'net';

const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
]);

/**
 * Checks if an IPv4 address is within private / link-local / loopback ranges.
 */
function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;

  // IPv4 range checks
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [p0, p1] = parts;
    // 10.0.0.0/8
    if (p0 === 10) return true;
    // 172.16.0.0/12
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link Local / Cloud Metadata)
    if (p0 === 169 && p1 === 254) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 0.0.0.0/8
    if (p0 === 0) return true;
  }

  // IPv6 checks (link-local fe80::, unique local fc00::, loopback ::1)
  if (ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:') || ip === '::1') {
    return true;
  }

  return false;
}

/**
 * Validates a target URL against Server-Side Request Forgery (SSRF).
 * Returns { safe: true } or { safe: false, reason: string }.
 */
export async function validateSsrfTarget(urlString: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const parsed = new URL(urlString);

    // 1. Enforce HTTP/HTTPS protocols only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}. Only http: and https: are allowed.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject disallowed and metadata hostnames
    if (DISALLOWED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, reason: `Target hostname "${hostname}" is restricted.` };
    }

    // 3. If hostname is an IP directly, verify it is not private
    if (net.isIP(hostname)) {
      if (isPrivateIp(hostname)) {
        return { safe: false, reason: `Target IP "${hostname}" is in a private or link-local address space.` };
      }
      return { safe: true };
    }

    // 4. Resolve DNS to protect against DNS rebinding attacks
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          return {
            safe: false,
            reason: `Target hostname "${hostname}" resolves to private IP: ${addr.address}`,
          };
        }
      }
    } catch {
      // If DNS cannot be resolved, reject request safely
      return { safe: false, reason: `Failed to resolve hostname: ${hostname}` };
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: err.message || 'Invalid target URL format' };
  }
}

/**
 * Validates Firebase / external service identifier strings (prevents URL injection via path interpolation).
 */
export function validateServiceIdentifier(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Only alphanumeric, hyphens, and underscores are allowed
  return /^[a-zA-Z0-9_\-\.]+$/.test(id) && !id.includes('..') && !id.includes('/');
}

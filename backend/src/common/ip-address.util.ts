/**
 * The rule this codebase follows for any client IP before it's used for
 * anything beyond raw storage (geolocation, anomaly detection, a security
 * dashboard — none of which exist yet, see docs/architecture/ip-tracking.md):
 *
 *   - a real public client IP           → 'public'  — usable
 *   - a private/internal/loopback IP     → 'private' — this backend's own
 *     Docker network or a direct/dev request that never passed through
 *     NPM (see trust-proxy.config.ts) — never a real client location
 *   - missing or unparseable             → 'unknown'
 *
 * `'private'` and `'unknown'` are deliberately both "not usable as a real
 * client location" — callers that only care about that distinction can
 * treat anything other than `'public'` as unknown. They're kept separate
 * here because "we got no IP at all" and "we got an address that is
 * definitely internal" are different diagnostic signals worth telling
 * apart in logs/audits, even though neither should ever be geolocated.
 *
 * This performs no lookup and has no external dependency — it only
 * classifies the shape of the address itself.
 */
export type ClientIpClassification = 'public' | 'private' | 'unknown';

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 — includes Docker's default bridge ranges
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  return false;
}

/**
 * Strips the `::ffff:` prefix Node sometimes uses to represent an IPv4
 * address in IPv6 form (e.g. a dual-stack socket), so `1.2.3.4` and
 * `::ffff:1.2.3.4` classify identically.
 */
function unwrapIpv4MappedIpv6(ip: string): string {
  const match = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(ip);
  return match ? match[1] : ip;
}

export function classifyClientIp(ip: string | null | undefined): ClientIpClassification {
  if (!ip) return 'unknown';
  const trimmed = unwrapIpv4MappedIpv6(ip.trim());
  if (!trimmed) return 'unknown';

  const ipv4Match = IPV4_PATTERN.exec(trimmed);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    if (octets.some((o) => o > 255)) return 'unknown';
    return isPrivateIpv4(octets) ? 'private' : 'public';
  }

  if (trimmed.includes(':')) {
    const lower = trimmed.toLowerCase();
    if (lower === '::1') return 'private'; // loopback
    if (lower.startsWith('fe80:')) return 'private'; // link-local
    // fc00::/7 — unique local addresses (fc.. or fd..), IPv6's equivalent of RFC1918
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return 'private';
    return 'public';
  }

  return 'unknown';
}

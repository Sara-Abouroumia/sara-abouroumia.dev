import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Telling visitors apart without keeping their IP addresses.
 *
 * Two features need "is this the same visitor as before?": the visit counter
 * (count a network once a day) and the contact form's rate limit (at most a
 * few messages from one network). Both answer it the same way, here, so the
 * privacy properties are decided once:
 *
 *   - Network, not address: IPv4 whole, IPv6 cut to its /64 (see networkOf).
 *   - Keyed hash, not the network itself: HMAC-SHA256 under
 *     VISIT_HASH_SECRET, so a leaked table cannot be brute-forced back into
 *     IPs, even though IPv4 has only 4 billion values.
 *   - Scoped: every caller mixes in what the key is for and its time window,
 *     so the same network yields unrelated values for each feature and each
 *     day, and no row can be linked to another.
 */

/**
 * The key for every hash. VISIT_HASH_SECRET is its own variable so that a
 * leak of the database alone is not enough to reverse the hashes. Falling
 * back to DATABASE_URL keeps everything working if it was never set (it is
 * secret too), at the cost of that separation, so set it. The name predates
 * the rate limit; it covers both.
 */
function hashSecret(): string {
  return process.env.VISIT_HASH_SECRET || process.env.DATABASE_URL || "dev";
}

/**
 * A 128-bit keyed hash (32 hex characters) of a network, within a scope.
 * `scope` says what it is for and when ("2026-10-29", "contact:10m:2930731"),
 * and must differ between uses so their values never coincide.
 */
export function networkKey(scope: string, network: string): string {
  return createHmac("sha256", hashSecret())
    .update(`${scope}|${network}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * The part of an IP address that identifies a network, or null for anything
 * that is not an IP.
 *
 * IPv4: the whole address. Many people behind one router (a home, a
 * university) share it and count as one. For a country-level map, and for a
 * rate limit generous enough for real people, that undercount is the right
 * trade: the alternative lets one machine count as many visitors as it likes.
 *
 * IPv6: only the first 64 bits. A single home line is usually handed a /64,
 * which is 18 quintillion addresses, and a script can pick a fresh one for
 * every request. Hashing the whole address would let anyone with an IPv6
 * connection count without limit. The /64 is what identifies the line.
 *
 * IPv4-mapped IPv6 ("::ffff:1.2.3.4") is treated as the IPv4 it carries.
 */
export function networkOf(ip: string): string | null {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) return null;
  // Expand "::" so every address has eight groups, then keep four.
  const [head, tail = ""] = ip.split("::");
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const zeros = Array(8 - front.length - back.length).fill("0");
  const groups = ip.includes("::") ? [...front, ...zeros, ...back] : front;
  return `${groups
    .slice(0, 4)
    .map((g) => Number.parseInt(g, 16).toString(16))
    .join(":")}::/64`;
}

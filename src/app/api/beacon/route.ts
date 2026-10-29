import { geolocation, ipAddress } from "@vercel/functions";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { recordVisit } from "@/lib/visits";

/**
 * POST /api/beacon: count one visit for the visitor's country.
 *
 * The country comes from Vercel's edge (x-vercel-ip-country), which resolves
 * it from the IP before the request reaches this code. The IP is read here
 * for one purpose: recordVisit() turns it into a keyed, daily hash so a
 * network counts once a day. The IP itself is never stored or logged, and
 * the hash is deleted the next day (see visitSeen in db/schema.ts).
 *
 * It answers 204 at once and does the database write in after(): the visitor
 * has nothing to wait for, and a slow or sleeping database cannot slow the
 * page down.
 *
 * Threat model. This is a public endpoint anyone can POST to, so assume a
 * script, not a browser:
 *   - Headers are not proof. Sec-Fetch-Site cannot be forged by script
 *     running in a browser, which is what stops another SITE from making its
 *     visitors' browsers inflate the counts. A script (curl, a bot) sends
 *     any header it likes, so that check does nothing against one.
 *   - What stops a script is the dedupe: one count per IPv4 address or IPv6
 *     /64 per day, however many requests. Inflating a country by N takes N
 *     distinct networks in that country, which means renting a botnet or a
 *     residential proxy pool, for a dot on a portfolio.
 *   - What protects the bill is the Vercel Firewall rate-limit rule on this
 *     path (dashboard, Firewall > Rules): floods are refused at the edge
 *     before this function runs or Neon wakes.
 *   - What heals the rest is time: the map reads the last 365 days, so
 *     whatever slips through ages out on its own.
 *   - Page rebuilds are capped: only a country's first visit of the day
 *     triggers one, so at most one per country per day.
 *   - Self-declared bots and link-preview fetchers are skipped.
 */

/** Crawlers and preview fetchers that announce themselves. */
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse/i;

export async function POST(request: Request) {
  // Sec-Fetch-Site is set by the browser and cannot be changed by page
  // script, so a browser on another site gets "cross-site" here. Absent
  // (very old browsers, or a non-browser client) falls back to comparing the
  // Origin header. Neither stops a script; see the threat model above.
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const sameOrigin = site ? site === "same-origin" : hostOf(origin) === host;
  if (!sameOrigin) return new Response(null, { status: 403 });

  if (BOT.test(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204 });
  }

  // Locally there is no Vercel edge to set these headers, so a development
  // server can name a country to test with (BEACON_DEV_COUNTRY=TR) and
  // counts as one fixed address.
  const dev = process.env.NODE_ENV === "development";
  const country =
    geolocation(request).country ??
    (dev ? process.env.BEACON_DEV_COUNTRY : undefined);
  const ip = ipAddress(request) ?? (dev ? "127.0.0.1" : undefined);

  if (country && ip) {
    after(async () => {
      try {
        const firstToday = await recordVisit(country.toUpperCase(), ip);
        if (firstToday) {
          // The map changed, so throw away both cached layers: the counts
          // (expire: 0, so the rebuild below cannot be handed the stale
          // ones) and the page. The next visitor still gets the old page
          // instantly and triggers the rebuild; everyone after sees the
          // new country.
          revalidateTag("visits", { expire: 0 });
          revalidatePath("/");
        }
      } catch (error) {
        console.error("beacon: could not record visit", error);
      }
    });
  }

  // 204 whether or not it counted: the client has nothing to do with the
  // answer, and saying "not counted" would only teach a script what to fake.
  return new Response(null, { status: 204 });
}

/**
 * The host of an Origin header, or null. Guarded because Origin can be the
 * literal string "null" (sandboxed frames, some redirects), which new URL()
 * throws on.
 */
function hostOf(origin: string | null): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

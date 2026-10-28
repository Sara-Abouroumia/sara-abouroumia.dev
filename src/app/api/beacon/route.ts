import { geolocation } from "@vercel/functions";
import { after } from "next/server";
import { recordVisit } from "@/lib/visits";

/**
 * POST /api/beacon: count one visit for the visitor's country.
 *
 * The country comes from Vercel's edge (x-vercel-ip-country), which resolves
 * it from the IP before the request reaches this code. This handler sees the
 * two-letter result only, and stores only that plus the day. The IP itself
 * is never read here, never logged, never kept.
 *
 * It answers 204 at once and does the database write in after(): the visitor
 * has nothing to wait for, and a slow or sleeping database cannot slow the
 * page down.
 *
 * Abuse is limited rather than prevented, which fits what is at stake (a
 * public, approximate, country-level counter):
 *   - the page sends one beacon per browser session (see <VisitBeacon />),
 *   - cross-site requests are refused, so another site cannot make its
 *     visitors' browsers inflate the counts,
 *   - self-declared bots and link-preview fetchers are not counted.
 * A determined script can still add numbers. If that ever happens, the fix
 * is the rate-limit table Phase 2 brings for the forms, not anything here.
 */

/** Crawlers and preview fetchers that announce themselves. */
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse/i;

export async function POST(request: Request) {
  // Sec-Fetch-Site is set by the browser and cannot be forged by page script.
  // "same-origin" means our own pages sent this. Absent (very old browsers,
  // or a non-browser client) falls back to comparing the Origin header.
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const sameOrigin = site ? site === "same-origin" : hostOf(origin) === host;
  if (!sameOrigin) return new Response(null, { status: 403 });

  if (BOT.test(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204 });
  }

  // Locally there is no Vercel edge to set the header, so a development
  // server can name a country to test with (BEACON_DEV_COUNTRY=TR).
  const country =
    geolocation(request).country ??
    (process.env.NODE_ENV === "development"
      ? process.env.BEACON_DEV_COUNTRY
      : undefined);

  if (country) {
    after(async () => {
      try {
        await recordVisit(country.toUpperCase());
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

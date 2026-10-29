import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { visitCounts } from "@/db/schema";

export type CountryVisits = { code: string; visits: number };

/** Anything else from a geolocation header is junk and is not counted. */
const COUNTRY = /^[A-Z]{2}$/;

/**
 * How far back the map looks. A rolling window rather than all-time, for two
 * reasons that matter more the longer the site lives:
 *   - it shows where the site is read NOW, not where it was read in 2026;
 *   - it heals itself: anything that slips past the defences and inflates a
 *     country ages out on its own a year later, with nobody cleaning up.
 */
const WINDOW_DAYS = 365;

/**
 * Count one visit for a country, at most once per network per day.
 *
 * One SQL statement, so one HTTP round trip to Neon and one atomic step:
 *   1. `seen`: remember this visitor for today. ON CONFLICT DO NOTHING makes
 *      a repeat insert return no row.
 *   2. `counted`: bump the country's count, selecting FROM `seen`, so it
 *      runs only if step 1 inserted. A repeat visitor never reaches it.
 *   3. `swept`: forget every visitor from before today.
 * Postgres runs all three even though the final SELECT only reads one:
 * data-modifying CTEs always run to completion. It is raw SQL rather than
 * Drizzle's builder because the builder cannot make one insert depend on
 * another inside a single statement.
 *
 * Returns true when this was the country's FIRST visit of the day, the one
 * moment the map visibly changes (a country lights up, or its day restarts).
 * The beacon refreshes the page only then, which caps page rebuilds at one
 * per country per day, ~250 at the very most, however hard anyone pushes.
 */
export async function recordVisit(
  country: string,
  ip: string,
): Promise<boolean> {
  if (!db || !COUNTRY.test(country)) return false;
  const network = networkOf(ip);
  if (!network) return false;
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHmac("sha256", hashSecret())
    .update(`${day}|${network}`)
    .digest("hex")
    .slice(0, 32);

  // Casts on the SELECT list: parameters arrive untyped, and Postgres will
  // not assign untyped text to a date column without being told.
  const result = await db.execute<{ count: number }>(sql`
    with seen as (
      insert into visit_seen (day, visitor)
      values (${day}::date, ${visitor})
      on conflict do nothing
      returning 1
    ), counted as (
      insert into visit_counts (country_code, day, count)
      select ${country}::char(2), ${day}::date, 1 from seen
      on conflict (country_code, day)
        do update set count = visit_counts.count + 1
      returning count
    ), swept as (
      delete from visit_seen where day < ${day}::date
    )
    select count from counted
  `);
  return result.rows[0]?.count === 1;
}

/**
 * The key for the visitor hash. VISIT_HASH_SECRET is its own variable so
 * that a leak of the database alone is not enough to reverse the hashes.
 * Falling back to DATABASE_URL keeps counting working if it was never set
 * (it is secret too), at the cost of that separation, so set it.
 */
function hashSecret(): string {
  return process.env.VISIT_HASH_SECRET || process.env.DATABASE_URL || "dev";
}

/**
 * The part of an IP address that identifies a network, or null for anything
 * that is not an IP.
 *
 * IPv4: the whole address. Many people behind one router (a home, a
 * university) share it and count once a day. For a country-level map that
 * undercount is the right trade: the alternative lets one machine count as
 * many visitors as it likes.
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

/**
 * Visits per country over the last WINDOW_DAYS, straight from the database,
 * cached for a day and tagged "visits".
 *
 * The cache is why the About page never queries the database while a
 * visitor waits. That matters twice over: it keeps the page static and fast,
 * and Neon's free tier sleeps when idle, so a query on request would make the
 * unlucky first visitor of the morning wait for it to wake. Instead the page
 * is rebuilt in the background: when a country gets its first visit of the
 * day (the beacon expires this tag and the page), and otherwise at most once
 * a day (see `revalidate` in app/page.tsx).
 *
 * It THROWS on a database error, on purpose: unstable_cache stores whatever
 * the function returns, so catching inside would cache the failure, and one
 * blip would leave the map empty for a whole day. A thrown error is not
 * stored, so the next render simply tries again. getCountryVisits() below is
 * where it is caught.
 */
const readCountryVisits = unstable_cache(
  async (): Promise<CountryVisits[]> => {
    if (!db) return [];
    const rows = await db
      .select({
        code: visitCounts.countryCode,
        visits: sql<number>`sum(${visitCounts.count})::int`,
      })
      .from(visitCounts)
      .where(sql`${visitCounts.day} > current_date - ${WINDOW_DAYS}::int`)
      .groupBy(visitCounts.countryCode);
    return rows.filter((r) => COUNTRY.test(r.code) && r.visits > 0);
  },
  ["country-visits"],
  { revalidate: 86400, tags: ["visits"] },
);

/**
 * Visits per country for the map. Never throws: a database that is missing,
 * asleep or misconfigured costs the map its dots, not the page its build.
 *
 * Only real database answers pass through the cache. The no-database case
 * (and demo mode) is decided out here, before it, so a run without a
 * database can never leave an empty answer cached for the day after one is
 * connected.
 */
export async function getCountryVisits(): Promise<CountryVisits[]> {
  if (!db) return demoVisits();
  try {
    return await readCountryVisits();
  } catch (error) {
    console.error("visits: could not read counts", error);
    return [];
  }
}

/**
 * Sample counts for local design work only: `VISITS_DEMO=1` in .env.local,
 * development server, no database. Never in a build, so it cannot leak onto
 * the live site as fake numbers.
 */
function demoVisits(): CountryVisits[] {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.VISITS_DEMO !== "1"
  ) {
    return [];
  }
  return [
    { code: "TR", visits: 240 },
    { code: "NL", visits: 64 },
    { code: "US", visits: 52 },
    { code: "DE", visits: 31 },
    { code: "GB", visits: 22 },
    { code: "EG", visits: 18 },
    { code: "IN", visits: 12 },
    { code: "CA", visits: 9 },
    { code: "SA", visits: 7 },
    { code: "BR", visits: 4 },
    { code: "JP", visits: 3 },
    { code: "AU", visits: 2 },
  ];
}

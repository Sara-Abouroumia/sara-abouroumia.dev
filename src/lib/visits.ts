import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { visitCounts } from "@/db/schema";

export type CountryVisits = { code: string; visits: number };

/** Anything else from a geolocation header is junk and is not counted. */
const COUNTRY = /^[A-Z]{2}$/;

/**
 * Add one visit for a country, today. A single upsert: insert the day's row
 * at 1, or bump it if it exists, so two visits landing at once cannot both
 * read 5 and both write 6.
 */
export async function recordVisit(country: string): Promise<void> {
  if (!db || !COUNTRY.test(country)) return;
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(visitCounts)
    .values({ countryCode: country, day, count: 1 })
    .onConflictDoUpdate({
      target: [visitCounts.countryCode, visitCounts.day],
      set: { count: sql`${visitCounts.count} + 1` },
    });
}

/**
 * All-time visits per country, straight from the database, cached for a day
 * and tagged "visits".
 *
 * The cache is why the About page never queries the database while a
 * visitor waits. That matters twice over: it keeps the page static and fast,
 * and Neon's free tier sleeps when idle, so a query on request would make the
 * unlucky first visitor of the morning wait for it to wake. Instead the page
 * is rebuilt in the background at most once a day (see `revalidate` in
 * app/page.tsx).
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

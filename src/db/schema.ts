import { char, date, integer, pgTable, primaryKey } from "drizzle-orm/pg-core";

/**
 * Visits, as one counter per country per day. Nothing else.
 *
 * What is deliberately NOT here: no IP address, no city, no coordinates, no
 * user agent, no visitor id, no timestamp finer than a day. A row says "12
 * visits from TR on 2026-10-26" and cannot say anything more, so there is no
 * personal data to protect, leak, or be asked to delete. That is also what
 * lets the site count without a cookie banner: nothing is read from or
 * written to the visitor's device for it (see the beacon).
 *
 * One row per (country, day) rather than one per visit: the table stays tiny
 * however busy the site gets, and a day's counts can later be summed into a
 * "last 30 days" view without changing anything here.
 */
export const visitCounts = pgTable(
  "visit_counts",
  {
    /** ISO 3166-1 alpha-2, upper case: "TR", "NL". */
    countryCode: char("country_code", { length: 2 }).notNull(),
    /** UTC calendar day, as "YYYY-MM-DD". */
    day: date("day", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.countryCode, t.day] })],
);

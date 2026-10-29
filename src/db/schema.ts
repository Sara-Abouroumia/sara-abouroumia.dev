import {
  char,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";

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
 * however busy the site gets (at most ~250 rows a day, ~1M after ten busy
 * years, which Postgres sums without noticing), and the map reads a rolling
 * window of days from it (see lib/visits.ts).
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

/**
 * Who has already been counted today, so a network counts once a day however
 * many tabs, incognito windows or scripted requests it sends.
 *
 * `visitor` is not an IP. It is HMAC-SHA256(secret, day + network), cut to
 * 128 bits, where the network is the IPv4 address or the IPv6 /64 (see
 * networkOf in lib/network-key.ts). Three properties follow, and they are the
 * point of the design:
 *   - Keyed: without VISIT_HASH_SECRET, a leaked copy of this table cannot be
 *     brute-forced back into IPs, even though IPv4 has only 4 billion values.
 *   - Daily: the day is inside the hash, so the same network yields an
 *     unrelated value tomorrow. No row can link two days of one visitor.
 *   - Short-lived: every write sweeps rows older than today, so the table
 *     only ever holds today (plus nothing at all on a quiet day).
 *
 * Primary key (day, visitor), day first: the daily sweep is then a range
 * scan over the front of the index, and the duplicate check is an exact hit.
 */
export const visitSeen = pgTable(
  "visit_seen",
  {
    day: date("day", { mode: "string" }).notNull(),
    /** 32 hex characters: the first 128 bits of the keyed hash. */
    visitor: char("visitor", { length: 32 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.visitor] })],
);

/**
 * Rate-limit counters for the public forms: how many submissions one network
 * has made in the current window. Nothing else.
 *
 * `key` is networkKey(`${scope}:${slot}`, network) from lib/network-key.ts:
 * a keyed hash, never an IP, and it changes with every window, so a row says
 * "some network sent 2 messages in this 10-minute slot" and nothing that
 * links it to the next slot or to a person.
 *
 * `expires_at` is when the window closes. Every check deletes expired rows in
 * the same statement, so the table holds only windows still open: a few rows,
 * gone within a day. The index on it is what keeps that sweep cheap.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: char("key", { length: 32 }).primaryKey(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("rate_limits_expires_at_idx").on(t.expiresAt)],
);

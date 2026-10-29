import { sql } from "drizzle-orm";
import { db } from "@/db";
import { networkKey, networkOf } from "@/lib/network-key";

/**
 * At most `max` actions per network in each `windowSeconds`. Windows are
 * fixed slots (00:00-00:10, 00:10-00:20, ...) rather than sliding: one
 * counter per slot, no timestamps per request, and the worst case of a burst
 * across a slot boundary is twice the limit, which for a contact form is
 * still a handful of emails.
 */
export type Limit = { scope: string; max: number; windowSeconds: number };

export type LimitResult =
  | { ok: true }
  /** Seconds until the tightest exceeded window closes. */
  | { ok: false; retryAfter: number };

/**
 * Counts one action against every limit and says whether it is allowed.
 *
 * One SQL statement, so one round trip to Neon and one atomic step, which is
 * what stops two submissions sent at the same instant from both reading
 * "under the limit":
 *   1. `hit`: upsert every limit's counter for the current slot, +1 each,
 *      returning the new counts.
 *   2. `swept`: delete counters whose window has closed.
 *
 * It FAILS OPEN. No database, no usable IP, or a database error: the action
 * is allowed. The limit exists to stop scripted floods, and losing a real
 * person's message because Neon was asleep would be the worse failure.
 */
export async function checkRateLimit(
  ip: string | undefined,
  limits: Limit[],
): Promise<LimitResult> {
  const network = ip ? networkOf(ip) : null;
  if (!db || !network || limits.length === 0) return { ok: true };

  const now = Math.floor(Date.now() / 1000);
  const slots = limits.map((limit) => {
    const slot = Math.floor(now / limit.windowSeconds);
    return {
      limit,
      key: networkKey(`${limit.scope}:${slot}`, network),
      expiresAt: new Date((slot + 1) * limit.windowSeconds * 1000),
    };
  });

  try {
    const rows = sql.join(
      slots.map(
        (s) => sql`(${s.key}, 1, ${s.expiresAt.toISOString()}::timestamptz)`,
      ),
      sql`, `,
    );
    const result = await db.execute<{ key: string; count: number }>(sql`
      with hit as (
        insert into rate_limits (key, count, expires_at)
        values ${rows}
        on conflict (key) do update set count = rate_limits.count + 1
        returning key, count
      ), swept as (
        delete from rate_limits where expires_at < now()
      )
      select key, count from hit
    `);

    const counts = new Map(result.rows.map((r) => [r.key, Number(r.count)]));
    const exceeded = slots.filter(
      (s) => (counts.get(s.key) ?? 0) > s.limit.max,
    );
    if (exceeded.length === 0) return { ok: true };
    // The visitor can act again once every exceeded window has closed.
    const until = Math.max(...exceeded.map((s) => s.expiresAt.getTime()));
    return { ok: false, retryAfter: Math.ceil((until - Date.now()) / 1000) };
  } catch (error) {
    console.error("rate-limit: check failed, allowing", error);
    return { ok: true };
  }
}

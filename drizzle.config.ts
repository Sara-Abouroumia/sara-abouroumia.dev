import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads this to turn src/db/schema.ts into real tables.
 *
 * `npm run db:push` compares the schema with the database and applies the
 * difference. Fine while the tables hold nothing worth migrating carefully;
 * switch to generated migrations (`drizzle-kit generate`) once Phase 2 adds
 * tables that hold things people wrote.
 *
 * Known flaw, as of drizzle-kit 0.31.11 (the latest stable): it misreads
 * composite primary keys, so EVERY push drops and re-adds the keys of
 * visit_counts and visit_seen, even when nothing changed. The result is
 * identical, but for that instant the tables have no uniqueness guarantee.
 * So for a schema change, write the SQL by hand (CREATE TABLE IF NOT EXISTS,
 * as rate_limits was added). To compare schema and database without changing
 * anything, run `npm run db:push -- --strict --verbose` in a terminal: it
 * prints the statements and asks before running them, so answer No. Anything
 * beyond those four key statements is a real difference. push has no
 * dry-run; without --strict it applies straight away. The fix is in the 1.0
 * line, still in beta.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit runs outside Next, so it does not load .env.local by itself;
    // the db:push script passes it in with Node's --env-file.
    url: process.env.DATABASE_URL ?? "",
  },
});

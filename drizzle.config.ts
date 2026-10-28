import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads this to turn src/db/schema.ts into real tables.
 *
 * `npm run db:push` compares the schema with the database and applies the
 * difference. Fine while there is one table and no data worth migrating
 * carefully; switch to generated migrations (`drizzle-kit generate`) once
 * Phase 2 adds tables that hold things people wrote.
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

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * The database, or null when none is configured.
 *
 * Null is a supported state, not an error: a fresh clone, a preview without
 * the integration, or a local run without .env.local should still build and
 * render, just without visit data. Every caller handles null, so the site
 * degrades to "no dots on the map" instead of failing to build.
 *
 * The HTTP driver rather than a pooled TCP connection: each query is one
 * HTTPS request, which suits serverless functions that start cold and live
 * for a single request. Nothing has to be kept open between them.
 */
const url = process.env.DATABASE_URL;

export const db = url ? drizzle(neon(url), { schema }) : null;

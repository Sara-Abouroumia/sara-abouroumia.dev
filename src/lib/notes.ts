import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { CATEGORY_IDS } from "@/lib/notes-common";

/**
 * The notes index: everything about a note except its body.
 *
 * Read straight off the filesystem with gray-matter rather than by importing
 * the MDX modules. The listing page, the RSS feed and the sitemap all need
 * titles and dates for every note and the body of none of them, and importing
 * an .mdx file compiles it. This way the index costs a directory read.
 *
 * The body is a separate concern, loaded by the [slug] page through a dynamic
 * import so the bundler compiles exactly the one note being rendered.
 *
 * This section was called Research until 2026-10. It was renamed because the
 * name promised original work (papers, results) where the content is study
 * notes and summaries; "Research" is kept in reserve for real publications.
 * next.config.ts redirects the old /research URLs here.
 */

const DIR = path.join(process.cwd(), "src", "content", "notes");

/**
 * What the section is, said once. The page's meta description, its visible
 * intro, and the RSS channel all read this.
 */
export const NOTES_DESCRIPTION =
  "Lecture notes, paper summaries, and things worth writing down, for my future self and anyone studying the same ground.";

// The path helpers and category list live in notes-common.ts so the browser
// can use them too; re-exported here so server code has one place to import
// from.
export {
  CATEGORIES,
  type CategoryId,
  categoryLabel,
  NOTES_PATH,
  noteHref,
} from "@/lib/notes-common";

/** Average adult reading speed for prose on a screen, rounded to something honest. */
const WORDS_PER_MINUTE = 200;

/**
 * Frontmatter, validated rather than trusted.
 *
 * A typo in a YAML key is silent: `sumary:` just means `summary` is undefined,
 * and the note ships with a blank description in the feed, the card and the
 * meta tag. Parsing here turns that into a build failure naming the file.
 */
const Frontmatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(CATEGORY_IDS),
  /**
   * Accepts a Date because YAML does. `date: 2026-09-23` unquoted is parsed
   * into a JS Date by the YAML spec, while `date: "2026-09-23"` stays a
   * string, and an author should not have to know which they wrote.
   */
  date: z.union([z.string(), z.date()]).transform(toIsoDay),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type Note = z.infer<typeof Frontmatter> & {
  slug: string;
  readingMinutes: number;
};

function toIsoDay(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error(`Expected a YYYY-MM-DD date, got "${value}"`);
  return value;
}

/**
 * Minutes to read, from the prose only.
 *
 * Code, JSX and import lines are stripped before counting. A fenced block of
 * thirty lines of Python is not thirty lines of reading, and leaving it in
 * makes a short note with one long snippet claim eight minutes. Link syntax
 * keeps its visible text and drops the URL, for the same reason.
 *
 * Rounded up to a floor of one, because "0 min read" is not a thing.
 */
function readingMinutes(body: string): number {
  const prose = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^\s*(?:import|export)\s.*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ");

  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Drafts are visible everywhere except production.
 *
 * VERCEL_ENV is "production" only on the production deployment; it is
 * "preview" on a branch deploy and undefined locally. So a draft is readable
 * on a preview URL and on localhost, and invisible on the public site, which
 * is the owner-only draft view from the plan without building one.
 */
const SHOW_DRAFTS = process.env.VERCEL_ENV !== "production";

/** All notes, newest first, drafts included only where they should be. */
export function getNotes(): Note[] {
  if (!fs.existsSync(DIR)) return [];

  return fs
    .readdirSync(DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      const parsed = Frontmatter.safeParse(data);

      if (!parsed.success) {
        // Naming the file matters: the stack trace of a failed build points at
        // this module, which is not where the mistake is.
        throw new Error(
          `Invalid frontmatter in src/content/notes/${file}:\n${z.prettifyError(parsed.error)}`,
        );
      }

      return {
        ...parsed.data,
        slug: file.replace(/\.mdx$/, ""),
        readingMinutes: readingMinutes(content),
      };
    })
    .filter((note) => SHOW_DRAFTS || !note.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** One note's metadata, or undefined when the slug does not resolve. */
export function getNote(slug: string): Note | undefined {
  return getNotes().find((note) => note.slug === slug);
}

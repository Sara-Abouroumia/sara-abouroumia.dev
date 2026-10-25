/**
 * The parts of the notes model that the browser needs as well as the server:
 * the section's URL and the category list.
 *
 * A module of its own, apart from notes.ts, because the filter on the listing
 * is a Client Component. notes.ts reads the filesystem with node:fs, which
 * cannot be bundled for the browser, so anything both sides use has to live
 * somewhere that imports nothing from Node.
 */

/** The section's URL, so routes, cards, feed and sitemap cannot disagree. */
export const NOTES_PATH = "/notes";

/** Typed as a path, which is what pageMetadata() and <Link> both expect. */
export const noteHref = (slug: string): `/${string}` => `${NOTES_PATH}/${slug}`;

/**
 * What kind of note it is. Exactly one per note, from a fixed list: a closed
 * set is what makes the filter chips on the listing trustworthy (a free-text
 * field would split "Paper notes" from "paper-notes" from "Papers"), and the
 * frontmatter schema in notes.ts fails the build on anything not in it.
 *
 * Topics ("intrusion detection", "transformers") are what `tags` are for, and
 * those stay free-form.
 */
export const CATEGORIES = [
  { id: "lecture", label: "Lecture notes" },
  { id: "study", label: "Study notes" },
  { id: "paper", label: "Paper notes" },
  { id: "finding", label: "Findings" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [
  CategoryId,
  ...CategoryId[],
];

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

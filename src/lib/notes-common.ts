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

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const BIB_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** What a citation needs to know about a note. A subset of Note, so the browser can build one. */
export type Citable = { slug: string; title: string; date: string };

/**
 * Ready-to-paste citations for a note, in the two formats people actually
 * paste: APA for prose, BibTeX for LaTeX.
 *
 * APA 7 for a web page is Author. (Date). Title. Site. URL, and the site name
 * is left out when it is the author, as it is here. BibTeX has no entry type
 * for a web page, so @misc with the URL in howpublished, which is what most
 * style files expect. The title is double-braced so BibTeX keeps its capitals
 * instead of lowercasing them to the style's taste.
 */
export function citations(
  note: Citable,
  author: { name: string; url: string },
) {
  const [year, month, day] = note.date.split("-").map(Number);
  const parts = author.name.trim().split(/\s+/);
  const family = parts.at(-1) ?? author.name;
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0]}.`)
    .join(" ");
  const url = `${author.url}${noteHref(note.slug)}`;
  const firstWord =
    note.title
      .toLowerCase()
      .match(/[a-z0-9]+/)?.[0]
      ?.slice(0, 12) ?? "note";

  const apa = `${family}, ${initials} (${year}, ${LONG_MONTHS[month - 1]} ${day}). ${note.title}. ${url}`;
  const bibtex = [
    `@misc{${family.toLowerCase()}${year}${firstWord},`,
    `  author       = {${family}, ${parts.slice(0, -1).join(" ")}},`,
    `  title        = {{${note.title}}},`,
    `  year         = {${year}},`,
    `  month        = ${BIB_MONTHS[month - 1]},`,
    // \\ is one literal backslash. A lone \u would start a unicode escape.
    `  howpublished = {\\url{${url}}}`,
    "}",
  ].join("\n");
  return { apa, bibtex, url };
}

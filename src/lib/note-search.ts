/**
 * Search and topic logic for the Notes index, as pure functions: text in,
 * answers out, no React and no DOM. The component in notes-browser.tsx only
 * wires these to state, so the part that is easy to get subtly wrong
 * (matching and highlighting across accents) can be read and tested alone.
 */

/**
 * One character, folded for matching: lower-cased, then stripped of
 * diacritics. So "İTÜ" matches "itu", "Türkiye" matches "turkiye", and
 * "café" matches "cafe".
 *
 * Lower-case first, then strip: "İ" (capital I with dot) lower-cases to "i"
 * plus a combining dot above, and removing combining marks (\p{M}) after
 * NFD decomposition leaves a plain "i". In the other order the dot would
 * survive. A folded character can be longer than the original, which is why
 * highlightRanges() keeps a map back to the source text.
 */
function foldChar(ch: string): string {
  return ch.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function fold(text: string): string {
  return Array.from(text, foldChar).join("");
}

/** The search box's words, folded. Empty input means no terms. */
export function tokenize(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

/**
 * Whether every term appears somewhere in the given fields. AND, not OR:
 * typing a second word should narrow the results, which is what a search
 * box is expected to do.
 */
export function matchesTerms(fields: string[], terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = fold(fields.join("\n"));
  return terms.every((term) => haystack.includes(term));
}

/**
 * Where the terms occur in `text`, as [start, end) ranges in the ORIGINAL
 * string, merged where they overlap or touch.
 *
 * Matching happens on the folded text, but the highlight has to be drawn on
 * the text as written, accents and all, and folding can change lengths ("İ"
 * becomes "i", one UTF-16 unit for one, but a ligature or an emoji would not
 * be). So the folded string is built one source character at a time, and
 * every folded position remembers which source character it came from.
 */
export function highlightRanges(
  text: string,
  terms: string[],
): [number, number][] {
  if (terms.length === 0) return [];

  let folded = "";
  const startOf: number[] = [];
  const endOf: number[] = [];
  let offset = 0;
  for (const ch of text) {
    const f = foldChar(ch);
    for (let k = 0; k < f.length; k++) {
      startOf.push(offset);
      endOf.push(offset + ch.length);
    }
    folded += f;
    offset += ch.length;
  }

  const found: [number, number][] = [];
  for (const term of terms) {
    for (
      let at = folded.indexOf(term);
      at !== -1;
      at = folded.indexOf(term, at + 1)
    ) {
      found.push([startOf[at], endOf[at + term.length - 1]]);
    }
  }

  found.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of found) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}

export type TopicCount = { tag: string; count: number };

/**
 * Every tag used by the given notes, with how many notes carry it: most used
 * first, then alphabetical so the order is stable between builds.
 *
 * Built from whatever notes it is handed, which in production is published
 * notes only (getNotes() drops drafts there), so an unpublished draft never
 * puts a topic in the filter that leads nowhere.
 */
export function countTopics(notes: { tags: string[] }[]): TopicCount[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of new Set(note.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

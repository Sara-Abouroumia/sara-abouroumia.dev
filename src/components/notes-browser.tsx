"use client";

import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { EmptyState } from "@/components/empty-state";
import { site } from "@/content/site";
import { formatDay } from "@/lib/dates";
import {
  countTopics,
  fold,
  highlightRanges,
  matchesTerms,
  tokenize,
} from "@/lib/note-search";
// Type-only: erased at build time, so node:fs in notes.ts never reaches the
// browser bundle.
import type { Note } from "@/lib/notes";
import {
  CATEGORIES,
  type CategoryId,
  categoryLabel,
  citations,
  noteHref,
} from "@/lib/notes-common";

type Kind = CategoryId | "all";

/** Below this many notes a search box is furniture, not a tool. */
const SEARCH_FROM = 3;
/** Above this many topics the menu grows its own "find a topic" field. */
const TOPIC_FIND_FROM = 8;
/**
 * Notes shown before "Show more", and how many each press adds. Ten rows is
 * about three screens: enough to browse without the page becoming a wall.
 * Fewer means pressing the button constantly; many more and it may as well
 * not be there.
 */
const PAGE_SIZE = 10;

/**
 * The notes index: a reading list of rows, narrowed by three filters.
 *
 *   Kind    one category at a time (a note has exactly one).
 *   Topics  any number of tags, OR'd: picking "math" and "statistics" shows
 *           notes with either, which is what choosing more within one facet
 *           is expected to do.
 *   Search  every word must appear in the title or summary (AND), so a
 *           second word narrows.
 *
 * The three combine with AND: the standard faceted-search model.
 *
 * Layout is the one issue trackers and content sites converged on (GitHub's
 * issue list, Linear, the Vercel blog), because it keeps the controls out of
 * the content's way:
 *
 *   tabs      Kind. Exactly-one-of reads as switching VIEWS, which is what
 *             tabs mean; chips for it looked like the multi-select beside
 *             them, so people had to guess which was which.
 *   toolbar   Search and a Topics menu on ONE row. Multi-select lives in a
 *             menu of checkboxes, the universal "pick several" control, so
 *             the topic list can grow to fifty without pushing a single card
 *             down the page.
 *   applied   The chosen topics as removable chips, only while any are on:
 *             what is filtering the list, undoable one click at a time.
 *
 * And the tags on each card are themselves filters: click "math" on a card
 * to see every math note, which is how people actually find related reading.
 *
 * All of it runs here in the browser rather than on the server: reading
 * searchParams server-side would make the page render per request, and every
 * route on this site is prerendered (the CSP in next.config.ts leans on
 * that). The state is mirrored into the query string, so any filtered view
 * can be shared and survives a reload. Every card is in the HTML whatever the
 * filters say, so search engines and no-JS readers get the full index.
 */
export function NotesBrowser({ notes }: { notes: Note[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [topics, setTopics] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  /**
   * Whether the URL has been read yet. State, not a ref, and that matters: a
   * ref flips the instant it is set, so the write effect below, running in
   * the same commit, would see "restored" while the restored values were still
   * on their way to the next render, and write an empty URL over the shared
   * one. (React's Strict Mode then re-runs the restore against that wiped URL
   * in development, which is how this showed up.) As state, it turns true on
   * the same render as the restored values themselves.
   */
  const [ready, setReady] = useState(false);
  /** How many matching notes are on screen; see PAGE_SIZE. */
  const [limit, setLimit] = useState(PAGE_SIZE);
  /** Index of the first card a "Show more" press revealed, to focus it. */
  const [revealedFrom, setRevealedFrom] = useState<number | null>(null);

  const terms = useMemo(() => tokenize(query), [query]);
  const kinds = CATEGORIES.filter((c) =>
    notes.some((n) => n.category === c.id),
  );
  const topicCounts = useMemo(() => countTopics(notes), [notes]);

  // Restore filters from a shared URL. In an effect, not during render: the
  // server rendered without a query string, so reading it during render
  // would produce HTML that disagrees with the server's.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const k = params.get("kind");
    if (CATEGORIES.some((c) => c.id === k)) setKind(k as CategoryId);
    const known = new Set(topicCounts.map((t) => t.tag));
    setTopics(params.getAll("topic").filter((t) => known.has(t)));
    setQuery(params.get("q") ?? "");
    setReady(true);
  }, [topicCounts]);

  // Mirror the filters into the URL. replaceState rather than pushState: a
  // history entry per keystroke would make Back undo typing instead of
  // leaving the page.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (kind !== "all") params.set("kind", kind);
    for (const t of topics) params.append("topic", t);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [ready, query, kind, topics]);

  // "/" jumps to the search box, the convention GitHub, YouTube and most
  // docs sites share. Ignored while typing somewhere else, so a slash in a
  // field is still a slash.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      if (!searchRef.current) return;
      e.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = notes.filter(
    (n) =>
      (kind === "all" || n.category === kind) &&
      (topics.length === 0 || n.tags.some((t) => topics.includes(t))) &&
      matchesTerms([n.title, n.summary], terms),
  );

  const active = kind !== "all" || topics.length > 0 || terms.length > 0;

  /**
   * "Show more" rather than numbered pages or infinite scroll. Pages would
   * split the filters (search and topics cover every note, and "page 2 of
   * Paper notes" is a confusing place to be); infinite scroll would put the
   * footer out of reach and lose the reader's place. The cut applies AFTER
   * filtering, so a search always starts from its own first twelve.
   */
  const visible = shown.slice(0, limit);
  const remaining = shown.length - visible.length;

  // Notes arrive newest first, so years come out in order without a sort.
  const years = useMemo(() => {
    const groups: { year: string; notes: Note[] }[] = [];
    for (const note of notes) {
      const year = note.date.slice(0, 4);
      if (groups.at(-1)?.year !== year) groups.push({ year, notes: [] });
      groups.at(-1)?.notes.push(note);
    }
    return groups;
  }, [notes]);
  const grouped = years.length > 1;
  const firstYear = visible[0]?.date.slice(0, 4);

  // Any change to what is being asked for starts the list over at one page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the filters are the trigger, not values read inside
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [kind, topics, query]);

  // After "Show more", move focus to the first card it revealed. Otherwise a
  // keyboard or screen-reader user stays on a button that has just moved
  // below the new cards, with no cue that anything appeared above it.
  useEffect(() => {
    if (revealedFrom === null) return;
    const note = shown[revealedFrom];
    if (note) {
      document
        .querySelector<HTMLAnchorElement>(`[data-note="${note.slug}"] a[href]`)
        ?.focus();
    }
    setRevealedFrom(null);
  }, [revealedFrom, shown]);

  // Each tool appears only once it has something to do (one kind, or one
  // topic, filters nothing), and when none does, none of their spacing is
  // left behind: an index of one or two notes is just the cards.
  const showSearch = notes.length >= SEARCH_FROM;
  const showKinds = kinds.length > 1;
  const showTopics = topicCounts.length > 1;
  const hasFilters = showSearch || showKinds || showTopics;

  const clearAll = () => {
    setKind("all");
    setTopics([]);
    setQuery("");
  };
  const toggleTopic = (tag: string) =>
    setTopics((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  return (
    <div>
      {showKinds ? (
        <KindTabs
          kinds={kinds.map((c) => ({
            id: c.id,
            label: c.label,
            count: notes.filter((n) => n.category === c.id).length,
          }))}
          total={notes.length}
          value={kind}
          onChange={setKind}
        />
      ) : null}

      {showSearch || showTopics ? (
        <div className="mb-4 flex items-stretch gap-2.5">
          {showSearch ? (
            // The <search> element, not role="search": a native element
            // carries its meaning without ARIA, which is the first rule of
            // using ARIA at all.
            <search className="relative block min-w-0 flex-1">
              <label htmlFor={searchId} className="sr-only">
                Search notes
              </label>
              <SearchIcon />
              {/* type="search" for the right keyboard on phones and for
                  screen readers; the browser's own clear button is hidden
                  because there is a styled one below. */}
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Search notes"
                aria-keyshortcuts="/"
                autoComplete="off"
                spellCheck={false}
                className="peer h-11 w-full rounded-[3px] border border-field-border bg-input-bg pr-10 pl-10 text-[15px] text-text transition-colors placeholder:text-placeholder hover:border-muted-light focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus-ring [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[3px] text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <CloseIcon />
                </button>
              ) : (
                // The shortcut hint, where the clear button will be. Desktop
                // only (phones have no "/" key to press), and gone while the
                // field has focus, since by then it has done its job. Visual
                // only: screen readers learn the shortcut from the input's
                // aria-keyshortcuts, which is what that attribute is for.
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 peer-focus:hidden sm:block"
                >
                  <kbd className="rounded-[3px] border border-border bg-bg px-1.5 font-mono text-[11px] text-muted-light leading-[18px]">
                    /
                  </kbd>
                </span>
              )}
            </search>
          ) : null}

          {showTopics ? (
            <TopicsMenu
              counts={topicCounts}
              selected={topics}
              onToggle={toggleTopic}
              onClear={() => setTopics([])}
            />
          ) : null}
        </div>
      ) : null}

      {/* Screen readers hear the result count change through this live
          region. It is always in the page, because a live region added at
          the moment it has something to say is often missed, and it is
          visually hidden, so it costs no space while nothing is filtered. */}
      {hasFilters ? (
        <p aria-live="polite" className="sr-only">
          {active
            ? `${shown.length} of ${notes.length} ${notes.length === 1 ? "note" : "notes"}`
            : ""}
        </p>
      ) : null}

      {/* The applied-filters line: chosen topics as removable chips, then
          the count and a way out. Rendered only while something is applied,
          so an unfiltered index has no empty band above its first card. */}
      {active ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-muted">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTopic(t)}
              aria-label={`Remove topic ${t}`}
              // Neutral at rest: these say what is on, and the accent is kept
              // for the one thing they invite, removing them, so it appears
              // on hover (the × first, where the action is).
              className="group/chip inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-panel pr-2 pl-3 text-[13px] text-text-soft transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {t}
              <span className="text-muted transition-colors group-hover/chip:text-accent">
                <CloseIcon size={11} />
              </span>
            </button>
          ))}
          {topics.length ? (
            <span aria-hidden="true" className="text-border">
              |
            </span>
          ) : null}
          {/* aria-hidden: the live region above already says this. */}
          <span aria-hidden="true">
            {shown.length} of {notes.length}{" "}
            {notes.length === 1 ? "note" : "notes"}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-accent underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <EmptyState>
          <p className="text-[15px] text-text-soft">
            No notes match
            {terms.length ? ` "${query.trim()}"` : " these filters"}.
          </p>
          <p className="mt-1.5">
            Try fewer words, or{" "}
            <button
              type="button"
              onClick={clearAll}
              className="text-accent underline hover:text-accent-hover"
            >
              clear all filters
            </button>
            .
          </p>
        </EmptyState>
      ) : null}

      {/* Grouped by year, the way a publication list on a CV is: it shows
          the writing as a record kept over time, and gives a long list
          landmarks to scan by. Only once there is more than one year, since
          a lone "2026" over everything labels nothing.

          Each group is a list, because it is one: screen readers announce
          "list, 6 items". Hidden rows stay in the DOM (see the top of this
          file), and a group with none showing hides whole, heading and all. */}
      {years.map(({ year, notes: inYear }) => (
        <section
          key={year}
          aria-labelledby={grouped ? `notes-${year}` : undefined}
          hidden={!inYear.some((n) => visible.includes(n))}
        >
          {grouped ? (
            // The first group on screen sits close under the toolbar; later
            // ones get room above, which is what makes the year a break.
            // Worked out here, not with :first-child, because a filtered-out
            // group is still in the DOM and would count as first.
            <h2
              id={`notes-${year}`}
              className={`m-0 flex items-center gap-3 font-mono text-[12px] text-muted-light tracking-[0.08em] ${
                year === firstYear ? "mt-2" : "mt-10"
              }`}
            >
              {year}
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </h2>
          ) : null}
          <ul className="m-0 list-none p-0">
            {inYear.map((note) => (
              <li
                key={note.slug}
                data-note={note.slug}
                hidden={!visible.includes(note)}
                // A hairline between rows, not boxes around them: boxes read
                // as products on a shelf, rules read as entries in a list.
                className="border-border border-b last:border-b-0"
              >
                <NoteRow
                  note={note}
                  terms={terms}
                  topics={topics}
                  onTopic={showTopics ? toggleTopic : undefined}
                  heading={grouped ? "h3" : "h2"}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {remaining > 0 ? (
        <div className="mt-8 flex justify-center">
          {/* The count says how much is left before the reader commits to
              more scrolling; the button never promises more than it adds. */}
          <button
            type="button"
            onClick={() => {
              setRevealedFrom(limit);
              setLimit((l) => l + PAGE_SIZE);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-border px-5 text-[14px] text-text-soft transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Show {Math.min(PAGE_SIZE, remaining)} more{" "}
            <span className="text-muted-light">({remaining} remaining)</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Kind, as an underlined tab row. Buttons with aria-pressed rather than an
 * ARIA tablist: a tablist promises separate panels to arrow between, and this
 * filters one list. In a <fieldset> so a screen reader hears the row's name
 * on entering it.
 *
 * Scrolls sideways on a narrow phone instead of wrapping: a second row of
 * tabs reads as a second, different control.
 */
function KindTabs({
  kinds,
  total,
  value,
  onChange,
}: {
  kinds: { id: CategoryId; label: string; count: number }[];
  total: number;
  value: Kind;
  onChange: (next: Kind) => void;
}) {
  const tabs = [{ id: "all" as const, label: "All", count: total }, ...kinds];
  return (
    <fieldset className="m-0 mb-5 min-w-0 border-0 p-0">
      <legend className="sr-only">Kind of note</legend>
      <div className="flex gap-6 overflow-x-auto border-border border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const on = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(t.id)}
              // The underline sits on the row's own bottom border (-mb-px),
              // so the active tab looks cut out of it rather than floating.
              // No side padding: the first tab starts flush with the column,
              // like the search box under it, and each underline is exactly
              // its label's width. The focus ring is drawn inset, because the
              // row scrolls sideways and would clip one drawn outside.
              className={`relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pt-1 pb-3 text-[15px] transition-colors focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${
                on
                  ? "border-accent font-medium text-text"
                  : "border-transparent text-muted hover:border-muted-light hover:text-text-soft"
              }`}
            >
              {t.label}
              <span
                className={`text-[12px] ${on ? "text-accent" : "text-muted-light"}`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The Topics menu: a button that opens a checkbox list. Radix Popover does
 * the parts hand-built menus usually get wrong: focus moves in on open and
 * back to the button on close, Esc and an outside click close it, and it
 * repositions to stay on screen at a phone's width.
 *
 * Checkboxes apply as they are ticked, with no Apply button: the cards update
 * behind the menu, so the result of each choice is visible as it is made.
 */
function TopicsMenu({
  counts,
  selected,
  onToggle,
  onClear,
}: {
  counts: { tag: string; count: number }[];
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  const [find, setFind] = useState("");
  const listId = useId();
  const visible = find
    ? counts.filter((c) => fold(c.tag).includes(fold(find.trim())))
    : counts;

  return (
    <Popover.Root onOpenChange={(open) => !open && setFind("")}>
      {/* One accent signal, not four. With topics on, the button itself stays
          neutral and only the count badge turns accent: the badge already
          says "2 topics are on", and an accent fill, edge and text on top of
          it made the toolbar shout while saying nothing more. */}
      <Popover.Trigger
        className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[3px] border px-3.5 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 data-[state=open]:border-accent ${
          selected.length
            ? "border-muted-light bg-bg text-text"
            : "border-field-border bg-bg text-text-soft hover:border-muted-light"
        }`}
      >
        <FilterIcon />
        Topics
        {selected.length ? (
          <span className="rounded-full bg-accent px-1.5 font-semibold text-[11px] text-accent-fg leading-[18px]">
            {selected.length}
          </span>
        ) : null}
        <ChevronIcon />
      </Popover.Trigger>

      <Popover.Portal>
        {/* z-30: above the sticky header (z-10) and section bar. */}
        <Popover.Content
          align="end"
          sideOffset={6}
          collisionPadding={16}
          className="z-30 w-[min(18rem,calc(100vw-2rem))] rounded-[5px] border border-border bg-bg p-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)] focus:outline-none"
        >
          {counts.length > TOPIC_FIND_FROM ? (
            <input
              type="text"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Find a topic"
              aria-label="Find a topic"
              aria-controls={listId}
              autoComplete="off"
              className="mb-1 h-9 w-full rounded-[3px] border border-field-border bg-input-bg px-2.5 text-[14px] text-text placeholder:text-placeholder focus-visible:border-accent focus-visible:outline-none"
            />
          ) : null}

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">Topics</legend>
            <ul
              id={listId}
              className="m-0 max-h-72 list-none overflow-y-auto p-0"
            >
              {visible.map(({ tag, count }) => (
                <li key={tag}>
                  {/* The whole row is the label, so the click target is the
                      row, not a 16px box. */}
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[14px] text-text-soft transition-colors hover:bg-panel has-checked:text-text">
                    <input
                      type="checkbox"
                      checked={selected.includes(tag)}
                      onChange={() => onToggle(tag)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-accent"
                    />
                    <span className="min-w-0 flex-1 truncate">{tag}</span>
                    <span className="text-[12px] text-muted-light">
                      {count}
                    </span>
                  </label>
                </li>
              ))}
              {visible.length === 0 ? (
                <li className="px-2.5 py-2 text-[13px] text-muted-light">
                  No topic matches "{find.trim()}".
                </li>
              ) : null}
            </ul>
          </fieldset>

          {selected.length ? (
            <div className="mt-1 border-border border-t px-1 pt-1.5">
              <button
                type="button"
                onClick={onClear}
                className="w-full rounded-[3px] px-1.5 py-1.5 text-left text-[13px] text-accent hover:bg-panel"
              >
                Clear topics
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Wraps each search match in <mark>. A real <mark> rather than a styled span:
 * it is the element HTML has for "relevant to what you searched", and some
 * screen readers announce it.
 */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const ranges = highlightRanges(text, terms);
  if (ranges.length === 0) return text;

  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      // box-decoration-break: clone gives a mark that wraps onto a second
      // line its rounded ends on both lines, instead of one long sliced bar.
      <mark
        key={start}
        className="rounded-[2px] bg-highlight text-inherit [box-decoration-break:clone]"
      >
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/**
 * One note, as a row in a reading list. Composed from three references, each
 * for the thing it does best:
 *
 *   Medium         one entry per row, hairline between, a thumbnail on the
 *                  right. A row reads top to bottom like a reference list,
 *                  where a grid of cards makes the eye zigzag.
 *   Google Scholar the source line under the title (authors, venue, year),
 *                  search terms marked inside the summary, and Cite.
 *   ResearchGate   the thumbnail is a figure from inside the note, not a
 *                  picked image, so it previews the actual content.
 *
 * And what was left out, on purpose: claps, read counts and avatars. Those are
 * social signals, and on a one-author site with modest numbers they say less
 * than nothing.
 *
 * The whole row is the click target, but only the title is a link. Its
 * ::after box is stretched over the row (the "stretched link" pattern), so a
 * click anywhere lands on the link, while a screen reader hears one link
 * named by the title rather than every word of the row read out as a link.
 * Focus is shown on the row (has-[a:focus-visible]). The tags and the two
 * actions are the exceptions, lifted above the stretched link (relative z-10)
 * so a click on one does its own thing instead of navigating.
 *
 * Layout is one grid whose cells move between breakpoints, rather than two
 * layouts. From sm, the text is a column and the thumbnail spans its height
 * on the right. On a phone the thumbnail shrinks to a square beside just the
 * meta line and title, and everything below runs the full width, which is
 * where a 390px screen needs the room.
 */
function NoteRow({
  note,
  terms,
  topics,
  onTopic,
  heading: Heading,
}: {
  note: Note;
  terms: string[];
  topics: string[];
  /** Absent while topic filtering is off, and then tags are plain labels. */
  onTopic?: (tag: string) => void;
  /** h3 under a year heading, h2 when there is none, so the outline has no gap. */
  heading: "h2" | "h3";
}) {
  const thumb = note.thumbnail;
  // Without a thumbnail, the text simply takes the full width. No placeholder:
  // a mix of rows with and without figures reads as deliberate, a generic
  // stand-in image reads as unfinished.
  const below = thumb
    ? "col-span-2 sm:col-span-1 sm:col-start-1"
    : "col-span-2";
  const source = note.source;

  return (
    <article
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto] py-6 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-accent has-[a:focus-visible]:outline-offset-2 ${
        thumb ? "gap-x-4 sm:gap-x-8" : ""
      }`}
    >
      {/* Kind first, as a label, then when and how long: what sort of read
          this is before what it is about. */}
      <p className="col-start-1 m-0 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
        <span className="font-sans font-semibold text-accent tracking-[0.12em]">
          {categoryLabel(note.category)}
        </span>
        <span aria-hidden="true">·</span>
        <time dateTime={note.date}>{formatDay(note.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{note.readingMinutes} min read</span>
        {note.draft ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-error-text">Draft</span>
          </>
        ) : null}
      </p>

      <Heading className="col-start-1 m-0 mt-2 font-serif font-semibold text-[19px] text-text leading-snug transition-colors group-hover:text-accent sm:text-[21px]">
        <Link
          href={noteHref(note.slug)}
          className="text-inherit no-underline outline-none after:absolute after:inset-0 after:content-['']"
        >
          <Highlight text={note.title} terms={terms} />
        </Link>
      </Heading>

      {/* The Scholar line. The venue is italic, as a journal or proceedings
          name is in a reference. */}
      {source ? (
        <p className={`${below} m-0 mt-1.5 text-[13px] text-muted`}>
          {source.authors}
          {source.venue || source.year ? (
            <>
              <span aria-hidden="true"> · </span>
              {source.venue ? <em>{source.venue}</em> : null}
              {source.venue && source.year ? " " : null}
              {source.year}
            </>
          ) : null}
        </p>
      ) : null}

      {/* Two lines when browsing, as Medium does: enough to say what the note
          covers without each row becoming a paragraph. Unclamped while
          searching, so a match further in is not hidden behind the ellipsis
          the reader is looking for it under. */}
      <p
        className={`${below} m-0 mt-2 text-[15px] text-text-soft leading-[1.6] ${
          terms.length ? "" : "line-clamp-2"
        }`}
      >
        <Highlight text={note.summary} terms={terms} />
      </p>

      {note.tags.length ? (
        <ul
          className={`${below} m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0`}
        >
          {/* A selected topic is shown first and in accent, so it is clear
              why this row is in the results. */}
          {[...note.tags]
            .sort(
              (a, b) => Number(topics.includes(b)) - Number(topics.includes(a)),
            )
            .slice(0, 3)
            .map((tag) => {
              const on = topics.includes(tag);
              const look = `rounded-[3px] bg-panel px-2 py-0.5 text-[12px] ${
                on ? "font-medium text-accent" : "text-muted"
              }`;
              return (
                <li key={tag}>
                  {onTopic ? (
                    <button
                      type="button"
                      onClick={() => onTopic(tag)}
                      aria-pressed={on}
                      title={on ? `Remove ${tag}` : `Show all ${tag} notes`}
                      className={`${look} relative z-10 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent`}
                    >
                      {tag}
                    </button>
                  ) : (
                    <span className={look}>{tag}</span>
                  )}
                </li>
              );
            })}
        </ul>
      ) : null}

      {/* Always the full width, even beside a figure, so "Read" lands at the
          same right edge on every row. Ending under the text instead made it
          zigzag down the list between rows with and without one. */}
      <div className="col-span-2 mt-3 flex items-center gap-1">
        <CiteMenu note={note} />
        <CopyLink note={note} />
        {/* The "dive deeper" cue. Decorative: the link is the title. */}
        <span
          aria-hidden="true"
          className="ml-auto shrink-0 font-mono text-[11px] text-muted uppercase tracking-[0.06em] transition-[color,transform] group-hover:text-accent motion-safe:group-hover:translate-x-0.5"
        >
          Read &rarr;
        </span>
      </div>

      {thumb ? (
        // Decorative (alt=""): it previews a figure the title already
        // introduces, and the reader meets it with its caption in the note.
        // A hairline edge, because most figures are on white and would
        // otherwise bleed into a light page. object-cover with the top
        // anchored: a figure's title and top axis matter more than its foot.
        //
        // Placed with row-start and row-end, never row-span: Tailwind's
        // row-span is the grid-row SHORTHAND, which resets the start too, so
        // `row-start-1 sm:row-span-6` silently became "span 6 from wherever"
        // and the image dropped below the text. Lines 1 to 3 cover the meta
        // line and title on a phone; from sm, 1 to 6 covers every text row
        // above the actions, which run the full width beneath it.
        //
        // Dimmed a touch in dark mode, where a white figure on a dark page
        // glares, and back to full on hover, when it is being looked at.
        <Image
          src={thumb}
          alt=""
          width={320}
          height={214}
          sizes="(min-width: 640px) 160px, 72px"
          className="col-start-2 row-start-1 row-end-3 h-[72px] w-[72px] self-start rounded-[4px] border border-border bg-white object-cover object-top transition-[filter] duration-200 dark:brightness-[0.82] dark:group-hover:brightness-100 sm:row-end-6 sm:h-[107px] sm:w-[160px]"
        />
      ) : null}
    </article>
  );
}

/** Feedback for a copy action: true for a moment after it succeeds. */
function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard refused (an insecure context, a denied permission). Say
      // nothing rather than claim a copy that did not happen.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };
  return { copied, copy };
}

/** Shared look of the small row actions: quiet until pointed at. */
const ACTION =
  "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-[3px] px-2 text-[13px] text-muted transition-colors first:-ml-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent";

/**
 * Cite: APA and BibTeX for the note, each copied in one press. The one
 * feature from Scholar that is pure academic signal, and genuinely useful to
 * anyone who wants to reference the note. A popover rather than copying one
 * format outright, since which one a reader needs depends on what they are
 * writing in.
 */
function CiteMenu({ note }: { note: Note }) {
  const { apa, bibtex } = citations(note, site);
  return (
    <Popover.Root>
      <Popover.Trigger className={`${ACTION} data-[state=open]:text-text`}>
        <QuoteIcon />
        Cite
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="z-30 w-[min(26rem,calc(100vw-2rem))] rounded-[5px] border border-border bg-bg p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)] focus:outline-none"
        >
          <CiteFormat label="APA" text={apa} />
          <CiteFormat label="BibTeX" text={bibtex} mono />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CiteFormat({
  label,
  text,
  mono = false,
}: {
  label: string;
  text: string;
  mono?: boolean;
}) {
  const { copied, copy } = useCopied();
  return (
    <div className="[&+&]:mt-3 [&+&]:border-border [&+&]:border-t [&+&]:pt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-semibold text-[11px] text-muted uppercase tracking-[0.12em]">
          {label}
        </span>
        <button
          type="button"
          onClick={() => copy(text)}
          className="rounded-[3px] px-1.5 py-0.5 text-[12px] text-accent transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-accent"
        >
          {/* The live region makes "Copied" heard, not only seen. */}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      {/* Selectable as well as copyable, for anyone who wants only part.
          BibTeX scrolls sideways rather than wrapping: a soft wrap in code
          suggests a line break that is not there. */}
      <p
        className={`m-0 select-all rounded-[3px] bg-panel px-2.5 py-2 text-text-soft ${
          mono
            ? "overflow-x-auto whitespace-pre font-mono text-[11.5px] leading-[1.55]"
            : "whitespace-pre-wrap break-words text-[13px] leading-[1.55]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CopyLink({ note }: { note: Note }) {
  const { copied, copy } = useCopied();
  return (
    <button
      type="button"
      onClick={() => copy(`${site.url}${noteHref(note.slug)}`)}
      className={ACTION}
    >
      {copied ? <CheckIcon /> : <LinkIcon />}
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M3 9.5C3 7 4.4 5 6.6 4l.6 1C5.9 5.7 5.2 6.7 5.1 7.8 6 7.8 6.8 8.6 6.8 9.6S6 11.5 4.9 11.5C3.8 11.5 3 10.7 3 9.5Zm6 0C9 7 10.4 5 12.6 4l.6 1c-1.3.7-2 1.7-2.1 2.8.9 0 1.7.8 1.7 1.8s-.8 1.9-1.9 1.9C9.8 11.5 9 10.7 9 9.5Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="m16 16 4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted"
    >
      <path
        d="M6 9.5l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

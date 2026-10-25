"use client";

import * as Popover from "@radix-ui/react-popover";
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
  noteHref,
} from "@/lib/notes-common";

type Kind = CategoryId | "all";

/** Below this many notes a search box is furniture, not a tool. */
const SEARCH_FROM = 3;
/** Above this many topics the menu grows its own "find a topic" field. */
const TOPIC_FIND_FROM = 8;
/**
 * Notes shown before "Show more", and how many each press adds. Twelve is six
 * rows of two: about a screen and a half, enough to browse without the page
 * becoming a wall, and it divides evenly into rows of two or three. Fewer
 * means pressing the button constantly; many more and it may as well not be
 * there.
 */
const PAGE_SIZE = 12;

/**
 * The notes index: overview cards, narrowed by three filters.
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
        .querySelector<HTMLAnchorElement>(`[data-note="${note.slug}"] h2 a`)
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

      {/* A list, because it is one: screen readers announce "list, 6 items",
          the overview a sighted reader gets from the grid. Hidden cards stay
          in the DOM (see the top of this file). */}
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
        {notes.map((note) => (
          <li
            key={note.slug}
            data-note={note.slug}
            hidden={!visible.includes(note)}
          >
            <NoteCard
              note={note}
              terms={terms}
              topics={topics}
              onTopic={showTopics ? toggleTopic : undefined}
            />
          </li>
        ))}
      </ul>

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
 * One note, as an overview: what kind of note, what it is about, how long it
 * takes. The detail is one click away, so nothing here needs to be complete.
 *
 * The whole card is the click target, but only the title is a link. Its
 * ::after box is stretched over the card (the "stretched link" pattern), so a
 * click anywhere lands on the link, while a screen reader hears one link
 * named by the title rather than every word of the card read out as a link.
 * Focus is shown on the card (has-[a:focus-visible]) since the link itself is
 * only as big as the title.
 *
 * The tags are the exception to "the card is one link": they are buttons
 * that filter by that topic, lifted above the stretched link (relative z-10)
 * so a click on one filters instead of navigating.
 */
function NoteCard({
  note,
  terms,
  topics,
  onTopic,
}: {
  note: Note;
  terms: string[];
  topics: string[];
  /** Absent while topic filtering is off, and then tags are plain labels. */
  onTopic?: (tag: string) => void;
}) {
  return (
    <article className="group relative flex h-full flex-col rounded-[5px] border border-border bg-bg p-5 transition-[border-color,box-shadow,transform] duration-200 hover:border-accent/40 hover:shadow-[0_6px_24px_-12px_rgba(28,28,26,0.25)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-accent has-[a:focus-visible]:outline-offset-2 motion-safe:hover:-translate-y-0.5">
      <p className="m-0 mb-2 font-semibold text-[11px] text-accent uppercase tracking-[0.12em]">
        {categoryLabel(note.category)}
      </p>

      <h2 className="m-0 mb-2 font-serif font-semibold text-[19px] text-text leading-snug">
        <Link
          href={noteHref(note.slug)}
          className="text-inherit no-underline outline-none after:absolute after:inset-0 after:rounded-[5px] after:content-['']"
        >
          <Highlight text={note.title} terms={terms} />
        </Link>
      </h2>

      {/* Three lines when browsing: enough to say what the note covers,
          short enough that the cards stay an even grid. Unclamped while
          searching, so a match in the fourth line is not hidden behind the
          ellipsis the reader is looking for it under. */}
      <p
        className={`m-0 text-[15px] text-text-soft leading-[1.6] ${
          terms.length ? "" : "line-clamp-3"
        }`}
      >
        <Highlight text={note.summary} terms={terms} />
      </p>

      {note.tags.length ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {/* A selected topic is shown first and in accent, so it is clear
              why this card is in the results. */}
          {[...note.tags]
            .sort(
              (a, b) => Number(topics.includes(b)) - Number(topics.includes(a)),
            )
            .slice(0, 3)
            .map((tag) => {
              const on = topics.includes(tag);
              // A matching tag keeps the grey tag's ground and only its text
              // turns accent: one signal, enough to say why the card is here,
              // without a tinted block repeated on every card in the grid.
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

      {/* mt-auto pins the footer to the bottom, so cards with short and long
          summaries in the same row still line their dates up. */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
        <span className="flex flex-wrap items-center gap-x-2">
          <time dateTime={note.date}>{formatDay(note.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{note.readingMinutes} min read</span>
          {note.draft ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-error-text">Draft</span>
            </>
          ) : null}
        </span>
        {/* The "dive deeper" cue. Decorative: the link is the title. */}
        <span
          aria-hidden="true"
          className="shrink-0 text-muted transition-[color,transform] group-hover:text-accent motion-safe:group-hover:translate-x-0.5"
        >
          Read &rarr;
        </span>
      </div>
    </article>
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

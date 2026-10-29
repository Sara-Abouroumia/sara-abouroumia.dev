"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Which card is flipped, shared by the carousel and the cards inside it.
 * The cards are built on the server and handed in as children, so they
 * cannot be given the carousel's state as props; context reaches them
 * all the same, because they render underneath the provider.
 */
const Flip = createContext<{
  flipped: string | null;
  setFlipped: (id: string | null) => void;
}>({ flipped: null, setFlipped: () => {} });

/**
 * References side by side with one in focus: the focused card at full
 * strength, the others faded back, and a row of dots to move the focus.
 * Clicking a faded card brings it into focus too.
 *
 * A faded card is `inert`: its links and its flip button cannot be reached
 * by pointer or keyboard, so a click anywhere on it can only mean "show me
 * this one", and the button laid over it (the only focusable thing in it)
 * does exactly that. Once focused, it is a normal, fully usable card.
 *
 * Moving the focus also turns a flipped card back to its front, so a letter
 * is never left open behind the fade.
 *
 * The list is a row that scrolls sideways, snapping card by card. From md
 * both cards fit, so there is nothing to scroll and every card is visible,
 * the unfocused ones faded. On a phone one card fills the row (the next
 * peeks in at the edge, to say there is more), and swiping moves the focus:
 * once a scroll has settled, the card filling most of the row is the
 * focused one. The dots and a click on a faded card scroll the row to
 * their card. With more references than fit, the same row simply scrolls.
 *
 * The faded state is a data attribute on the <li> (data-faded), not a prop
 * passed down: the cards are built on the server, and CSS can read the
 * attribute from inside them (group-data-[faded]).
 */
export function FocusedCarousel({
  items,
}: {
  items: { key: string; name: string; node: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const settle = useRef(0);
  const current = useRef(active);

  useEffect(() => {
    current.current = active;
  }, [active]);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  // Focus a card and bring it into the row: the nearest edge vertically
  // (so a card already in view never makes the page jump), its start
  // horizontally (where the row snaps). Reduced motion jumps instead.
  const focus = (i: number) => {
    setActive(i);
    setFlipped(null);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    (list.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  // Scrolled by hand (a swipe, a trackpad, the wheel): once it has been
  // still for 120ms, the card showing most in the row takes the focus.
  // Waiting for stillness, not reacting to every frame, keeps the focus from
  // flickering across cards mid-swipe, and means a scroll the dots started
  // finishes first, then agrees with them.
  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const row = list.current;
      if (!row) return;
      const box = row.getBoundingClientRect();
      let best = current.current;
      let most = -1;
      Array.from(row.children).forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        if (seen > most) {
          most = seen;
          best = i;
        }
      });
      if (best !== current.current) {
        setActive(best);
        setFlipped(null);
      }
    }, 120);
  };

  return (
    <Flip.Provider value={{ flipped, setFlipped }}>
      {/* The row scrolls and snaps. overflow-x clips on both axes, and the
          cards' shadows reach about 30px out, so the row is padded out by
          as much as it is pulled back with negative margins: the cards do
          not move, only the clip edge does. 24px (px-6) is exactly the
          page's side gutter, so the row ends at the screen edge and never
          widens the page. scroll-px-6 makes snapping line a card up with
          the text column, not the screen edge; overscroll-x-contain stops
          a swipe past the end from going "back" a page. The scrollbar is
          hidden: the dots and the peeking card say there is more. */}
      <ul
        ref={list}
        onScroll={onScroll}
        className="-mx-6 -my-8 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-6 px-6 py-8 [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => {
          const focused = i === active;
          return (
            <li
              key={it.key}
              data-faded={focused ? undefined : ""}
              className={`group/ref relative flex shrink-0 basis-[88%] snap-start transition-opacity duration-300 md:basis-[calc(50%-1rem)] ${
                focused ? "" : "opacity-40"
              }`}
            >
              <div className="flex w-full" inert={!focused}>
                {it.node}
              </div>
              {focused ? null : (
                <button
                  type="button"
                  onClick={() => focus(i)}
                  aria-label={`Bring ${it.name}'s reference into focus`}
                  className="absolute inset-0 z-10 cursor-pointer rounded-[4px] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* The dots: 8px to look at, a 24px square to hit. */}
      {/* biome-ignore lint/a11y/useSemanticElements: a <fieldset> is for form controls, and these are not */}
      <div
        role="group"
        aria-label="Choose a reference"
        className="mt-8 flex justify-center gap-1"
      >
        {items.map((it, i) => (
          <button
            key={it.key}
            type="button"
            onClick={() => focus(i)}
            aria-label={`Show ${it.name}'s reference`}
            aria-current={i === active}
            className="group flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                i === active
                  ? "bg-accent"
                  : "bg-muted-light/50 group-hover:bg-muted-light"
              }`}
            />
          </button>
        ))}
      </div>
    </Flip.Provider>
  );
}

/**
 * How long a turned card waits, once attention has clearly left it (the
 * pointer is off it, focus is elsewhere), before it turns itself back. Long
 * enough that glancing away mid-sentence does not cost the reader their
 * place; the wait starts over each time they return.
 */
const AWAY_MS = 10_000;

/** A turned card turns back once less than this share of it is in view. */
const MIN_VISIBLE = 0.3;

/**
 * The sticky header and section bar cover this much of the top of the
 * viewport, so a card scrolled up behind them is already out of sight even
 * though it is still "in" the viewport. Counted as out of view.
 */
const TOP_COVER = 100;

/** The look both faces share: the card itself. A white card with a faint
 * wide shadow (5% black, 20px blur); in dark mode a shadow cannot be seen,
 * so the card is lifted by the --panel tint and a hairline instead.
 * backface-hidden: a face is invisible while turned away. */
const FACE =
  "rounded-[4px] border border-transparent bg-bg shadow-[0_4px_20px_7px_rgba(0,0,0,0.05)] backface-hidden dark:border-border dark:bg-panel dark:shadow-none";

/**
 * A card with two faces. The front is the quote and who said it, with a
 * button that turns the card over; the back is the whole recommendation,
 * in its own scroll area, with a button to turn it back.
 *
 * The front sets the card's size (it is the one in the flow); the back is
 * laid exactly over it (absolute inset-0), so turning the card never
 * changes its height, however long the letter is. A long letter scrolls
 * inside the back instead, and a soft fade at the bottom hints there is
 * more below.
 *
 * Whichever face is turned away is `inert`, so it cannot be tabbed into,
 * clicked or read by a screen reader. Focus follows the turn: onto the
 * letter (which can then be scrolled with the arrow keys) when it opens,
 * and back onto the button that opened it when it closes. Escape also
 * closes it. With reduced motion the card turns instantly.
 *
 * A turned card does not stay turned for ever. It turns itself back, with
 * the same animation, when either:
 *   - attention has been elsewhere for AWAY_MS: the mouse is off the card,
 *     or a click or tap landed outside it, or focus moved out; coming back
 *     (hover, touch, focus, scrolling the letter) cancels the wait; or
 *   - it is scrolled mostly out of view (less than MIN_VISIBLE of it left),
 *     so the card that waits for you when you scroll back is the quote,
 *     and the turn is still partly visible as it leaves.
 * Touch has no "pointer left the card", so a finger lifting does not count
 * as leaving; only a touch somewhere else does.
 */
export function FlipCard({
  id,
  name,
  head,
  body,
  backHead,
  back,
}: {
  /** Matches this card to the carousel's flipped state. */
  id: string;
  name: string;
  /** The front's <figcaption> across the top: photo and who they are. */
  head: ReactNode;
  /** The front's quote, centred in the room between head and button. */
  body: ReactNode;
  /** The back's heading: who they are and where they worked with Sara. */
  backHead: ReactNode;
  /** The letter. */
  back: ReactNode;
}) {
  const { flipped: flippedId, setFlipped } = useContext(Flip);
  const flipped = flippedId === id;
  const toggle = useRef<HTMLButtonElement>(null);
  const letter = useRef<HTMLElement>(null);
  const returnFocus = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const [mostlyOut, setMostlyOut] = useState(false);

  useEffect(() => {
    if (flipped) letter.current?.focus({ preventScroll: true });
    else if (returnFocus.current) {
      returnFocus.current = false;
      toggle.current?.focus({ preventScroll: true });
    }
  }, [flipped]);

  const close = () => {
    returnFocus.current = true;
    setFlipped(null);
  };

  // Attention elsewhere for long enough: turn back. Not through close():
  // that hands focus back to the button, which would pull the reader's
  // attention (and the page) to a card they have already left.
  useEffect(() => {
    if (!flipped || !away) return;
    const t = setTimeout(() => setFlipped(null), AWAY_MS);
    return () => clearTimeout(t);
  }, [flipped, away, setFlipped]);

  // A click or tap anywhere outside the card means attention has moved on.
  useEffect(() => {
    if (!flipped) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setAway(true);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [flipped]);

  // Scrolled mostly out of view: turn back at once.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setMostlyOut(e.intersectionRatio < MIN_VISIBLE),
      { threshold: [MIN_VISIBLE], rootMargin: `-${TOP_COVER}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (flipped && mostlyOut) setFlipped(null);
  }, [flipped, mostlyOut, setFlipped]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: these handlers only watch where attention is (to time the turn back); every control inside is a native button
    <div
      ref={root}
      className="h-full w-full perspective-[1400px]"
      onPointerEnter={() => setAway(false)}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") setAway(true);
      }}
      onPointerDown={() => setAway(false)}
      onFocus={() => setAway(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setAway(true);
      }}
    >
      <div
        className={`relative h-full transform-3d motion-safe:transition-transform motion-safe:duration-[650ms] motion-safe:ease-[cubic-bezier(.4,0,.2,1)] ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front. */}
        <figure
          inert={flipped}
          className={`${FACE} m-0 flex h-full min-h-[22rem] min-w-0 flex-col items-center px-8 pt-7 pb-7 text-center`}
        >
          {head}
          {/* The quote takes all the room between the head and the button
              (flex-1) and sits in the middle of it (justify-center), so a
              short quote is not stranded at the top. The button is last,
              at the card's foot, so in a row of equal-height cards both
              sit on one line. */}
          <div className="flex w-full flex-1 flex-col items-center justify-center py-6">
            {body}
          </div>
          <button
            ref={toggle}
            type="button"
            onClick={() => {
              setAway(false);
              setFlipped(id);
            }}
            aria-expanded={flipped}
            className="toggle-glow inline-flex cursor-pointer items-center gap-2 rounded-[3px] text-[14px] text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3.5l4.5 4.5L6 12.5" />
            </svg>
            Read the full recommendation
          </button>
        </figure>

        {/* Back: laid over the front, turned half way round, so it faces
            away until the card turns. Escape closes it from anywhere
            inside. */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Escape is a shortcut for the visible Back button; every real control inside is a native button */}
        <div
          inert={!flipped}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className={`${FACE} absolute inset-0 flex flex-col overflow-hidden rotate-y-180`}
        >
          <div className="flex items-start justify-between gap-3 border-border border-b px-5 py-4 md:px-6">
            {backHead}
            <button
              type="button"
              onClick={close}
              className="toggle-glow inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[3px] text-[14px] text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3.5L5.5 8l4.5 4.5" />
              </svg>
              Back
            </button>
          </div>

          {/* The scroll area. It is focusable so the keyboard can scroll it
              (a scrollable box nobody can reach without a mouse is a
              dead end). pb-12 lets the last line scroll clear of the fade. */}
          <section
            ref={letter}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be focusable for keyboard scrolling
            tabIndex={0}
            aria-label={`${name}'s full recommendation`}
            onScroll={() => setAway(false)}
            className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-12 text-left md:px-6 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            {back}
          </section>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-bg to-transparent dark:from-panel"
          />
        </div>
      </div>
    </div>
  );
}

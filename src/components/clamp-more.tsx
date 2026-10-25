"use client";

import {
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * Text cut off after N lines, with "… more" sitting at the end of the last
 * visible line: the pattern LinkedIn, YouTube and Instagram all use, and for
 * the same reasons.
 *
 *   - A sentence that stops mid-line already says "this continues"; a
 *     separate button under a complete-looking paragraph has to say it in
 *     words, and people skim past words.
 *   - It costs no extra row of height, collapsed or not.
 *   - It is muted until hovered, so it never competes with the text it
 *     belongs to. The text is the content; the control is a footnote to it.
 *
 * Clamped by LINES rather than by paragraphs or bullets, which is what makes
 * the cut land mid-sentence. CSS line-clamp cannot do this here: it truncates
 * one block of inline text, and this wraps several <p>s or <li>s. So the
 * component measures instead. Every rendered line of text has its own client
 * rect (Range.getClientRects returns one per line box), and the clip height
 * is wherever line N ends. That works across paragraphs, list items, and any
 * spacing between them, and it re-measures when the width changes, since a
 * resize rewraps everything.
 *
 * Everything stays in the DOM, so the full text is in the page source for
 * search engines and print, and a screen reader reads it all; the clip is
 * purely visual.
 */
export function ClampMore({
  lines,
  children,
  className = "",
}: {
  /** Lines shown while collapsed. */
  lines: number;
  children: ReactNode;
  /**
   * Typography belongs here, not only on the children: the "… more" inherits
   * its font from this element so it reads as part of the line it sits in,
   * and the pre-measurement fallback height is expressed in `lh` of it.
   */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const lessRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  /** Null until measured; then null again if the text fits and needs no clamp. */
  const [clamp, setClamp] = useState<Clamp | null | undefined>(undefined);
  const [fullHeight, setFullHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setClamp(measureClamp(el, lines));
      setFullHeight(el.scrollHeight);
    };
    measure();
    // Width changes rewrap the text; a late web font changes every line.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [lines]);

  const fits = clamp === null;
  const toggle = (next: boolean) => {
    setOpen(next);
    // The button that was clicked unmounts, which would drop focus to <body>.
    // Hand it to the opposite control instead, without scrolling the page.
    requestAnimationFrame(() =>
      (next ? lessRef : moreRef).current?.focus({ preventScroll: true }),
    );
  };

  // Before the first measurement (server render, first paint) the height is
  // approximated in lh units, so the collapsed block is roughly the right size
  // instead of fully open and then snapping shut.
  const maxHeight = fits
    ? undefined
    : open
      ? fullHeight
      : (clamp?.height ?? `${lines}lh`);

  return (
    <div className={className}>
      <div
        ref={ref}
        id={id}
        style={{ maxHeight }}
        className="relative overflow-hidden motion-safe:transition-[max-height] motion-safe:duration-300 motion-safe:ease-out"
      >
        {children}

        {!fits && !open ? (
          <button
            ref={moreRef}
            type="button"
            onClick={() => toggle(true)}
            aria-expanded={false}
            aria-controls={id}
            style={
              clamp ? { top: clamp.lastTop, height: clamp.lastHeight } : {}
            }
            // bottom-0 is the pre-measurement placement; once measured, the
            // inline top/height pin it to the last line's own box exactly.
            className="toggle-glow group absolute right-0 bottom-0 flex items-center bg-bg pl-1 text-muted hover:text-accent focus-visible:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            {/* The fade: the cut-off words dissolve into the control rather
                than being sliced by a hard edge. Sits outside the button's
                box (right-full) so it never takes the hover target. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-full h-full w-10 bg-linear-to-r from-transparent to-bg"
            />
            {/* Only the word is underlined on hover. The ellipsis belongs to
                the sentence it ends, so an underline under it too broke into
                two dashes either side of the space. */}
            <span aria-hidden="true">…</span>&nbsp;
            <span className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] group-hover:decoration-current">
              more
            </span>
          </button>
        ) : null}
      </div>

      {!fits && open ? (
        <button
          ref={lessRef}
          type="button"
          onClick={() => toggle(false)}
          aria-expanded={true}
          aria-controls={id}
          className="toggle-glow mt-1 text-muted hover:text-accent hover:underline hover:underline-offset-4 focus-visible:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Show less
        </button>
      ) : null}
    </div>
  );
}

/** Fewest lines worth hiding; below this the text is shown whole. */
const MIN_HIDDEN = 2;

type Clamp = {
  /** Clip height, from the container's top edge. */
  height: number;
  /** Top and height of line N, where "… more" sits. */
  lastTop: number;
  lastHeight: number;
};

/**
 * Where line `lines` ends, or null when the text has no more lines than that.
 *
 * Walks the text nodes rather than taking one range over the whole element,
 * because a range's rects also include the border box of every element it
 * fully contains, and those would read as giant "lines". Rects on the same
 * row (two text nodes split by an inline element) are merged by their top.
 */
function measureClamp(el: HTMLElement, lines: number): Clamp | null {
  const origin = el.getBoundingClientRect().top;
  const range = document.createRange();
  const rows: { top: number; bottom: number }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    // Skip the control's own text, and the whitespace between tags.
    if (!node.textContent?.trim() || node.parentElement?.closest("button"))
      continue;
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.width === 0 || rect.height === 0) continue;
      const row = rows.find((r) => Math.abs(r.top - rect.top) < 2);
      if (row) row.bottom = Math.max(row.bottom, rect.bottom);
      else rows.push({ top: rect.top, bottom: rect.bottom });
    }
  }

  rows.sort((a, b) => a.top - b.top);
  // A clamp that would hide a single line is not worth a click: "… more"
  // takes as much space as the line it hides, and makes the reader work for
  // it. Only clamp when at least MIN_HIDDEN lines would go out of view.
  if (rows.length < lines + MIN_HIDDEN) return null;

  const last = rows[lines - 1];
  const next = rows[lines];
  return {
    // Halfway into the gap before the next line, so descenders on line N
    // survive and nothing of line N+1 peeks in.
    height: Math.round((last.bottom + next.top) / 2 - origin),
    lastTop: last.top - origin,
    lastHeight: last.bottom - last.top,
  };
}

"use client";

import { type ReactNode, useId, useRef, useState } from "react";

/**
 * A review's text with a "Read more" / "Show less" toggle, as on Google
 * reviews: the short version is shown, and the button swaps it for the
 * whole thing in place.
 *
 * Both versions are always in the page (rendered by the server, so the
 * letter's text is in the HTML and found by find-in-page and by search
 * engines), and the one not showing is `inert`: it cannot be tabbed into or
 * read by a screen reader, so only one is ever heard.
 *
 * The height animates with no measuring code, using a CSS grid trick: a
 * grid with one row whose size goes from `0fr` to `1fr` can transition,
 * because fr units are numbers, while `height: auto` is not a number and
 * cannot be transitioned. The hidden version sits at 0fr with `overflow:
 * hidden` on the cell (min-h-0 lets the cell shrink below its content), so
 * it takes no room. The two panels change at once, one shrinking while the
 * other grows, so the review eases to its new height instead of jumping.
 * With reduced motion it simply swaps.
 *
 * Collapsing a long letter from far down the page would leave the reader
 * stranded below where the review now ends, so if the review's top has
 * scrolled up behind the sticky header, collapsing brings it back into
 * view (scroll-mt-28 leaves room for that header).
 */
export function ReadMore({
  short,
  full,
}: {
  /** The pull quote. */
  short: ReactNode;
  /** The whole recommendation. */
  full: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (!next && top < 110) {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  const panel =
    "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none";

  return (
    <div ref={root} className="scroll-mt-28">
      <div
        inert={open}
        className={`${panel} ${open ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
      >
        <div className="min-h-0 overflow-hidden">{short}</div>
      </div>
      <div
        id={id}
        inert={!open}
        className={`${panel} ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">{full}</div>
      </div>

      {/* ml-5: the button starts where the words do (the text sits in a
          20px indent, where the opening quote mark hangs), not at the edge
          of the mark. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="toggle-glow mt-3 ml-5 inline-flex cursor-pointer items-center gap-2 rounded-[3px] text-[14px] text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3.5l4.5 4.5L6 12.5" />
        </svg>
        {open ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

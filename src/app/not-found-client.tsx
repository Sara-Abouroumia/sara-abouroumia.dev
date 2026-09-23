"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/** Long enough for any real route, short enough not to wreck the column. */
const MAX_PATH = 120;

/**
 * The address that was asked for.
 *
 * Read on the client rather than the server: for a URL that matches no route,
 * Next renders this page without ever telling it what was requested, and the
 * page itself is prerendered at build time, so there is no request to read
 * from. location is the only place the path exists.
 *
 * Nothing renders until it is known, which keeps the server and the first
 * client render identical and avoids a hydration mismatch.
 */
export function RequestedPath() {
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.location.pathname + window.location.search;
    setPath(raw.length > MAX_PATH ? `${raw.slice(0, MAX_PATH)}…` : raw);
  }, []);

  if (!path) return null;

  return (
    <p className="m-0 text-[14px] text-muted leading-[1.6] menu:text-[15px]">
      You were looking for{" "}
      {/* The path comes from the address bar, so it is whatever someone typed.
          React escapes it as text; break-all stops a long unbroken string from
          pushing the column wider than the page. */}
      <code className="border-field-border border-b border-dashed pb-px font-mono text-[13px] text-text break-all menu:text-[14px]">
        {path}
      </code>
    </p>
  );
}

// The leading marks are switched off, to see the rows without them: with an
// emoji on the label and an arrow at the end, a third glyph made each row
// busy. To bring them back, uncomment the two components below, put
// `Icon: PersonIcon` and `Icon: ChatIcon` back on the OPTIONS entries, and
// uncomment <option.Icon /> in the list.
//
// Line comments rather than a block: the code below contains a */ of its
// own, which would close a block comment early.
//
// function PersonIcon() {
//   return (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       aria-hidden="true"
//       className="shrink-0 text-muted transition-colors group-hover/option:text-accent"
//     >
//       <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
//       <path
//         d="M4.8 20a7.2 7.2 0 0 1 14.4 0"
//         stroke="currentColor"
//         strokeWidth="1.7"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }
//
// function ChatIcon() {
//   return (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       aria-hidden="true"
//       className="shrink-0 text-muted transition-colors group-hover/option:text-accent"
//     >
//       <path
//         d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H9l-4.5 3.5V6.5A2.5 2.5 0 0 1 7 4h10.5A2.5 2.5 0 0 1 20 6.5z"
//         stroke="currentColor"
//         strokeWidth="1.7"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }
//     /* emoji: "🙂", */
/**
 * The "go" mark, in place of a literal arrow character.
 *
 * A text arrow is drawn by whichever font happens to carry the glyph, so its
 * weight and baseline never quite match the label beside it. As a path it
 * takes the same stroke weight as every other mark on the site, keeps its
 * rounded ends, and slides on hover.
 */
function GoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-muted transition-[transform,color] group-hover/option:translate-x-1 group-hover/option:text-accent"
    >
      <path
        d="M4.5 12h14M12.5 5.5 19 12l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const OPTIONS = [
  { href: "/", label: "Get to know more About Me   😊" },
  { href: "/contact", label: "Want to Talk?  💬" },
] as const;

/**
 * Sara, asking what you were after.
 *
 * A dead end is the one page where the site has nothing to offer, so instead
 * of two grey navigation buttons it offers a person: the photo from the About
 * page, a line in her voice, and the two things a lost visitor is likely to
 * have wanted.
 *
 * The answers drop out of the bubble itself rather than sitting beneath it, so
 * the whole thing reads as one piece of speech that unfolds. Pressing the
 * question again folds it back up.
 *
 * It is a disclosure, not a menu: a plain button that expands a pair of links.
 * That keeps it operable by keyboard and screen reader for free, where a
 * click-only <div> would not be, and the two destinations stay real links, so
 * they can be middle-clicked, copied, or opened in a new tab.
 *
 * `avatar` arrives as a prop rather than an import: <Avatar /> is a server
 * component, and passing it through as a slot keeps its next/image work on the
 * server instead of pulling it into this client bundle.
 */
export function AskSara({ avatar }: { avatar: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Opening hands focus to the first option, so a keyboard visitor lands on
  // the answer rather than having to tab back through the page to find it.
  useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  // Escape closes and puts focus back where it started, and a click elsewhere
  // just closes: the same two dismissals the resume menu uses on the About
  // page, so the site behaves consistently.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="flex items-start gap-3">
      {avatar}

      {/* The tail sits on this wrapper rather than inside the bubble, because
          the bubble clips its children to its own corners to keep the last
          option's fill inside the radius, and that clipping would take the
          tail with it.

          Its border colour is picked with a ternary, never by adding one
          class on top of another: two utilities setting border-color leave
          the winner to stylesheet order rather than to the order they are
          written in, which is why the tail kept its grey edge while the
          bubble turned accent. */}
      <div className="relative">
        <span
          aria-hidden="true"
          className={`-left-[6px] absolute top-[20px] h-[11px] w-[11px] rotate-45 border-b border-l bg-panel transition-colors ${
            open ? "border-accent" : "border-border"
          }`}
        />

        <div
          className={`overflow-hidden rounded-[14px] border bg-panel transition-colors ${
            open ? "border-accent" : "border-border"
          }`}
        >
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 justify-between px-4 py-2.5 text-left text-[15px] text-text-soft transition-colors hover:text-text focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent menu:text-[16px]"
          >
            What are you looking for?
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path
                d="M6 9.5l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/*
           * Opens and closes on a height animation, using the 0fr-to-1fr grid
           * row trick: a plain height transition needs a pixel value, and the
           * answers have no fixed height. The row resolves to the content's
           * own height, so the fold is smooth without hard-coding anything.
           *
           * `inert` rather than `hidden` is what makes that possible. hidden
           * cannot be animated, while inert leaves the panel in the layout
           * but takes its links out of the tab order and out of the
           * accessibility tree, which is what hidden was there for.
           * aria-controls still points at a real element either way.
           *
           * motion-safe: someone who asked for reduced motion gets the same
           * fold without the animation.
           */}
          <div
            id={panelId}
            inert={!open}
            className={`grid ease-out motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-200 ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-border border-t">
                {OPTIONS.map((option, i) => (
                  <Link
                    key={option.href}
                    href={option.href}
                    ref={i === 0 ? firstOptionRef : undefined}
                    // even:bg-row-alt stripes the list the way a table does.
                    // It is keyed on position, so a third answer would carry
                    // the pattern on without touching this.
                    className="group/option flex min-h-11 items-center gap-2.5 px-4 py-2.5 text-[15px] text-text no-underline transition-colors even:bg-row-alt hover:text-accent focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {/* <option.Icon /> */}
                    {option.label}
                    <span className="ml-auto pl-3">
                      <GoIcon />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

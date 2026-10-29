"use client";

import { type ReactNode, useRef } from "react";

/**
 * A native <details> whose content grows open and shrinks closed, instead
 * of appearing and vanishing in one frame.
 *
 * The browser toggles `open` instantly, so the click is intercepted and the
 * toggle sequenced by hand with the Web Animations API:
 *
 *   opening: set `open` (the content now exists and has a height), then
 *            animate its height from 0 up to that height;
 *   closing: animate the height down to 0 first, and only then remove
 *            `open`, so the content is still there while it shrinks.
 *
 * Removing `open` last matters beyond the content: CSS that reacts to an
 * open letter (the references grid's :has(details[open])) changes only
 * once the card is short again, so nothing else jumps mid-animation.
 *
 * Everything else stays native: keyboard (Enter and Space on the summary
 * fire this same click), the screen reader's expanded/collapsed state,
 * find-in-page opening it, and it works with no JavaScript at all, just
 * without the motion. Anyone who asked their OS for less motion gets the
 * plain instant toggle.
 */
export function AnimatedDetails({
  summary,
  summaryClassName,
  className,
  children,
}: {
  summary: ReactNode;
  summaryClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const running = useRef<Animation | null>(null);

  const toggle = (e: React.MouseEvent) => {
    const d = root.current;
    const b = body.current;
    if (!d || !b || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    e.preventDefault();

    // Where the height starts: 0 when closed (a closed <details> still
    // reports its content's full height, which made opening animate from
    // full to full, so not at all), otherwise wherever it is now, so a
    // second click mid-animation reverses from where it got to.
    const from = d.open ? b.getBoundingClientRect().height : 0;
    running.current?.cancel();

    const closing = d.open && running.current?.id !== "closing";
    if (!closing) d.open = true;
    const to = closing ? 0 : b.scrollHeight;

    b.style.overflow = "hidden";
    const a = b.animate(
      [
        { height: `${from}px`, opacity: closing ? 1 : from ? 1 : 0 },
        { height: `${to}px`, opacity: closing ? 0 : 1 },
      ],
      // Opening a touch slower than closing: arriving content is read,
      // leaving content only has to get out of the way. The standard
      // ease-in-out curve, so neither direction lurches on its first frame.
      { duration: closing ? 260 : 340, easing: "cubic-bezier(.4,0,.2,1)" },
    );
    a.id = closing ? "closing" : "opening";
    running.current = a;
    a.onfinish = () => {
      if (closing) d.open = false;
      b.style.overflow = "";
      running.current = null;
    };
  };

  return (
    <details ref={root} className={className}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is natively interactive (focusable, toggled by Enter and Space, which fire this click) */}
      <summary onClick={toggle} className={summaryClassName}>
        {summary}
      </summary>
      <div ref={body}>{children}</div>
    </details>
  );
}

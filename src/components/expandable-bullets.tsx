"use client";

import { useId, useState } from "react";
import { PROSE } from "@/components/section";

const LIST = `${PROSE} list-disc space-y-1.5 pl-5 text-[15px] text-text-soft leading-[1.65]`;

/**
 * Bullet list that shows the first few and hides the rest behind a toggle.
 *
 * Everything is rendered into the DOM and the overflow is hidden rather than
 * unmounted, so the full text is in the page source for search engines and for
 * a reader who prints it, the "…more" is a reading affordance, not a fetch.
 */
export function ExpandableBullets({
  bullets,
  max,
}: {
  bullets: string[];
  /** Omit to render every bullet with no toggle. */
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const hiddenId = useId();

  const limit = max ?? bullets.length;
  const visible = bullets.slice(0, limit);
  const rest = bullets.slice(limit);

  if (rest.length === 0) {
    return (
      <ul className={LIST}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <ul className={LIST}>
        {visible.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <ul className={`${LIST} mt-1.5`} id={hiddenId} hidden={!open}>
        {rest.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={hiddenId}
        className="mt-2 text-muted text-sm hover:text-accent"
      >
        {open ? "see less" : `…more (${rest.length})`}
      </button>
    </div>
  );
}

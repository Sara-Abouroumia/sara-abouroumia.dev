"use client";

import { useEffect, useState } from "react";
import { sectionId } from "@/components/section";

/**
 * The line a heading has to cross to count as reached, read from the same
 * --anchor-offset the sections use to place themselves.
 *
 * These two must not be set independently. An anchor jump parks a section
 * exactly at the offset, so a line even a pixel above it means the section you
 * just jumped to does not register and the marker lags one behind, which is
 * precisely what a hardcoded 132 against a 134 offset produced. Reading the
 * same value, plus a little slack, makes that impossible.
 */
function readLine() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--anchor-offset",
  );
  const parsed = Number.parseFloat(raw);
  return (Number.isFinite(parsed) ? parsed : 120) + 8;
}

/**
 * Which section the reader is currently in, or null above the first one.
 *
 * A position check rather than an IntersectionObserver band. A band gets the
 * last section wrong: the page cannot scroll far enough to bring it under the
 * header, so it never enters the band and the marker sticks on the one before
 * it. Asking "which heading has passed the line, and are we at the bottom" has
 * no such blind spot.
 *
 * `titles` must be a stable reference (a module-level const, not an array
 * built during render) or the listener is torn down and rebuilt every frame.
 */
export function useActiveSection(titles: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = titles.map(sectionId);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Cached, not read per frame: getComputedStyle forces a style resolve, and
    // the value only changes at the xl breakpoint.
    let line = readLine();

    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }
      let current: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      // Null above the first section: nothing is being read yet, so marking
      // something current would be a lie.
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Crossing the xl breakpoint swaps the chip bar for the gutter rail, which
    // changes the offset, and so the line.
    const onResize = () => {
      line = readLine();
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [titles]);

  return active;
}

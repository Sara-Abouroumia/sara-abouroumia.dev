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
  // 40px of slack, not 8. A section counts as current once its heading has
  // come into view just under the sticky chrome, which is when a reader
  // takes themselves to be "in" it. 8px was so tight that any small drift
  // (a late layout shift, a browser landing a few pixels off) left the
  // previous section lit with the next one plainly on screen.
  return (Number.isFinite(parsed) ? parsed : 120) + 40;
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

    /**
     * The section the visitor ASKED for, by clicking a link to it (in either
     * navigator, or anywhere) or by arriving with it in the URL. While set,
     * it is the answer, whatever the scroll position says.
     *
     * Without it, position alone decided, and position can be wrong about
     * intent: on a tall screen there is not enough page below Education for
     * it to scroll up to the top, the jump stops at the bottom, and the
     * "bottom means the last section" rule lit Skills for a click on
     * Education. Cleared the moment the visitor scrolls by hand (wheel,
     * touch, keyboard), when position becomes the right question again. Not
     * by scroll events: the smooth jump itself fires those.
     */
    let intent: string | null = null;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (intent) {
        setActive(intent);
        return;
      }
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

    /**
     * Arriving with #section in the URL (a shared link, a reload after a
     * jump): the browser scrolls to it during load, but the page is still
     * settling then. The bio's "… more" clamp measures itself once fonts are
     * in and grows by a line, pushing every section ~20px down AFTER the
     * jump, so the visitor landed short, with the wrong section lit.
     *
     * Measured, frame by frame: with scroll-behavior: smooth, the browser's
     * jump is a ~650ms ANIMATION aimed at where the section was when it
     * started. The shift lands halfway through it, and the animation still
     * finishes at its old target, ~20px short.
     *
     * So: wait for scrolling to stop, then land again, instantly, if still
     * off by more than a couple of pixels. A visitor taking over is detected
     * by actual input (wheel, touch, key, pointer), not by the page having
     * moved, since the browser's own animation moves it too; once they have
     * touched anything, their scroll position is theirs, and pulling the page
     * out from under them would be worse than the drift.
     */
    const target = window.location.hash.slice(1);
    if (ids.includes(target)) intent = target;

    const onLinkClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!link) return;
      const id = link.getAttribute("href")?.slice(1) ?? "";
      if (ids.includes(id)) {
        intent = id;
        setActive(id);
      } else {
        // Any other in-page link (Back to top) moves the reader somewhere
        // that is not a section, so the old ask no longer applies.
        intent = null;
        onScroll();
      }
    };
    // Hand scrolling hands the decision back to position. Keys only when they
    // scroll: Tab or Enter on a link is not the visitor moving the page.
    const SCROLL_KEYS = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);
    const release = (e: Event) => {
      if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
      if (!intent) return;
      intent = null;
      onScroll();
    };
    const releasers = ["wheel", "touchmove", "keydown"] as const;
    document.addEventListener("click", onLinkClick, true);
    for (const type of releasers)
      window.addEventListener(type, release, { passive: true });
    let settleTimer = 0;
    let interacted = false;
    const onInput = () => {
      interacted = true;
    };
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    if (ids.includes(target)) {
      for (const type of inputs)
        window.addEventListener(type, onInput, { passive: true, once: true });
      let lastY = -1;
      let still = 0;
      let checks = 0;
      const check = () => {
        if (interacted) return;
        const y = window.scrollY;
        still = y === lastY ? still + 1 : 0;
        lastY = y;
        // Settled: unmoved for three checks (~300ms). Give up after ~4s.
        if (still < 3 && ++checks < 40) {
          settleTimer = window.setTimeout(check, 100);
          return;
        }
        const el = document.getElementById(target);
        if (!el) return;
        const drift = el.getBoundingClientRect().top - (line - 40);
        if (Math.abs(drift) > 2) {
          window.scrollTo({ top: y + drift, behavior: "instant" });
        }
      };
      settleTimer = window.setTimeout(check, 100);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      document.removeEventListener("click", onLinkClick, true);
      for (const type of releasers) window.removeEventListener(type, release);
      for (const type of inputs) window.removeEventListener(type, onInput);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [titles]);

  return active;
}

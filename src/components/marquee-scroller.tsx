"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** Drift speed of the auto-scroll, in px per second. */
const SPEED = 26;
/** How long the drift stays paused after the user scrolls or drags. */
const RESUME_DELAY = 1500;
/** Pointer travel before a press becomes a drag rather than a click. */
const DRAG_SLOP = 4;
/**
 * How long a hover holds the strip still before it drifts on again.
 *
 * An unbounded hover pause is the obvious design, and it is wrong here: the
 * strip spans the full column width across the middle of the page, so a cursor
 * simply left there while reading freezes it for good and the section looks
 * broken. Bounding it keeps the useful half (stop long enough to read a mark)
 * and drops the failure. The timer restarts on every pointer move, so actively
 * moving along the row holds it still for as long as you are looking.
 */
const HOVER_HOLD = 2500;

/**
 * A horizontally scrolling strip that drifts on its own but yields to the user.
 *
 * The drift advances scrollLeft from a rAF loop rather than animating a CSS
 * transform, because a transformed track cannot also be a scroll container,
 * and being a real scroll container is what makes wheel, trackpad, touch and
 * drag work natively.
 *
 * The children must be one track holding two identical copies of the content,
 * with the first marked `data-marquee-copy`. Position is kept modulo that
 * copy's width, so wrapping lands on the identical pixel and the loop has no
 * seam in either direction.
 *
 * The drift pauses while the pointer is over the strip, while dragging, for a
 * moment after any manual scroll, while off-screen, and entirely under
 * prefers-reduced-motion. Manual scrolling always works.
 */
export function MarqueeScroller({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /**
     * Width of one copy, the distance to wrap by.
     *
     * Measured from the copy element itself, NOT from scrollWidth / 2. This
     * container carries horizontal padding, which scrollWidth includes, so
     * half of it overshoots one copy by the padding and every wrap would jump
     * sideways by that much.
     *
     * Cached rather than read per frame: touching scrollWidth or a rect in the
     * same frame as writing scrollLeft forces a synchronous layout, and doing
     * that 60 times a second is exactly the sort of thing that reads as jank.
     */
    let span = 0;
    const copy = el.querySelector<HTMLElement>("[data-marquee-copy]");
    const measure = () => {
      span = copy
        ? copy.getBoundingClientRect().width
        : Math.round(el.scrollWidth / 2);
    };
    measure();

    // Our own sub-pixel position. At 26px/s a frame moves ~0.43px, and a
    // browser that rounds scrollLeft to whole pixels would round each
    // increment away to nothing. Accumulate here, then assign.
    let pos = el.scrollLeft;
    let hovering = false;
    let dragging = false;
    let pressing = false;
    let visible = true;
    let resumeAt = 0;
    let lastMove = 0;
    let last = performance.now();
    let raf = 0;

    /** Position modulo one copy. Handles any magnitude, both directions. */
    const norm = (value: number) =>
      span > 0 ? ((value % span) + span) % span : value;

    const apply = (value: number) => {
      pos = norm(value);
      el.scrollLeft = pos;
    };

    const pauseBriefly = () => {
      resumeAt = performance.now() + RESUME_DELAY;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); // clamp tab-switch gaps
      last = now;

      const held = hovering && now - lastMove < HOVER_HOLD;

      if (
        !reduceMotion.matches &&
        visible &&
        !held &&
        !dragging &&
        now >= resumeAt
      ) {
        apply(pos + SPEED * dt);
      }
      raf = requestAnimationFrame(tick);
    };

    // Vertical wheel → horizontal scroll. A mouse wheel has no horizontal
    // axis, so without this the strip could only be scrolled by trackpad.
    // Genuinely horizontal input (trackpad, shift+wheel) is left to the
    // browser. This does capture the page's vertical scroll while the pointer
    // is over the strip; it is ~100px tall, so the trap is small.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      apply(el.scrollLeft + e.deltaY);
      pauseBriefly();
    };

    // Native horizontal scroll (trackpad, touch) still needs to wrap, and
    // should pause the drift. But assigning scrollLeft above fires this same
    // event, so a position already matching `pos` is our own movement and must
    // not pause, otherwise the strip would halt itself on the first frame.
    const onScroll = () => {
      if (dragging) return;
      const current = el.scrollLeft;
      if (Math.abs(current - pos) <= 1) return;
      const wrapped = norm(current);
      if (Math.abs(wrapped - current) > 1) el.scrollLeft = wrapped;
      pos = wrapped;
      pauseBriefly();
    };

    // Mouse drag. Touch is left to native scrolling (touch-action: pan-x),
    // which handles swipes and momentum better than we could.
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pressing = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") lastMove = performance.now();
      if (!pressing) return;
      const dx = e.clientX - startX;
      // Capture only once the pointer has actually travelled. Capturing on
      // pointerdown would steal hover and click from the icons underneath for
      // every press, including ones the user meant as a click.
      if (!dragging) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        dragging = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = "";
      }
      apply(startLeft - dx);
    };

    const endPress = (e: PointerEvent) => {
      if (!pressing) return;
      pressing = false;
      if (dragging) {
        dragging = false;
        delete el.dataset.dragging;
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
        pauseBriefly();
      }
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      lastMove = performance.now();
    };
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = false;
    };

    // The copy's width changes as web fonts swap in and images decode, and on
    // any resize. Re-measure, and re-anchor so the current position keeps
    // meaning the same place in the new span.
    const ro = new ResizeObserver(() => {
      measure();
      apply(pos);
    });
    ro.observe(el);
    if (copy) ro.observe(copy);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(el);

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPress);
    el.addEventListener("pointercancel", endPress);
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPress);
      el.removeEventListener("pointercancel", endPress);
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      // scroll-behavior:auto is defensive. It is not inherited today, but the
      // drift works by assigning scrollLeft every frame, and a smooth scroll
      // container would animate each of those and stall the strip. globals.css
      // sets html { scroll-behavior: smooth } for the section rail.
      className={`cursor-grab overflow-x-auto overscroll-x-contain [scroll-behavior:auto] [scrollbar-width:none] [touch-action:pan-x] data-dragging:cursor-grabbing data-dragging:select-none [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}

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
/** Duration of the eased glide an arrow press triggers, in ms. */
const GLIDE_MS = 450;

/** Ease-out cubic: quick off the mark, settles gently. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A plain chevron: one light grey stroke at normal icon weight, mostly
 * transparent so it hints without competing with the marks, round caps and
 * join so nothing ends in a point.
 *
 * It grows a little in two cases, by the same amount so they feel like one
 * gesture: while the cursor is on it, and while the row is being moved in its
 * direction (drag, trackpad, swipe or an arrow press). The second comes from
 * the `data-scrolling` flag the scroller sets on the wrapper, read here with a
 * group-data variant. Each arrow listens only for its own direction.
 */
const CHEVRON = {
  left: "M14.5 5.5 8.5 12l6 6.5",
  right: "M9.5 5.5 15.5 12l-6 6.5",
};

function Chevron({ dir }: { dir: -1 | 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-7 w-7 transition-[scale] duration-300 ease-out group-hover/arrow:scale-125 ${dir < 0 ? "group-data-[scrolling=left]/marquee:scale-125" : "group-data-[scrolling=right]/marquee:scale-125"}`}
    >
      <path d={dir < 0 ? CHEVRON.left : CHEVRON.right} />
    </svg>
  );
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  // The arrows render outside the effect, but the position state they need
  // to move lives inside it, so the effect hands them a function through here.
  const nudgeRef = useRef<(dir: -1 | 1) => void>(null);

  useEffect(() => {
    const el = ref.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

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
    // An arrow glide in flight: where it began, how far it goes, and when.
    let glide: { from: number; by: number; at: number } | null = null;

    /**
     * Marks which way the user is moving the row, so the matching arrow can
     * grow. "right" means scrollLeft increasing, the same sense as the right
     * arrow. The flag clears 200ms after the last movement, which is what
     * lets the arrow shrink back once the gesture stops.
     *
     * Written only when the value changes: this runs on every scroll event
     * and every drag frame, and a DOM attribute write that changes nothing
     * still costs a style recalculation.
     *
     * The automatic drift deliberately never calls this. It moves all the
     * time, so an arrow growing for it would just be permanently large.
     */
    let flagTimer = 0;
    const flag = (delta: number) => {
      if (!delta) return;
      const way = delta > 0 ? "right" : "left";
      if (wrap.dataset.scrolling !== way) wrap.dataset.scrolling = way;
      clearTimeout(flagTimer);
      flagTimer = window.setTimeout(() => {
        delete wrap.dataset.scrolling;
      }, 200);
    };

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

    /**
     * The loop runs only while there is something to animate. It used to keep
     * ticking off-screen and under reduced motion, skipping the move but still
     * waking the main thread 60 times a second for the whole visit. Now it
     * stops itself, and start() (from the visibility observer and the motion
     * setting) brings it back.
     */
    const tick = (now: number) => {
      raf = 0;
      if (!visible || reduceMotion.matches) return;
      const dt = Math.min((now - last) / 1000, 0.1); // clamp tab-switch gaps
      last = now;

      const held = hovering && now - lastMove < HOVER_HOLD;

      if (glide) {
        // Driven from this same loop rather than scrollTo({ behavior:
        // "smooth" }): a native smooth scroll would fight the drift's own
        // scrollLeft writes, and could not wrap at the seam either. norm()
        // inside apply() handles the wrap, so a glide crosses it cleanly.
        const t = Math.min((now - glide.at) / GLIDE_MS, 1);
        apply(glide.from + glide.by * easeOut(t));
        flag(glide.by);
        if (t === 1) {
          glide = null;
          pauseBriefly();
        }
      } else if (!held && !dragging && now >= resumeAt) {
        apply(pos + SPEED * dt);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible || reduceMotion.matches) return;
      // Fresh clock, so the first frame back does not jump by the time spent
      // stopped.
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // Half the visible width per press: far enough to bring fresh marks in,
    // short enough that the eye can follow where the row went.
    nudgeRef.current = (dir) => {
      const by = dir * Math.max(200, el.clientWidth * 0.5);
      if (reduceMotion.matches) {
        apply(pos + by); // no glide under reduced motion, just move
        return;
      }
      glide = { from: pos, by, at: performance.now() };
      start();
    };

    // No vertical-wheel capture. Turning the wheel into sideways scrolling
    // trapped the page: the loop has no end, so with the pointer over this
    // full-width strip the page could not scroll past Skills at all. A mouse
    // can still drag it (below), and horizontal input (trackpad, shift+wheel)
    // scrolls it natively.

    // Native horizontal scroll (trackpad, touch) still needs to wrap, and
    // should pause the drift. But assigning scrollLeft above fires this same
    // event, so a position already matching `pos` is our own movement and must
    // not pause, otherwise the strip would halt itself on the first frame.
    const onScroll = () => {
      if (dragging) return;
      const current = el.scrollLeft;
      if (Math.abs(current - pos) <= 1) return;
      flag(current - pos);
      const wrapped = norm(current);
      if (Math.abs(wrapped - current) > 1) el.scrollLeft = wrapped;
      pos = wrapped;
      pauseBriefly();
    };

    // Mouse drag. Touch is left to native scrolling, which handles swipes and
    // momentum better than we could. touch-action allows BOTH axes: pan-x
    // alone meant a thumb landing on the strip could not scroll the page up
    // or down, a dead zone across the full width of a phone. With both, the
    // browser reads the swipe's direction, as native carousels do.
    let startX = 0;
    let startLeft = 0;
    let prevDx = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pressing = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      prevDx = 0;
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
      // Pulling the pointer left reveals what is to the right, so scrollLeft
      // moves opposite to the pointer: its change is prevDx - dx.
      flag(prevDx - dx);
      prevDx = dx;
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
      start();
    });
    io.observe(el);
    reduceMotion.addEventListener("change", start);

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPress);
    el.addEventListener("pointercancel", endPress);
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    start();

    return () => {
      nudgeRef.current = null;
      cancelAnimationFrame(raf);
      clearTimeout(flagTimer);
      ro.disconnect();
      io.disconnect();
      reduceMotion.removeEventListener("change", start);
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
    // The arrows sit in this wrapper, not in the scroll container: anything
    // inside that would scroll away with the row, and be faded by its mask.
    <div ref={wrapRef} className="group/marquee relative">
      <div
        ref={ref}
        // scroll-behavior:auto is defensive. It is not inherited today, but the
        // drift works by assigning scrollLeft every frame, and a smooth scroll
        // container would animate each of those and stall the strip. globals.css
        // sets html { scroll-behavior: smooth } for the section rail.
        className={`cursor-grab overflow-x-auto overscroll-x-contain [scroll-behavior:auto] [scrollbar-width:none] [touch-action:pan-x_pan-y] data-dragging:cursor-grabbing data-dragging:select-none [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      {([-1, 1] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          aria-label={dir < 0 ? "Scroll left" : "Scroll right"}
          onClick={() => nudgeRef.current?.(dir)}
          // Hidden until the pointer is over the strip, then they fade in
          // and slide a few pixels inward from the edge over 300ms, so they
          // arrive rather than blink on. Each starts 6px outside its resting
          // spot (-translate-x-1.5 on the left, + on the right) and moves in
          // toward the row, as if stepping in from the edge.
          //
          // Hidden entirely on touch screens (pointer-coarse:hidden). A finger
          // swipes the row natively, so the arrows would only cover marks,
          // and with no hover there is no moment for them to appear anyway.
          // display:none also takes them out of the tab order there. On
          // desktop, keyboard focus always reveals the one focused.
          //
          // Two hover levels sit on two elements so they never fight over the
          // same property: this button answers the strip (group/marquee), the
          // chevron inside answers the arrow itself (group/arrow) by growing
          // a touch.
          //
          // top-[46px] centres them on the marks, not the whole row: 28px of
          // py-7 padding plus half the 36px mark.
          className={`group/arrow absolute top-[46px] z-10 flex h-11 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted opacity-0 transition-[opacity,translate,color] duration-300 ease-out group-hover/marquee:translate-x-0 group-hover/marquee:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 pointer-coarse:hidden ${dir < 0 ? "-left-2 -translate-x-1.5" : "-right-2 translate-x-1.5"}`}
        >
          <Chevron dir={dir} />
        </button>
      ))}
    </div>
  );
}

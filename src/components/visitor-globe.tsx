"use client";

import type { GeoPermissibleObjects } from "d3-geo";
import { useEffect, useRef } from "react";

export type GlobeDot = {
  code: string;
  /** [longitude, latitude] of the country's centre. */
  at: [number, number];
  /** 0 to 1, this country's visits relative to the busiest country. */
  weight: number;
};

/** Degrees per second while turning on its own: a full turn in ~45s. */
const AUTO_SPEED = 8;
/** Idle time after a drag before turning on its own again. */
const RESUME_AFTER_MS = 2200;
/** Fraction of fling velocity kept per frame-at-60fps: the glide's length. */
const FRICTION = 0.94;
/** Tilt limit, so the globe can be looked at from above and below but never
 * flipped upside down, which is disorienting and has nothing to show. */
const MAX_TILT = 60;
/**
 * Two globes, one per theme, because the meaning is in the picture: light
 * shows where people are, and here, where readers are.
 *
 * Dark: Earth at night from orbit, in the site's charcoal: ocean below the
 * page, land a step up, a faint neutral rim, and lights in the warm yellow of sodium street lamps,
 * blended additively so they glow and brighten where they overlap.
 *
 * Light: the same Earth in daylight, in the site's own warm neutrals, so it
 * sits on the cream page instead of punching a dark hole in it. Glowing
 * yellow reads as light only on a dark ground; on a light one it washes
 * out, so here the lights are a deeper amber, drawn normally (additive
 * blending would brighten them toward white and erase them).
 */
type Palette = {
  ocean: string;
  land: string;
  rim: string;
  /**
   * Heat colour as [r, g, b]: least visited, most visited. Each country is
   * one colour, mixed between the two by its weight, so the colour itself
   * says "a few" or "a lot", the way a heat map's legend does.
   */
  glow: [RGB, RGB];
  blend: GlobalCompositeOperation;
  /**
   * Opacity multiplier. Light on dark needs little to read; ink on a light
   * ground needs more, so each theme sets its own.
   */
  strength: number;
};

type RGB = [number, number, number];

const NIGHT: Palette = {
  // The site's dark neutrals, not a blue night: a blue-black globe read as
  // a cold object dropped onto the warm charcoal page. Ocean a step below
  // the page (#14161a), land at the panel/border tone so continents read,
  // and a neutral rim. The warm lights are then the only colour on it.
  ocean: "#0f1114",
  land: "#2a2d33",
  rim: "rgba(255, 255, 255, 0.1)",
  // Amber for the few, bright sodium yellow for the most.
  glow: [
    [255, 165, 55],
    [255, 196, 82],
  ],
  blend: "lighter",
  strength: 1,
};

const DAY: Palette = {
  ocean: "#efe9de",
  land: "#d9d0bd",
  rim: "rgba(150, 135, 105, 0.35)",
  // Claude orange (#d97757) for every country: how visited it is shows in
  // opacity alone. The accent's family belongs on this warm page, and it
  // is redder than the tan land, where amber (the land's own hue) mixed
  // into mud. Painted normally, so it stays the true orange: multiply
  // would darken it into the tan.
  glow: [
    [217, 119, 87],
    [217, 119, 87],
  ],
  blend: "source-over",
  strength: 1.6,
};

/** Degrees per arrow-key press. */
const KEY_STEP = 12;
/** Opacity of the faintest country (one visit), as a share of the busiest. */
const HEAT_FLOOR = 0.3;

/**
 * Where the site is read from, as a globe you can turn.
 *
 * Canvas rather than SVG: the picture changes every frame while it turns,
 * and re-projecting into one canvas is far cheaper than rewriting hundreds
 * of SVG path nodes 60 times a second, which is what keeps it smooth on a
 * phone.
 *
 * Motion model, one requestAnimationFrame loop:
 *   - idle: turns slowly west to east, time-based (degrees per second, not
 *     per frame), so the speed is the same on a 60Hz and a 120Hz screen;
 *   - drag: follows the pointer, horizontal turns it, vertical tilts it;
 *   - release: keeps the fling's velocity and decays it (FRICTION), then
 *     resumes the idle turn after RESUME_AFTER_MS.
 * The loop stops while the globe is off screen or the tab is hidden.
 *
 * Reduced motion: no turning on its own and no glide; dragging and the
 * arrow keys still work, because those are motion the reader asked for.
 *
 * d3-geo and topojson are imported inside the effect, so they load after
 * the page is interactive instead of weighing on its first paint.
 */
export function VisitorGlobe({
  dots,
  label,
  className = "",
}: {
  dots: GlobeDot[];
  /** What the globe shows, in words, for screen readers. */
  label: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let disposed = false;
    let frame = 0;
    let visible = true;
    // View: rotation is [lambda (turn), phi (tilt)]. Starts with Europe and
    // the Middle East facing the reader, where most of the readers are.
    const rot = { lambda: -25, phi: -20 };
    const vel = { lambda: 0, phi: 0 };
    let dragging = false;
    let last = { x: 0, y: 0, t: 0 };
    let idleSince = performance.now();
    let prevTime = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let draw: (() => void) | null = null;
    // Assigned once the async setup below has wired its listeners.
    let cleanup = () => {};

    // The theme is a class on <html> (next-themes). Repaint on the spot when
    // it flips, rather than waiting for the next turn.
    const isDark = () => document.documentElement.classList.contains("dark");
    let palette = isDark() ? NIGHT : DAY;
    const themeWatch = new MutationObserver(() => {
      palette = isDark() ? NIGHT : DAY;
      draw?.();
    });
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    (async () => {
      const [{ geoOrthographic, geoPath, geoDistance }, topo] =
        await Promise.all([import("d3-geo"), import("topojson-client")]);
      const res = await fetch("/map/land.json");
      const atlas = await res.json();
      if (disposed) return;
      const land = topo.feature(
        atlas,
        atlas.objects.land,
      ) as GeoPermissibleObjects;
      const projection = geoOrthographic().clipAngle(90).precision(0.6);
      const path = geoPath(projection, ctx);

      let size = 0;
      const resize = () => {
        const css = canvas.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        size = css;
        canvas.width = Math.round(css * dpr);
        canvas.height = Math.round(css * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        projection.translate([css / 2, css / 2]).scale(css / 2 - 2);
        draw?.();
      };

      draw = () => {
        if (!size) return;
        projection.rotate([rot.lambda, rot.phi]);
        ctx.clearRect(0, 0, size, size);

        const p = palette;
        // Ocean, land, and a thin rim, so the sphere reads as an object
        // without a heavy outline.
        ctx.beginPath();
        path({ type: "Sphere" });
        ctx.fillStyle = p.ocean;
        ctx.fill();

        ctx.beginPath();
        path(land);
        ctx.fillStyle = p.land;
        ctx.fill();

        ctx.beginPath();
        path({ type: "Sphere" });
        ctx.strokeStyle = p.rim;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Lights, near side only: a point more than 90 degrees of arc from
        // the view centre is behind the globe.
        ctx.globalCompositeOperation = p.blend;
        const center: [number, number] = [-rot.lambda, -rot.phi];
        for (const d of dots) {
          const arc = geoDistance(d.at, center);
          if (arc > Math.PI / 2) continue;
          const xy = projection(d.at);
          if (!xy) continue;
          // Heat, not dots: one soft patch per country with no hard edge
          // and no solid centre. Weight (already log-scaled) drives mostly
          // opacity and a little spread, so a busy country reads as warmer,
          // not as a bigger blob covering its neighbours. HEAT_FLOOR keeps a
          // single visit faintly visible next to a busy one. Patches that
          // overlap (Europe) add up, which is what makes it a heat map.
          // Near the rim they dim, the way a city near the horizon does.
          const fade = Math.min(1, (Math.PI / 2 - arc) / 0.35);
          const a =
            (HEAT_FLOOR + (1 - HEAT_FLOOR) * d.weight) * fade * p.strength;
          const r = size * (0.06 + 0.04 * d.weight);
          const heat = ctx.createRadialGradient(
            xy[0],
            xy[1],
            0,
            xy[0],
            xy[1],
            r,
          );
          // One colour per country, only its opacity falls off, so no
          // country shows two shades. Never a near-white core: a white
          // centre reads as a lamp, and additive blending pushes
          // overlapping patches further toward white. Kept well under full
          // opacity so even the busiest country is a tint on the land, not
          // a glare.
          const c = mix(p.glow[0], p.glow[1], d.weight);
          heat.addColorStop(0, `rgba(${c}, ${0.5 * a})`);
          heat.addColorStop(0.35, `rgba(${c}, ${0.3 * a})`);
          heat.addColorStop(0.7, `rgba(${c}, ${0.1 * a})`);
          heat.addColorStop(1, `rgba(${c}, 0)`);
          ctx.fillStyle = heat;
          ctx.beginPath();
          ctx.arc(xy[0], xy[1], r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      };

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - prevTime) / 1000);
        prevTime = now;
        if (!dragging) {
          const gliding = Math.abs(vel.lambda) + Math.abs(vel.phi) > 0.01;
          if (gliding && !reduce.matches) {
            rot.lambda += vel.lambda;
            rot.phi = clamp(rot.phi + vel.phi);
            const decay = FRICTION ** (dt * 60);
            vel.lambda *= decay;
            vel.phi *= decay;
            idleSince = now;
          } else if (!reduce.matches && now - idleSince > RESUME_AFTER_MS) {
            rot.lambda += AUTO_SPEED * dt;
          }
        }
        draw?.();
        frame = requestAnimationFrame(tick);
      };

      const start = () => {
        if (frame || disposed || !visible || document.hidden) return;
        prevTime = performance.now();
        frame = requestAnimationFrame(tick);
      };
      const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };

      // Drag. Pointer events cover mouse, pen and touch in one model;
      // capture keeps the drag alive when the pointer leaves the canvas.
      // Sensitivity scales with size, so a drag across the globe is about
      // half a turn whatever size it is drawn at.
      const onDown = (e: PointerEvent) => {
        dragging = true;
        vel.lambda = vel.phi = 0;
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const k = 180 / Math.max(160, size);
        const dx = (e.clientX - last.x) * k;
        const dy = (e.clientY - last.y) * k;
        rot.lambda += dx;
        rot.phi = clamp(rot.phi - dy);
        // Velocity as degrees per frame-at-60fps, smoothed, for the glide.
        const now = performance.now();
        const frames = Math.max(1, (now - last.t) / 16.7);
        vel.lambda = 0.6 * vel.lambda + 0.4 * (dx / frames);
        vel.phi = 0.6 * vel.phi + 0.4 * (-dy / frames);
        last = { x: e.clientX, y: e.clientY, t: now };
        if (reduce.matches) draw?.();
      };
      const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        idleSince = performance.now();
        // A pointer that stopped before letting go should not fling.
        if (performance.now() - last.t > 80) vel.lambda = vel.phi = 0;
        canvas.releasePointerCapture(e.pointerId);
        canvas.style.cursor = "";
      };
      // Scrolling with the pointer over the globe turns it, as a drag does:
      // vertical scroll tilts, a horizontal swipe (trackpad, shift+wheel)
      // spins. Fed into the glide velocity rather than applied as a jump, so
      // a notched mouse wheel's 100px steps still move it smoothly.
      //
      // The page is not held hostage: once the globe is at its tilt limit in
      // the direction being scrolled, the event is let through and the page
      // scrolls as normal. Without that, a cursor resting on the globe would
      // make the page unscrollable.
      const onWheel = (e: WheelEvent) => {
        // deltaMode 1 is lines (Firefox with a mouse): roughly 16px each.
        const unit = e.deltaMode === 1 ? 16 : 1;
        const dx = (e.shiftKey ? e.deltaY : e.deltaX) * unit;
        const dy = (e.shiftKey ? 0 : e.deltaY) * unit;
        const atLimit =
          dx === 0 &&
          ((dy > 0 && rot.phi <= -MAX_TILT + 0.5) ||
            (dy < 0 && rot.phi >= MAX_TILT - 0.5));
        if (atLimit) return;
        e.preventDefault();
        const k = 0.012;
        if (reduce.matches) {
          rot.lambda -= dx * k * 6;
          rot.phi = clamp(rot.phi - dy * k * 6);
          draw?.();
        } else {
          vel.lambda = clampVel(vel.lambda - dx * k);
          vel.phi = clampVel(vel.phi - dy * k);
        }
        idleSince = performance.now();
      };

      const onKey = (e: KeyboardEvent) => {
        const step: Record<string, [number, number]> = {
          ArrowLeft: [-KEY_STEP, 0],
          ArrowRight: [KEY_STEP, 0],
          ArrowUp: [0, KEY_STEP],
          ArrowDown: [0, -KEY_STEP],
        };
        const s = step[e.key];
        if (!s) return;
        e.preventDefault();
        rot.lambda += s[0];
        rot.phi = clamp(rot.phi + s[1]);
        vel.lambda = vel.phi = 0;
        idleSince = performance.now();
        draw?.();
      };

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("keydown", onKey);
      // passive: false, or preventDefault is ignored and the page scrolls too.
      canvas.addEventListener("wheel", onWheel, { passive: false });

      const resizeWatch = new ResizeObserver(resize);
      resizeWatch.observe(canvas);
      const seen = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? start() : stop();
      });
      seen.observe(canvas);
      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      resize();
      start();

      cleanup = () => {
        stop();
        resizeWatch.disconnect();
        seen.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("keydown", onKey);
        canvas.removeEventListener("wheel", onWheel);
      };
    })().catch((error) => console.error("globe: could not load", error));

    return () => {
      disposed = true;
      cleanup();
      themeWatch.disconnect();
    };
  }, [dots]);

  return (
    // tabIndex so the arrow keys can turn it; role img with a label so a
    // screen reader hears what it shows rather than "canvas".
    // touch-action none: on a touchscreen a drag on the globe turns it
    // instead of scrolling the page (the page still scrolls from anywhere
    // else).
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      tabIndex={0}
      className={`aspect-square w-full cursor-grab touch-none rounded-full shadow-[0_1px_10px_-4px_rgba(90,70,40,0.25)] dark:shadow-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4 ${className}`}
    />
  );
}

/** A fast flick of the wheel should spin it, never blur it. */
function clampVel(v: number): number {
  return Math.max(-6, Math.min(6, v));
}

function clamp(phi: number): number {
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, phi));
}

/**
 * The colour a fraction t of the way from `from` to `to`, as "r, g, b" for
 * an rgba() string. Straight per-channel interpolation: across violet and
 * pink, both saturated, it stays vivid all the way, with no grey middle.
 */
function mix(from: RGB, to: RGB, t: number): string {
  return from.map((v, i) => Math.round(v + (to[i] - v) * t)).join(", ");
}

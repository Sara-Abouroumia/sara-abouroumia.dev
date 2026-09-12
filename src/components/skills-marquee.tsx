import Image from "next/image";
import type { CSSProperties } from "react";
import * as simpleIcons from "simple-icons";
import { MarqueeScroller } from "@/components/marquee-scroller";
import { allSkills, type Skill } from "@/content/skills";

type IconRecord = { title: string; path: string; hex: string };

/** simple-icons exports each mark as `siTypescript`, `siNextdotjs`, and so on. */
function lookup(slug?: string): IconRecord | null {
  if (!slug) return null;
  const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  const icon = (simpleIcons as Record<string, unknown>)[key];
  return icon && typeof icon === "object" && "path" in icon
    ? (icon as IconRecord)
    : null;
}

/* ---------------------------------------------------------------------------
 * Brand colours, adjusted per theme.
 *
 * Brand hexes are chosen for a white page, and a good few of them are
 * effectively black — GitHub is #181717, Express and Next.js are #000000. Drop
 * those onto the dark panel unchanged and the mark disappears. So each colour
 * is nudged in lightness until it clears a floor, keeping hue and saturation so
 * the brand still reads. Runs at build time — no cost in the browser.
 *
 * The floors are deliberately below the 3:1 WCAG figure for graphics. These
 * marks are decorative: every one carries its name in readable text directly
 * beneath, so nothing is conveyed by colour alone. Holding 3:1 would drag
 * JavaScript's yellow to olive and React's cyan to teal — destroying the brand
 * colours in the name of legibility they don't need. The floors below rescue
 * only what would otherwise be invisible.
 * ------------------------------------------------------------------------- */

const CARD_LIGHT = "#f4f2ec"; // --panel, light
const CARD_DARK = "#1e2126"; // --panel, dark
const MIN_LIGHT = 2;
const MIN_DARK = 2.6;

function toLinear(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return (
    0.2126 * toLinear((n >> 16) & 255) +
    0.7152 * toLinear((n >> 8) & 255) +
    0.0722 * toLinear(n & 255)
  );
}

function contrast(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function toHsl(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function toHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Walks lightness toward `direction` until the mark clears `target`. */
function fit(
  hex: string,
  background: string,
  direction: 1 | -1,
  target: number,
) {
  const [h, s] = toHsl(hex);
  let [, , l] = toHsl(hex);
  let out = hex;
  for (let i = 0; i < 60 && contrast(out, background) < target; i++) {
    l = Math.min(0.97, Math.max(0.06, l + direction * 0.015));
    out = toHex(h, s, l);
  }
  return out;
}

/**
 * Glow opacity per theme, as a hex alpha byte.
 *
 * Baked in here rather than mixed in CSS: the minifier collapses
 * `color-mix(… currentColor var(--x) …)` down to plain currentColor, which is
 * a full-strength glow, so the alpha has to arrive as a literal.
 */
const GLOW_ALPHA_LIGHT = "a8"; // 66%
const GLOW_ALPHA_DARK = "99"; // 60%

/** Pins lightness into a band, leaving hue and saturation alone. */
function clampLightness(hex: string, min: number, max: number) {
  const [h, s, l] = toHsl(hex);
  return toHex(h, s, Math.min(max, Math.max(min, l)));
}

function markColors(hex: string) {
  const brand = `#${hex.replace("#", "")}`;
  const light = fit(brand, CARD_LIGHT, -1, MIN_LIGHT); // darken toward the pale card
  const dark = fit(brand, CARD_DARK, 1, MIN_DARK); // lighten toward the dark card
  return {
    light,
    dark,
    /**
     * The glow is its own colour, not the mark's.
     *
     * On a dark ground a halo reads as light, so the already-lightened mark
     * colour is right. On a pale ground it reads as a *tinted shadow* instead,
     * and two things went wrong with reusing the mark colour there: the very
     * pale brands (React's cyan, JavaScript's yellow) had almost nothing to
     * show against cream, while the ones darkened for legibility threw an
     * olive-ish smudge rather than a colour. Pinning lightness into a mid band
     * gives every brand a saturated halo at the same strength — vivid enough to
     * read on cream, dark enough to actually be there.
     */
    glowLight: `${clampLightness(brand, 0.3, 0.52)}${GLOW_ALPHA_LIGHT}`,
    glowDark: `${dark}${GLOW_ALPHA_DARK}`,
  };
}

/* ---------------------------------------------------------------------------
 * The house set: marks for the skills that are concepts rather than products.
 *
 * Drawn as line art, deliberately, so they never read as a brand mark for
 * something that has none — the difference from the solid vendor silhouettes
 * beside them is the honest signal. Each shape is the conventional one for its
 * idea, not an invention: a cylinder for a database, braces for an API
 * payload, a loop for a pipeline, a shield for a security gate.
 * ------------------------------------------------------------------------- */

const GLYPHS: Record<NonNullable<Skill["glyph"]>, string> = {
  database:
    "M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3Z M20 6v6c0 1.66-3.58 3-8 3s-8-1.34-8-3V6 M20 12v6c0 1.66-3.58 3-8 3s-8-1.34-8-3v-6",
  api: "M9.5 3.5C7 3.5 7.8 8 6.2 9.6c-.7.7-1.7 1.3-1.7 2.4s1 1.7 1.7 2.4C7.8 16 7 20.5 9.5 20.5 M14.5 3.5c2.5 0 1.7 4.5 3.3 6.1.7.7 1.7 1.3 1.7 2.4s-1 1.7-1.7 2.4c-1.6 1.6-.8 6.1-3.3 6.1",
  // Scaled to ~1.15x the usual lemniscate so it fills the 24-unit box; drawn
  // at the default size it spans only 8 units tall and reads undersized beside
  // the vendor marks.
  pipeline:
    "M12 12c-2.3-3.07-4.6-4.6-6.9-4.6a4.6 4.6 0 1 0 0 9.2c2.3 0 4.6-1.53 6.9-4.6Z M12 12c2.3 3.07 4.6 4.6 6.9 4.6a4.6 4.6 0 0 0 0-9.2c-2.3 0-4.6 1.53-6.9 4.6Z",
  shield:
    "M12 3 4.5 6.2v5.6c0 4.4 3.1 7.7 7.5 9.2 4.4-1.5 7.5-4.8 7.5-9.2V6.2L12 3Z M8.9 12.1l2.3 2.3 4.2-4.5",
};

/**
 * The site accent, mirrored from globals.css.
 *
 * Duplicated here for the same reason CARD_LIGHT/CARD_DARK are: the glow alpha
 * has to be baked into a literal hex at build time, and a CSS var cannot be
 * read from Node. Keep in step with --accent if that ever changes.
 */
const ACCENT_LIGHT = "#2c4a6e";
const ACCENT_DARK = "#7fa8d1";

function accentColors() {
  return {
    light: ACCENT_LIGHT,
    dark: ACCENT_DARK,
    glowLight: `${clampLightness(ACCENT_LIGHT, 0.3, 0.52)}${GLOW_ALPHA_LIGHT}`,
    glowDark: `${ACCENT_DARK}${GLOW_ALPHA_DARK}`,
  };
}

/* ------------------------------------------------------------------------- */

function SkillItem({ skill }: { skill: Skill }) {
  const icon = skill.image || skill.glyph ? null : lookup(skill.icon);
  const hex = skill.image ? skill.color : icon?.hex;
  const colors = skill.glyph ? accentColors() : hex ? markColors(hex) : null;

  return (
    <li
      style={
        colors
          ? ({
              "--mark": colors.light,
              "--mark-dark": colors.dark,
              "--glow": colors.glowLight,
              "--glow-dark": colors.glowDark,
            } as CSSProperties)
          : undefined
      }
      title={skill.name}
      // No vertical padding here — the room the glow needs lives on the
      // scroll container instead, since that is what clips it.
      className="skill group/skill flex w-[100px] shrink-0 flex-col items-center gap-2.5 px-1"
    >
      {skill.image ? (
        // drop-shadow traces the alpha channel, so the glow follows the
        // mark's silhouette here exactly as it does for the inline SVGs.
        // `unoptimized`: most of these are SVG, which the optimizer skips
        // anyway, and the PNGs are already 96px.
        <Image
          src={skill.image}
          alt=""
          width={36}
          height={36}
          unoptimized
          draggable={false}
          className="skill-mark h-9 w-9 object-contain"
        />
      ) : icon ? (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="skill-mark h-9 w-9"
        >
          <path d={icon.path} />
        </svg>
      ) : skill.glyph ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="skill-mark h-9 w-9"
        >
          <path d={GLYPHS[skill.glyph]} />
        </svg>
      ) : (
        // No mark exists — Microsoft and Apple pulled theirs from the set,
        // and CI/CD was never going to have one. Set the name instead, the
        // way <OrgLogo /> falls back to a monogram.
        <span
          aria-hidden="true"
          className="skill-mark flex h-9 items-center rounded-[4px] border border-muted-light px-2 font-semibold text-[12px] text-muted tracking-[0.02em]"
        >
          {skill.name}
        </span>
      )}
      <span className="text-center text-[11px] text-muted leading-tight transition-colors group-hover/skill:text-text">
        {skill.name}
      </span>
    </li>
  );
}

/**
 * The whole stack as one strip that drifts on its own and scrolls by hand.
 *
 * Two identical copies of the list, so <MarqueeScroller /> can wrap by half
 * the width and loop without a seam. The second copy is aria-hidden — it is
 * the same content twice, and a screen reader should hear the list once.
 *
 * This stays a server component so the brand-colour maths above runs at build
 * time; the scroll behaviour lives in the client wrapper.
 */
export function SkillsMarquee() {
  const copies = [0, 1];

  return (
    // py-7 is load-bearing, not styling. `overflow-x: auto` forces overflow-y
    // to compute to auto too — CSS will not scroll one axis while the other
    // stays visible — so this element clips vertically, and a drop-shadow
    // reaches roughly 1.2x its radius past the mark (24px at the 20px hover
    // radius). Less padding than that and the glow gets sliced off against the
    // container's top edge.
    <MarqueeScroller className="-mx-6 px-6 py-7 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
      <div className="flex w-max">
        {copies.map((copy) => (
          <ul
            key={copy}
            // The scroller wraps by this element's measured width, so the
            // marker has to sit on one copy exactly.
            data-marquee-copy={copy === 0 ? "" : undefined}
            aria-label={copy === 0 ? "Tools and technologies" : undefined}
            aria-hidden={copy === 1 ? "true" : undefined}
            className="flex list-none items-stretch p-0"
          >
            {allSkills.map((skill) => (
              <SkillItem key={`${copy}-${skill.name}`} skill={skill} />
            ))}
          </ul>
        ))}
      </div>
    </MarqueeScroller>
  );
}

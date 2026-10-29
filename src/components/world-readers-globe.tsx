import { type GlobeDot, VisitorGlobe } from "@/components/visitor-globe";
import { countryLonLat } from "@/lib/map/countries";
import type { CountryVisits } from "@/lib/visits";

/**
 * The visitor globe with its one-line caption: the server half.
 *
 * Turns the day's counts into dots (position plus relative weight) here, so
 * only the handful of countries with visits reach the browser, never the
 * centroid table, and the country names for the screen-reader label are
 * resolved once, from the runtime's own list (Intl.DisplayNames).
 */
export function WorldReadersGlobe({
  visits,
  className = "",
}: {
  visits: CountryVisits[];
  className?: string;
}) {
  const ranked = [...visits].sort((a, b) => b.visits - a.visits);
  const max = ranked[0]?.visits ?? 1;
  // Log scale, not linear. Linear divides by the busiest country, so the day
  // one country has 100,000 visits a country with 10 gets 0.0001 and
  // vanishes. On a log scale it keeps ~0.2: every order of magnitude is one
  // equal step of brightness (10, 100, 1,000...), which is how a reader
  // compares "a few" with "a lot" anyway. log1p so a single visit is not 0.
  const dots: GlobeDot[] = ranked.flatMap((v) => {
    const at = countryLonLat(v.code);
    const weight = Math.log1p(v.visits) / Math.log1p(max);
    return at ? [{ code: v.code, at, weight }] : [];
  });

  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const top = ranked
    .slice(0, 5)
    .map((v) => names.of(v.code) ?? v.code)
    .join(", ");
  const label = `Globe of where this site is read from: ${visits.length} ${visits.length === 1 ? "country" : "countries"}, most of all ${top}. Drag, scroll over it, or use the arrow keys to turn it.`;

  return (
    <figure className={`m-0 ${className}`}>
      <VisitorGlobe dots={dots} label={label} />
      {/* The one line of meta it keeps: what the lights are. Left-aligned
          under the figure, the way a caption sits under a diagram in a
          paper, so it reads as a label for data rather than decoration. */}
      <figcaption className="mt-2 text-left text-[10px] text-muted-light leading-snug tracking-[0.02em]">
        Heat map of visitors around the world
      </figcaption>
    </figure>
  );
}

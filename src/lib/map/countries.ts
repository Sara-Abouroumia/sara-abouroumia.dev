import centroids from "./centroids.json";

/**
 * Country centres, keyed by ISO 3166-1 alpha-2, the same code Vercel's
 * geolocation returns. From Google's public country-centroid table.
 *
 * Server-side only by use: the globe's wrapper picks out the countries that
 * have visits, so this 244-entry table never ships to the browser.
 */

// JSON arrays type as number[], not [lon, lat]: checked below rather than
// asserted, so a malformed entry is skipped instead of drawn at NaN.
const points: Record<string, number[]> = centroids;

/** A country's centre as [longitude, latitude], or null for an unknown code. */
export function countryLonLat(code: string): [number, number] | null {
  const lonLat = points[code];
  return lonLat?.length === 2 ? [lonLat[0], lonLat[1]] : null;
}

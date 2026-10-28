import land from "world-atlas/land-110m.json";

/**
 * The world's land as TopoJSON (Natural Earth 1:110m), for the readership
 * globe, which projects it in the browser frame by frame as it turns. Unlike
 * the flat map's SVG masks, a globe cannot be drawn ahead of time: every
 * rotation is a different picture.
 *
 * Served from this origin as a static file rather than fetched from a CDN,
 * so the CSP's connect-src 'self' covers it, and cached for a week, since it
 * only changes with a dependency upgrade. About 17KB compressed.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(land, {
    headers: { "Cache-Control": "public, max-age=604800" },
  });
}

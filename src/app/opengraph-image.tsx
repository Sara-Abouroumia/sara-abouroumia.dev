import { site } from "@/content/site";
import { OG_COLORS as C, OG_SIZE, ogCard, publicImage } from "@/lib/og";

/**
 * The site's default preview card: the home page, and any page without a
 * card of its own (Notes, Contact). A file at the root of app/ applies to
 * every route below it, which is how one file covers them all; a note's own
 * opengraph-image.tsx overrides it for that note.
 *
 * The name large with role and place under it, and the photo beside them,
 * so the footer byline every note card carries is switched off here rather
 * than saying the name twice.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${site.name}, ${site.role}`;

export default async function Image() {
  const photo = await publicImage("/sara.png");
  return ogCard(
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", fontFamily: "Lora", fontSize: 80 }}>
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 34,
            color: C.muted,
          }}
        >
          {site.role}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 6,
            fontSize: 30,
            color: C.muted,
          }}
        >
          {site.location}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 28,
            lineHeight: 1.45,
            maxWidth: 680,
          }}
        >
          AI for cybersecurity at Istanbul Technical University: intrusion
          detection and the security of LLM agents.
        </div>
      </div>
      {photo ? (
        // biome-ignore lint/performance/noImgElement: Satori draws <img>, next/image does not exist here
        <img
          src={photo}
          alt=""
          width={280}
          height={280}
          style={{ borderRadius: 140, border: `3px solid ${C.border}` }}
        />
      ) : null}
    </div>,
    { byline: false },
  );
}

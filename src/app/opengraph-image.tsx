import { site } from "@/content/site";
import { OG_COLORS as C, OG_SIZE, ogCard, publicImage } from "@/lib/og";

/**
 * The site's default preview card: the home page, and any page without a
 * card of its own (Notes, Contact). A file at the root of app/ applies to
 * every route below it, which is how one file covers them all; a note's own
 * opengraph-image.tsx overrides it for that note.
 *
 * Read top to bottom the way a business card is: who (name, role), where
 * (the university, with its crest), what (one line of the work), and the
 * photo beside it. The crest is there because a recognisable institution
 * mark says more at thumbnail size than the words do, which is also why the
 * summary no longer repeats the university's name. The footer byline every
 * note card carries is switched off here rather than saying the name twice.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${site.name}, ${site.role}, Istanbul Technical University`;

export default async function Image() {
  const [photo, crest] = await Promise.all([
    publicImage("/sara.png"),
    // The 200px JPEG, not the 96px PNG the site uses: the crest is fine
    // linework, and scaled from 96 it greyed out into a blur on the card.
    publicImage("/logos/itu_logo.jpg"),
  ]);
  return ogCard(
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", fontFamily: "Lora", fontSize: 80 }}>
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 34,
            color: C.muted,
          }}
        >
          {site.role}
        </div>

        {/* The affiliation: crest, then institution over position and
            place. The crest sits on white with a hairline, as the logos do
            on the site, so its edge reads on the white card. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 38,
          }}
        >
          {crest ? (
            // biome-ignore lint/performance/noImgElement: Satori draws <img>, next/image does not exist here
            <img
              src={crest}
              alt=""
              width={76}
              height={76}
              style={{
                borderRadius: 10,
                border: `2px solid ${C.border}`,
                background: "#ffffff",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
              Istanbul Technical University
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontSize: 24,
                color: C.muted,
              }}
            >
              Graduate researcher
              <span style={{ margin: "0 10px" }}>·</span>
              {site.location}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 28,
            lineHeight: 1.45,
            maxWidth: 680,
          }}
        >
          AI for cybersecurity: intrusion detection and the security of LLM
          agents.
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

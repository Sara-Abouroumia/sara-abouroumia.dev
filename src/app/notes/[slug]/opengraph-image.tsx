import { formatDay } from "@/lib/dates";
import { categoryLabel, getNote, getNotes } from "@/lib/notes";
import {
  OG_COLORS as C,
  OG_SIZE,
  ogCard,
  publicImage,
  titleSize,
} from "@/lib/og";

/**
 * The preview card for one note, shown wherever its link is shared.
 *
 * It mirrors the note's row on the listing: kind and date, the title, the
 * source line, and the same thumbnail figure on the right. A reader who has
 * seen the card recognises the note on the site, and the reverse.
 *
 * One PNG per note, rendered at build time (see generateStaticParams), so a
 * share costs the server nothing.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
// The card restates the title, which the preview already shows as text, so
// the alt says what the image is rather than repeating it.
export const alt = "Preview card for a note by Sara Abouroumia";

export function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return ogCard(null);

  const figure = note.thumbnail ? await publicImage(note.thumbnail) : undefined;
  const source = note.source;

  return ogCard(
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingRight: figure ? 48 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          <span style={{ color: C.accent, fontWeight: 600 }}>
            {categoryLabel(note.category)}
          </span>
          <span style={{ margin: "0 12px" }}>·</span>
          {formatDay(note.date)}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontFamily: "Lora",
            fontSize: titleSize(note.title, Boolean(figure)),
            lineHeight: 1.15,
          }}
        >
          {note.title}
        </div>
        {source ? (
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 26,
              color: C.muted,
            }}
          >
            {source.authors}
            {source.venue || source.year
              ? ` · ${[source.venue, source.year].filter(Boolean).join(" ")}`
              : ""}
          </div>
        ) : null}
      </div>

      {figure ? (
        <div
          style={{
            display: "flex",
            width: 380,
            height: 300,
            padding: 12,
            background: "#ffffff",
            border: `2px solid ${C.border}`,
            borderRadius: 8,
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: Satori draws <img>, next/image does not exist here */}
          <img
            src={figure}
            alt=""
            width={352}
            height={272}
            style={{ objectFit: "contain" }}
          />
        </div>
      ) : null}
    </div>,
  );
}

import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { site } from "@/content/site";

/**
 * Link-preview images: what WhatsApp, LinkedIn, Slack, iMessage, X and email
 * clients show when a URL from this site is pasted.
 *
 * Every one of those reads the same three tags, og:title, og:description and
 * og:image, from the page's HTML. Title and description were always there;
 * the image is what turns a grey text bubble into a card. 1200 by 630 is the
 * size they all agree on (1.91:1), and they generate their own smaller crops
 * from it.
 *
 * Drawn from JSX by next/og at build time, so each image is a static PNG on
 * the CDN, made once, not per share. Two constraints come with the renderer
 * (Satori), and they shape everything below:
 *
 *   - Only flexbox layout and inline styles. No Tailwind, no CSS variables,
 *     which is why the theme colours are repeated here as literals.
 *   - Fonts as raw TTF or OTF data. The site's own font files are WOFF2,
 *     which it cannot read, so static TTFs of the same faces live in
 *     assets/og-fonts.
 *
 * The light theme only: a preview has no way to know the viewer's theme, and
 * a light card reads well on both the light and dark chat backgrounds.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/** The site's light-theme tokens (globals.css :root), as literals. */
const C = {
  bg: "#ffffff",
  panel: "#f4f2ec",
  border: "#e2ded3",
  text: "#1c1c1a",
  muted: "#6b675c",
  accent: "#ad4f2d",
};

const font = (file: string) =>
  readFile(join(process.cwd(), "assets", "og-fonts", file));

async function fonts() {
  const [lora, inter, interBold] = await Promise.all([
    font("Lora-600.ttf"),
    font("Inter-400.ttf"),
    font("Inter-600.ttf"),
  ]);
  return [
    {
      name: "Lora",
      data: lora,
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: inter,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: interBold,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

/**
 * A file under public/ as a data URI, which is how the renderer takes images.
 * Read from disk rather than fetched: at build time there is no server to
 * fetch from. Undefined for anything missing or of an unknown type, so a bad
 * cover path costs the card its figure, not the build.
 */
export async function publicImage(path: string): Promise<string | undefined> {
  const type = MIME[extname(path).toLowerCase()];
  if (!type) return undefined;
  try {
    const data = await readFile(join(process.cwd(), "public", path));
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * The shared frame: the domain at the top, the author at the foot, an accent
 * rule along the top edge, and whatever the page is in between. The same
 * frame on every page is what makes a preview recognisably from this site
 * before it is read.
 */
export async function ogCard(
  children: ReactNode,
  /** Off for the site card, whose body already is the name and photo. */
  { byline = true }: { byline?: boolean } = {},
) {
  const photo = await publicImage("/sara.png");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        borderTop: `10px solid ${C.accent}`,
        padding: "56px 72px 52px",
        fontFamily: "Inter",
        color: C.text,
      }}
    >
      <div style={{ display: "flex", fontFamily: "Lora", fontSize: 30 }}>
        sara-abouroumia
        <span style={{ color: C.muted }}>.dev</span>
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        {children}
      </div>

      <div
        style={{
          display: byline ? "flex" : "none",
          alignItems: "center",
          gap: 20,
        }}
      >
        {photo ? (
          // biome-ignore lint/performance/noImgElement: Satori draws <img>, next/image does not exist here
          <img
            src={photo}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 32, border: `2px solid ${C.border}` }}
          />
        ) : null}
        <div style={{ display: "flex", fontSize: 26 }}>
          <span style={{ fontWeight: 600 }}>{site.name}</span>
          <span style={{ color: C.muted, margin: "0 12px" }}>·</span>
          <span style={{ color: C.muted }}>{site.role}</span>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fonts() },
  );
}

/**
 * Title size by length, so a short title is a headline and a long one still
 * fits in three lines. Chat apps shrink the card to a few hundred pixels
 * wide, so the title has to be large to survive that.
 */
export function titleSize(title: string, narrow: boolean) {
  const n = title.length;
  if (narrow) return n <= 36 ? 58 : n <= 64 ? 48 : 40;
  return n <= 40 ? 68 : n <= 72 ? 56 : 46;
}

export const OG_COLORS = C;

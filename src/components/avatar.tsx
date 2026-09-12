import Image from "next/image";
import { site } from "@/content/site";

/**
 * Profile photo with an initials fallback.
 *
 * The design uses an <image-slot> placeholder here because a prototype has no
 * real asset. Until a photo lands in public/, we render initials rather than an
 * empty grey box. A broken-looking placeholder on the page that introduces you
 * is worse than a deliberate monogram.
 *
 * To use a real photo: drop it in public/ and set `avatar` in content/site.ts.
 */
/**
 * Crop window into the 800×800 source, in source pixels.
 *
 * Uncropped, the head runs y=94–525 and so fills 54% of the frame, which at
 * 88px leaves a ~32px face. This window is sized so the head fills ~68% —
 * conventional headshot framing — and is offset up and slightly left to sit on
 * the face rather than the geometric centre of the hair and shoulders.
 */
const SOURCE_SIZE = 800;
const CROP = { x: 43, y: 23, size: 634 };

export function Avatar({ size = 88 }: { size?: number }) {
  const initials = site.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  if (site.avatar) {
    // Render the whole photo at the scale that makes CROP.size fill the
    // circle, then offset so the crop window lands at the top-left corner.
    const scale = size / CROP.size;
    const rendered = Math.round(SOURCE_SIZE * scale);

    return (
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 overflow-hidden rounded-full border border-border"
      >
        <Image
          src={site.avatar}
          alt={`${site.name}, ${site.role}`}
          width={rendered}
          height={rendered}
          priority
          className="absolute max-w-none"
          style={{
            left: -CROP.x * scale,
            top: -CROP.y * scale,
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-panel font-serif font-semibold text-muted"
    >
      <span style={{ fontSize: size * 0.32 }}>{initials}</span>
    </div>
  );
}

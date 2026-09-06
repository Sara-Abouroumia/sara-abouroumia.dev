import Image from "next/image";
import { site } from "@/content/site";

/**
 * Profile photo with an initials fallback.
 *
 * The design uses an <image-slot> placeholder here because a prototype has no
 * real asset. Until a photo lands in public/, we render initials rather than an
 * empty grey box — a broken-looking placeholder on the page that introduces you
 * is worse than a deliberate monogram.
 *
 * To use a real photo: drop it in public/ and set `avatar` in content/site.ts.
 */
export function Avatar({ size = 88 }: { size?: number }) {
  const initials = site.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  if (site.avatar) {
    return (
      <Image
        src={site.avatar}
        alt={`${site.name}, ${site.role}`}
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-full border border-border object-cover"
        style={{ width: size, height: size }}
      />
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

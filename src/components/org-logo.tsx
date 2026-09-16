import Image from "next/image";

/**
 * Logos sit on a fixed white tile in both themes rather than on --bg. The marks
 * we carry are dark ink meant for a light ground. ITU's navy seal would all but
 * vanish on the dark palette, and recoloring someone's mark is not an option.
 * White rather than cream so Nextarp's own white matte blends into the tile;
 * in light mode the tile disappears into the page entirely.
 */
const LOGO_TILE = "rounded-[5px] bg-white";

/**
 * Square org mark, with a monogram fallback.
 *
 * Follows <Avatar />: until a real asset lands in public/logos/, render a
 * deliberate monogram rather than a broken image or an empty grey box.
 */
export function OrgLogo({
  src,
  name,
  size = 26,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${LOGO_TILE}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const monogram = name
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      className="flex shrink-0 items-center justify-center rounded-[5px] border border-border bg-panel font-semibold text-muted tracking-[0.02em]"
    >
      {monogram}
    </span>
  );
}

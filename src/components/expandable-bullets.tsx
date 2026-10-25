import { ClampMore } from "@/components/clamp-more";
import { PROSE } from "@/components/section";

const TYPE = "text-[15px] text-text-soft leading-[1.65]";
const LIST = "list-disc space-y-1.5 pl-5";

/**
 * A bullet list, optionally cut off after `maxLines` lines with an inline
 * "… more" (see <ClampMore />).
 *
 * Lines, not bullets: a cap of "two bullets" shows four lines on a desktop
 * and ten on a phone, and always ends on a complete sentence, which reads as
 * the end of the list rather than as a cut.
 */
export function ExpandableBullets({
  bullets,
  maxLines,
}: {
  bullets: string[];
  /** Omit to render every bullet with no clamp. */
  maxLines?: number;
}) {
  const list = (
    <ul className={LIST}>
      {bullets.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  );

  if (!maxLines) return <div className={`${PROSE} ${TYPE}`}>{list}</div>;

  return (
    <ClampMore lines={maxLines} className={`${PROSE} ${TYPE}`}>
      {list}
    </ClampMore>
  );
}

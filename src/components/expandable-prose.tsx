import { ClampMore } from "@/components/clamp-more";

/**
 * Set as a lede: the serif reading face, one gentle step above the 15-16px
 * Inter body, and well below the 34px name, so the page reads headline, then
 * intro, then detail.
 *
 * 18px, not bigger, for two measured reasons. Source Serif's x-height is ~10%
 * shorter than Inter's, so 18px of it looks like ~16.5px Inter: a lede, where
 * 20px looked like a second heading competing with the name. And 18px across
 * the 700px PROSE column runs ~72 characters a line, still inside the 60-75
 * range long prose is comfortable in. (The 17px Inter this replaced ran to
 * ~90, which is what made the bio read as a wall.)
 *
 * On the wrapper rather than each <p>, so the inline "… more" inherits the
 * same face and size and reads as the end of the sentence it interrupts.
 */
const TYPE = "font-reading text-[17px] text-text leading-[1.7] md:text-[18px]";

/** Paragraphs cut off after `lines` lines, with an inline "… more". */
export function ExpandableProse({
  paragraphs,
  lines,
  className = "",
}: {
  paragraphs: readonly string[];
  lines: number;
  className?: string;
}) {
  return (
    <ClampMore lines={lines} className={`${TYPE} ${className}`}>
      <div className="space-y-5">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </ClampMore>
  );
}

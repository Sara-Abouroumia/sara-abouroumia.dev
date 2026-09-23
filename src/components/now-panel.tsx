import { PROSE } from "@/components/section";
import { type NowItem, now } from "@/content/about";
import { formatMonth } from "@/lib/dates";

/**
 * Line-leading marks, drawn rather than borrowed. These name kinds of
 * activity, not products, so they follow the same line-art convention as the
 * house glyphs in the skills strip.
 */
const NOW_ICONS: Record<NowItem["icon"], string> = {
  code: "M8.6 7.6 3.4 12l5.2 4.4 M15.4 7.6 20.6 12l-5.2 4.4 M13.9 5 10.1 19",
  study:
    "M12 4 2.5 9 12 14l9.5-5L12 4Z M6.5 11.2V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.8",
  award:
    "M12 3.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Z M8.4 13.6 7.3 20.8l4.7-2.3 4.7 2.3-1.1-7.2",
};

/**
 * What I'm doing now.
 *
 * The pulsing dot and the date are doing the same job from two directions:
 * this is current, and here is the evidence. A "Now" heading on its own is a
 * claim; the date is what makes it checkable.
 */
export function NowPanel() {
  // bg-panel-cool, not bg-panel: this is the one surface on the page meant to
  // read as a recess rather than a warm card, so it takes the same cool tone
  // as a contact field. See --panel-cool in globals.css.
  return (
    <div className={`${PROSE} rounded-[3px] bg-panel-cool px-4 py-3.5`}>
      {/* One status line, read left to right: live, Now, as of when. The date
          is pushed to the far edge (justify-between) so it reads as a
          timestamp on the panel, not a word tacked onto the label. */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          {/* Two stacked circles: a solid dot carrying a halo, and a ring that
              expands out of it and fades. --live is its own token rather than
              --success-text: that green is tuned to be readable as body copy
              and comes out muddy as a 10px dot, where this one has to glow. */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="now-ping absolute inset-0 rounded-full bg-[var(--live)]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--live)] shadow-[0_0_9px_var(--live-glow)]" />
          </span>
          <span className="font-semibold text-muted text-xs uppercase tracking-[0.04em]">
            Now
          </span>
        </span>

        <span className="text-[11px] text-muted-light">
          Updated <time dateTime={now.updated}>{formatMonth(now.updated)}</time>
        </span>
      </div>

      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {now.items.map((item) => (
          // items-start, not items-center: a line that wraps on a phone should
          // keep its mark on the first line, not float it between two.
          <li key={item.text} className="flex items-start gap-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              // Centres a 14px mark on the first line's 19.25px box (14px text
              // at leading-snug): (19.25 − 14) / 2 ≈ 2.6px, and mt-0.5 is 2px.
              // The mark steps down with the text so it does not start
              // outweighing the line it belongs to.
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
            >
              <path d={NOW_ICONS[item.icon]} />
            </svg>
            {/* 14px against the 15px used for body copy elsewhere. The panel
                is an aside, not prose, so it reads better a step under the
                text around it. */}
            <span className="text-[14px] text-text-soft leading-snug">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { Service } from "@/content/experience";
import { PROSE, Section } from "./section";

const TITLE = "Leadership & Service";

/**
 * A mono strip, the way the canvas sets the metadata in this section: the org
 * and the dates under each role.
 */
const META =
  "font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]";

/**
 * Columns once there is room, and how many.
 *
 * Two rather than the board's three. Three columns of 250px put the longest
 * role at eighteen lines against four in the column beside it, and with four
 * roles the fourth hung alone on a second row. Two columns of about 400px read
 * at a sane measure and divide four entries evenly, two over two.
 *
 * One breakpoint on purpose. An earlier version paired `sm:grid-cols-2` with
 * `menu:grid-cols-3`, which silently rendered two columns everywhere: both are
 * single classes, so specificity ties, and Tailwind emits the custom `menu`
 * breakpoint before the built-in `sm`, letting the later `sm` rule win above
 * 941px too. With one breakpoint there is nothing to tie with.
 */
const COLS = 2;
const COLUMNS =
  "grid gap-8 sm:grid-cols-2 sm:grid-rows-[auto_auto_1fr] sm:gap-x-10 sm:gap-y-1.5";

/**
 * Each role is a grid item that becomes a subgrid of three rows once the
 * columns appear: title, meta line, summary.
 *
 * Without it each column sizes its own rows, so a title wrapping to three
 * lines pushes its meta rule and its summary below the column beside it, and
 * the hairlines land at different heights. Subgrid hands the rows back to the
 * parent, so every title block is as tall as the tallest and the rules run
 * straight across.
 *
 * `grid` rather than `flex` at every width: a one-column grid stacks exactly
 * like a flex column, so there is no display switch that could lose a race
 * with the stylesheet order.
 */
const COLUMN = "grid content-start gap-1.5 sm:row-span-3 sm:grid-rows-subgrid";

/** The hairline dividing a column from the one on its right. */
const RULE = "sm:border-border sm:border-r sm:pr-10";

/**
 * Clears the row above.
 *
 * The parent's row gap is 6px, because with subgrid that gap falls between a
 * role's own three rows rather than between roles. A second row of roles needs
 * its own air, and a margin is the one piece of spacing that belongs to the
 * item rather than to every track in the grid.
 */
const NEW_ROW = "sm:mt-8";

/**
 * Leadership & Service, set as a newspaper front page.
 *
 * Built from the "Front page in columns" board, with the heading coming from
 * the shared <Section /> rather than a masthead of its own, so it carries the
 * same rule, size, case and colour as every sibling section and cannot drift
 * from them. The newspaper character lives in the body: a lede with a drop
 * cap, then the roles in columns divided by hairlines, oldest first.
 */
export function ServiceFrontPage({
  entries,
  intro,
}: {
  entries: Service[];
  intro: string;
}) {
  return (
    <Section title={TITLE}>
      {/* The lede runs the full width above the columns rather than inside the
          first one, which is where the board put it. Inside a column it made
          that column far taller than its neighbours and threw the titles onto
          different baselines. Across the top it reads as the section's opening
          line, and the roles below it stay even.

          Capped at the prose measure for the same reason every other paragraph
          on the page is: at the full 832px it would run to about ninety
          characters a line.

          The drop cap is a first-letter rule rather than a wrapping span, so
          the text stays one uninterrupted string for selection, search and
          screen readers. */}
      <p
        className={`${PROSE} mb-7 text-[15px] text-text-soft leading-[1.7] first-letter:float-left first-letter:pr-2.5 first-letter:font-serif first-letter:font-semibold first-letter:text-[52px] first-letter:text-text first-letter:leading-[0.82]`}
      >
        {intro}
      </p>

      <div className={COLUMNS}>
        {entries.map((service, i) => {
          // A rule on every column except the last of its row, and except one
          // with nothing to its right because the list ran out.
          const ruled = i % COLS !== COLS - 1 && i < entries.length - 1;
          return (
            <Entry
              key={`${service.org}-${service.title}`}
              service={service}
              className={[COLUMN, ruled && RULE, i >= COLS && NEW_ROW]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })}
      </div>
    </Section>
  );
}

function Entry({
  service,
  className,
}: {
  service: Service;
  className: string;
}) {
  const { title, org, orgHref, start, end, summary } = service;

  return (
    <article className={className}>
      <h3 className="m-0 font-serif font-semibold text-lg text-text leading-snug tracking-[0.02em]">
        {title}
      </h3>

      {/* Org and dates on one rule-underscored line, as the board sets them.
          The same hairline the section rule and the column dividers use. */}
      <p className={`${META} m-0 border-border border-b pb-2 leading-[1.5]`}>
        {orgHref ? (
          <a
            href={orgHref}
            target="_blank"
            rel="noopener"
            className="underline decoration-field-border underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent"
          >
            {org}
          </a>
        ) : (
          org
        )}
        {start ? (
          <>
            <span aria-hidden="true"> · </span>
            {end ? `${start} – ${end}` : start}
          </>
        ) : null}
      </p>

      <p className="m-0 pt-1 text-[15px] text-text-soft leading-[1.7]">
        {summary}
      </p>
    </article>
  );
}

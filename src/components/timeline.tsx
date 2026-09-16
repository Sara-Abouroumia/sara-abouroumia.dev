import type { ReactNode } from "react";
import { ExpandableBullets } from "@/components/expandable-bullets";
import { OrgLogo } from "@/components/org-logo";
import type { Company } from "@/content/experience";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** Parses the "Jun. 2024" / "May 2023" / "Present" forms used in content/. */
function parseMonth(value: string): Date | null {
  if (/^present$/i.test(value.trim())) return new Date();
  const match = value
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\.?\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].slice(0, 3));
  if (month < 0) return null;
  return new Date(Number(match[2]), month, 1);
}

/**
 * "1 yr 4 mos", the way LinkedIn counts it, inclusive of both end months, so
 * Jun 2024 to Jun 2024 is 1 mo rather than 0.
 *
 * Note this resolves at build time for anything still "Present", so the figure
 * ages until the next deploy. Acceptable for a page that redeploys on edit;
 * worth revisiting if the site ever goes a year without a build.
 */
export function formatDuration(start: string, end: string): string | null {
  const from = parseMonth(start);
  const to = parseMonth(end);
  if (!from || !to) return null;

  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1;
  if (months <= 0) return null;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest > 0) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);
  return parts.join(" ");
}

/** Total tenure across every position held at one company. */
function companyTenure(company: Company): string | null {
  const starts = company.positions.map((p) => p.start);
  const ends = company.positions.map((p) => p.end);
  // Positions are listed newest first, so the span runs from the last start
  // to the first end.
  return formatDuration(
    starts[starts.length - 1],
    ends.includes("Present") ? "Present" : ends[0],
  );
}

/**
 * One row of the rail: a marker, a connector line down to the next row, and the
 * content beside it.
 *
 * The connector is flex-1 inside a flex column, so it stretches to whatever
 * height the row's content happens to be, no fixed heights, and no absolutely
 * positioned rule behind the list that has to be kept in sync.
 */
function Row({
  marker,
  connector,
  gap,
  pad = "",
  className = "",
  children,
}: {
  marker: ReactNode;
  connector: boolean;
  gap: string;
  pad?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={`flex ${gap} ${className}`}>
      <div className="flex flex-col items-center">
        {marker}
        {connector ? (
          <span aria-hidden="true" className="mt-2 w-px flex-1 bg-border" />
        ) : null}
      </div>
      <div className={`min-w-0 flex-1 ${pad}`}>{children}</div>
    </li>
  );
}

/**
 * Space between top-level entries, no rule and no connector.
 *
 * A rule made two employers read as separate sections of the page, and the
 * connector rail is reserved for positions *within* one employer, where the
 * line actually means continuity. Whitespace alone separates them.
 */
const ENTRY_GAP = "mt-8";

function DateLine({
  start,
  end,
  className = "",
}: {
  start: string;
  end: string;
  className?: string;
}) {
  const duration = formatDuration(start, end);
  return (
    <p className={`text-muted text-sm ${className}`}>
      {start} – {end}
      {duration ? ` · ${duration}` : ""}
    </p>
  );
}

/**
 * Experience as LinkedIn lays it out: a logo rail, and companies with more than
 * one position nested beneath a single company header so a transition from
 * intern to staff reads as one continuous tenure.
 */
export function ExperienceTimeline({
  companies,
  maxBullets,
}: {
  companies: Company[];
  /** Bullets shown before the "…more" toggle. Omit to show all. */
  maxBullets?: number;
}) {
  return (
    <ol className="m-0 list-none p-0">
      {companies.map((company, i) => {
        const entryGap = i > 0 ? ENTRY_GAP : "";
        const grouped = company.positions.length > 1;

        if (!grouped) {
          const role = company.positions[0];
          return (
            <Row
              key={company.org}
              gap="gap-4"
              className={entryGap}
              connector={false}
              marker={
                <OrgLogo src={company.logo} name={company.org} size={40} />
              }
            >
              <h3 className="font-semibold text-base leading-snug">
                {role.title}
              </h3>
              <p className="text-[15px] text-text-soft leading-snug">
                {company.org}
                {role.employmentType ? ` · ${role.employmentType}` : ""}
              </p>
              <DateLine start={role.start} end={role.end} className="mt-0.5" />
              {(role.location ?? company.location) ? (
                <p className="text-muted text-sm">
                  {role.location ?? company.location}
                </p>
              ) : null}
              <div className="mt-3">
                <ExpandableBullets bullets={role.bullets} max={maxBullets} />
              </div>
            </Row>
          );
        }

        const tenure = companyTenure(company);
        return (
          <Row
            key={company.org}
            gap="gap-4"
            className={entryGap}
            connector={false}
            marker={<OrgLogo src={company.logo} name={company.org} size={40} />}
          >
            <h3 className="font-semibold text-base leading-snug">
              {company.org}
            </h3>
            {tenure ? <p className="text-muted text-sm">{tenure}</p> : null}
            {company.location ? (
              <p className="text-muted text-sm">{company.location}</p>
            ) : null}

            <ol className="mt-4 m-0 list-none p-0">
              {company.positions.map((role, j) => (
                <Row
                  key={role.title}
                  gap="gap-3"
                  pad={j === company.positions.length - 1 ? "" : "pb-6"}
                  connector={j < company.positions.length - 1}
                  marker={
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-light"
                    />
                  }
                >
                  <h4 className="font-semibold text-[15px] leading-snug">
                    {role.title}
                  </h4>
                  {role.employmentType ? (
                    <p className="text-[15px] text-text-soft leading-snug">
                      {role.employmentType}
                    </p>
                  ) : null}
                  <DateLine
                    start={role.start}
                    end={role.end}
                    className="mt-0.5"
                  />
                  {role.location ? (
                    <p className="text-muted text-sm">{role.location}</p>
                  ) : null}
                  <div className="mt-2.5">
                    <ExpandableBullets
                      bullets={role.bullets}
                      max={maxBullets}
                    />
                  </div>
                </Row>
              ))}
            </ol>
          </Row>
        );
      })}
    </ol>
  );
}

export type TimelineEntry = {
  key: string;
  title: string;
  org: string;
  logo?: string;
  start: string;
  end: string;
  meta?: string;
  children: ReactNode;
};

/** The flat variant, for lists that never group (service, awards, and so on). */
export function Timeline({
  entries,
  logoSize = 40,
}: {
  entries: TimelineEntry[];
  logoSize?: number;
}) {
  return (
    <ol className="m-0 list-none p-0">
      {entries.map((entry, i) => {
        return (
          <Row
            key={entry.key}
            gap="gap-4"
            className={i > 0 ? ENTRY_GAP : ""}
            connector={false}
            marker={
              <OrgLogo src={entry.logo} name={entry.org} size={logoSize} />
            }
          >
            <h3 className="font-semibold text-base leading-snug">
              {entry.title}
            </h3>
            <p className="text-[15px] text-text-soft leading-snug">
              {entry.org}
            </p>
            <DateLine start={entry.start} end={entry.end} className="mt-0.5" />
            {entry.meta ? (
              <p className="text-muted text-sm">{entry.meta}</p>
            ) : null}
            <div className="mt-3">{entry.children}</div>
          </Row>
        );
      })}
    </ol>
  );
}

/**
 * "Sep. 2026" from "2026-09" — the month form the site uses everywhere
 * (experience and education dates, the Now panel, the footer stamp).
 *
 * Stored as ISO year-month so it can go in a <time dateTime> unchanged, and
 * formatted here so the display convention lives in one place. The period is
 * the convention's one quirk: abbreviated months take it, May does not, since
 * May is not an abbreviation.
 */
const MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

export function formatMonth(isoYearMonth: string) {
  const [year, month] = isoYearMonth.split("-").map(Number);
  const name = MONTHS[month - 1];
  if (!name || !year)
    throw new Error(`Expected YYYY-MM, got "${isoYearMonth}"`);
  return `${name} ${year}`;
}

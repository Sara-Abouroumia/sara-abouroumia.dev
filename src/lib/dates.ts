/**
 * "Sep. 2026" from "2026-09", the month form the site uses everywhere
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

/**
 * "23 Sep. 2026" from "2026-09-23", for a post's byline.
 *
 * Posts need the day where everything else on the site needs only the month,
 * so this is a second formatter rather than a parameter on the first: the two
 * take different input shapes and neither should accept the other's.
 */
export function formatDay(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const name = MONTHS[month - 1];
  if (!name || !year || !day)
    throw new Error(`Expected YYYY-MM-DD, got "${isoDate}"`);
  return `${day} ${name} ${year}`;
}

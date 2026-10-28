import { OrgLogo } from "@/components/org-logo";
import { education } from "@/content/education";
import { companies } from "@/content/experience";

/**
 * Current company and school, the way LinkedIn surfaces them on a profile:
 * stacked at the opposite end of the header from the name, dropping onto its
 * own line once the row runs out of width.
 *
 * Derived from the experience and education lists rather than restated, so the
 * "Present" entry is the single source of truth, ending a role in one place
 * removes it from here too.
 */
export function CurrentAffiliations({
  className = "",
}: {
  className?: string;
}) {
  const employer = companies.find((c) =>
    c.positions.some((p) => p.end === "Present"),
  );
  const job = employer?.positions.find((p) => p.end === "Present");
  const study = education.find((e) => e.end === "Present");

  // The current role and the current degree can be at the same place (a
  // research post at the university you study at). One row then, not the
  // same logo and name twice.
  const sameOrg = employer?.org === study?.institution;

  // Ternaries, not `&&`: a failed `&&` evaluates to `false`, which the filter
  // below (looking for undefined) would let through to the render.
  const items = [
    employer && job && !sameOrg
      ? {
          key: "job",
          org: employer.org,
          detail: job.title,
          logo: employer.logo,
        }
      : undefined,
    study
      ? {
          key: "study",
          org: study.institution,
          detail: study.degree,
          logo: study.logo,
        }
      : undefined,
  ].filter((item) => item !== undefined);

  if (items.length === 0) return null;

  return (
    <ul className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((item) => (
        // Below md, the logo alone, as a badge beside the name: the full
        // name takes a whole row of a phone's header to state one fact. The
        // name is hidden visually only (max-md:sr-only), so a screen reader
        // still hears it, and title gives sighted readers a tooltip.
        <li
          key={item.key}
          title={item.org}
          className="flex items-center gap-2.5"
        >
          <OrgLogo src={item.logo} name={item.org} />
          <span className="font-semibold text-sm leading-snug max-md:sr-only">
            {item.org}
            <span className="sr-only">, {item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

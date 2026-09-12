import { OrgLogo } from "@/components/org-logo";
import { education } from "@/content/education";
import { companies } from "@/content/experience";

/**
 * Current company and school, the way LinkedIn surfaces them on a profile:
 * stacked at the opposite end of the header from the name, dropping onto its
 * own line once the row runs out of width.
 *
 * Derived from the experience and education lists rather than restated, so the
 * "Present" entry is the single source of truth — ending a role in one place
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

  const items = [
    employer &&
      job && {
        key: "job",
        org: employer.org,
        detail: job.title,
        logo: employer.logo,
      },
    study && {
      key: "study",
      org: study.institution,
      detail: study.degree,
      logo: study.logo,
    },
  ].filter((item) => item !== undefined);

  if (items.length === 0) return null;

  return (
    <ul className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2.5">
          <OrgLogo src={item.logo} name={item.org} />
          <span className="font-semibold text-sm leading-snug">
            {item.org}
            <span className="sr-only"> — {item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

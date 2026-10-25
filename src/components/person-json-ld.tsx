import { education } from "@/content/education";
import { companies } from "@/content/experience";
import { site } from "@/content/site";
import { allSkills } from "@/content/skills";
import { SITE_DESCRIPTION } from "@/lib/metadata";

/** A date field reading "Present" is what marks a row as still running. */
const CURRENT = "Present";

/**
 * schema.org Person, emitted on the home page.
 *
 * Why it earns its place on a site this small: the domain is a name, and a
 * search engine has no way to know that sara-abouroumia.dev, the LinkedIn
 * profile and the GitHub account are one person rather than three. `sameAs` is
 * the statement that joins them, which is what lets the three consolidate into
 * a single entity instead of competing.
 *
 * Every field is derived from the content modules rather than written out
 * again here. Structured data that disagrees with the page it describes is
 * worse than none: it is the machine-readable copy that nobody proofreads, so
 * the only safe version is one that cannot drift.
 *
 * Rendered as a plain <script>, not next/script, per Next's guide: this is
 * data, not code to schedule.
 */
export function PersonJsonLd() {
  // "İstanbul, Türkiye" -> locality, and the country is spelled out in the
  // same string. addressCountry wants the ISO 3166-1 code, which is not
  // derivable from a display name, so it is stated.
  const [locality] = site.location.split(",");

  const current = companies.find((c) =>
    c.positions.some((p) => p.end === CURRENT),
  );

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description: SITE_DESCRIPTION,
    email: `mailto:${site.email}`,
    // Absolute: a relative path in JSON-LD has no base to resolve against,
    // unlike the metadata object, which Next resolves via metadataBase.
    ...(site.avatar ? { image: `${site.url}${site.avatar}` } : {}),
    // The whole point of the block.
    sameAs: [site.linkedin, site.github],
    address: {
      "@type": "PostalAddress",
      addressLocality: locality?.trim(),
      addressCountry: "TR",
    },
    ...(current
      ? { worksFor: { "@type": "Organization", name: current.org } }
      : {}),
    // Finished degrees are alumniOf; one still in progress is an affiliation,
    // which is the distinction schema.org actually draws.
    alumniOf: education
      .filter((e) => e.end !== CURRENT)
      .map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
    affiliation: education
      .filter((e) => e.end === CURRENT)
      .map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
    knowsAbout: allSkills.map((s) => s.name),
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD has to be the raw text content of the script tag, and JSX
      // would escape it. The payload is machine-generated from typed modules,
      // and HTML-escaped on the line below.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
      dangerouslySetInnerHTML={{
        // JSON.stringify does not escape HTML, so a "<" reaching this from a
        // content module could close the script tag early and turn data into
        // markup. Everything here is ours today; this keeps that from becoming
        // load-bearing. Per Next's JSON-LD guide.
        __html: JSON.stringify(person).replace(/</g, "\\u003c"),
      }}
    />
  );
}

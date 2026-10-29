import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/brand-icons";
import { CurrentAffiliations } from "@/components/current-affiliations";
import { ExpandableBullets } from "@/components/expandable-bullets";
import { ExpandableProse } from "@/components/expandable-prose";
import { NowPanel } from "@/components/now-panel";
import { OrgLogo } from "@/components/org-logo";
import { PersonJsonLd } from "@/components/person-json-ld";
import { PinIcon } from "@/components/pin-icon";
import { ReferencesFocused } from "@/components/references-focused";
import { ResumePreview } from "@/components/resume-preview";
import { PROSE, Section } from "@/components/section";
import { SectionBar } from "@/components/section-bar";
import { SectionNav } from "@/components/section-nav";
// import { ServiceFrontPage } from "@/components/service-front-page";
import { SkillsMarquee } from "@/components/skills-marquee";
import { ExperienceTimeline } from "@/components/timeline";
import { WorldReadersGlobe } from "@/components/world-readers-globe";
import { BIO_LINES, bio } from "@/content/about";
import { education } from "@/content/education";
import { companies } from "@/content/experience";
import { references } from "@/content/references";
// import { service, serviceIntro } from "@/content/experience";
import { site } from "@/content/site";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/metadata";
import { getCountryVisits } from "@/lib/visits";

export const metadata: Metadata = pageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
});

/**
 * Rebuild this page in the background at most once a day, for the visitor
 * map's counts. Between rebuilds it is served as static HTML, so no visitor
 * ever waits on the database (see getCountryVisits). A literal, not 60 * 60
 * * 24: Next reads this value without running the file, so it must be
 * statically analyzable.
 */
export const revalidate = 86400;

const QUICK_LINK =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] border px-3.5 py-1.5 text-sm no-underline transition-colors";

/**
 * Resume is not a third party, so it keeps the site's own accent hover. It is
 * also a split chip, so the padding lives on its two inner buttons instead,
 * the divider has to run the full height between them.
 */
const RESUME_CHIP =
  "inline-flex items-center whitespace-nowrap rounded-[3px] border border-border text-sm text-text-soft transition-colors hover:border-accent";

/**
 * Solid brand fills. Each brand carries its own foreground token because they
 * do not agree in dark mode: email and linkedin stay saturated with white on
 * top, while GitHub's monochrome mark inverts to a light fill with dark text.
 */
const BRAND_LINK = {
  email: `${QUICK_LINK} border-transparent bg-brand-email text-brand-email-fg hover:bg-brand-email-hover`,
  linkedin: `${QUICK_LINK} border-transparent bg-brand-linkedin text-brand-linkedin-fg hover:bg-brand-linkedin-hover`,
  github: `${QUICK_LINK} border-transparent bg-brand-github text-brand-github-fg hover:bg-brand-github-hover`,
};

/**
 * Sections listed in the "on this page" rail, in page order.
 *
 * Adding one (Certificates, say) means adding it here and rendering a
 * <Section> with the identical title. The anchor is derived from the title by
 * sectionId(), so the two cannot fall out of step.
 */
const SECTIONS = [
  "Experience",
  "Education",
  "Skills",
  // Only while there is something in it, so the nav never points at a
  // section that is not rendered (see the References section below).
  ...(references.length ? ["References"] : []),
  // "Leadership & Service",
];

export default async function Home() {
  const visits = await getCountryVisits();

  return (
    <div className="relative">
      {/* Structured data, not UI: it renders a <script> and nothing visible.
          Lives on this page rather than the root layout because it describes
          Sara, and the home page is the one page that is about her. */}
      <PersonJsonLd />

      <SectionNav
        titles={SECTIONS}
        aside={
          visits.length > 0 ? (
            <WorldReadersGlobe visits={visits} className="w-[132px]" />
          ) : null
        }
      />
      {/* The name block takes the slack (flex-1), so the affiliations settle
          against the far edge without an ms-auto. Below md they claim a full
          row and wrap under the header instead of squeezing the name. */}
      <div className="relative mb-7 flex flex-wrap items-center gap-5">
        <Avatar />
        <div className="min-w-0 flex-1">
          {/* The greeting, kept out of the bio on purpose: the bio's first
              line is the most-read sentence on the site and has a job to do.
              A <p>, not part of the <h1>, so the heading stays the name alone
              for the document outline and for search. The hand is
              aria-hidden, or a screen reader announces "waving hand". */}
          <p className="mb-1 font-serif text-[17px] text-muted italic">
            {/* <span aria-hidden="true" className="wave not-italic">
              👋
            </span>{" "} */}
            Welcome, I&apos;m
          </p>
          {/* 27px under 360px wide: there the column beside the photo is
              164px, and "Abouroumia", one unbreakable word, is 197px at 34px,
              so it ran off the screen. At 27px it is ~157px and fits. */}
          <h1 className="font-serif text-[34px] font-semibold leading-[1.15] max-[359px]:text-[27px]">
            {site.name}
          </h1>
          {/* Two facts at two weights, in order of importance: the role is
              the positioning, so it leads in --text-soft at medium weight;
              the location is metadata, so it steps back a size and a shade
              behind a pin, the way profile pages mark it. One flat grey line
              gave both the same voice.

              items-baseline lines the two texts up on their baselines despite
              the size difference (centring sat the smaller one high). The
              pin opts out with self-center, so the location's own baseline
              is what the row aligns to. Wraps to two lines on a phone. */}
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-medium text-base text-text-soft">
              {site.role}
            </span>
            <span className="inline-flex items-baseline gap-1.5 text-[15px] text-muted">
              <PinIcon className="h-[15px] w-[15px] self-center" />
              {site.location}
            </span>
          </p>
        </div>
        {/* Below md the affiliation is a logo badge in the top-right corner,
            level with the greeting. Absolutely positioned, so it sits in the
            empty space beside "Welcome, I'm" and takes no width from the name
            and headline (as a flex item it squeezed them into extra lines).
            md and up: logo and name in the row, as before. */}
        <CurrentAffiliations className="max-md:absolute max-md:top-0 max-md:right-0 md:max-w-[230px]" />
      </div>

      <div className="mb-7 flex flex-wrap gap-2.5">
        <a href={`mailto:${site.email}`} className={BRAND_LINK.email}>
          <MailIcon />
          Email
        </a>
        <a
          href={site.linkedin}
          target="_blank"
          rel="noopener"
          className={BRAND_LINK.linkedin}
        >
          <LinkedInIcon />
          LinkedIn
        </a>
        <a
          href={site.github}
          target="_blank"
          rel="noopener"
          className={BRAND_LINK.github}
        >
          <GitHubIcon />
          GitHub
        </a>
        <ResumePreview className={RESUME_CHIP} />
      </div>

      {/* Both of these use PROSE rather than a width of their own, so every
          run of body text on the page shares one right edge. The 620 the bio
          used to carry predates the 880 column and left it ending 212px short
          of the rule above it. */}
      <ExpandableProse
        paragraphs={bio}
        lines={BIO_LINES}
        className={`${PROSE} mb-5`}
      />

      <NowPanel />

      {/* Below xl the right rail does not exist, so the globe closes the
          introduction instead: after the Now panel, before the page
          navigator, centred. Here it reads as the end of "who and what",
          without crowding the header. */}
      {visits.length > 0 ? (
        <div className="mt-8 flex justify-center xl:hidden">
          <WorldReadersGlobe visits={visits} className="w-[140px]" />
        </div>
      ) : null}

      {/* Sits here on purpose: below the fold while the intro is read, pinned
          from the first section onward. See <SectionBar />. */}
      <SectionBar titles={SECTIONS} />

      {/* Three lines, then an inline "… more". Nothing is truncated away:
          every bullet is in the DOM and only clipped, so the full text is in
          the page source for search and for print. The cap is a scanning
          affordance, not a second page. */}
      {/* Below xl the bar above draws this section's break (its bottom
          border is the rule), so the section's own top rule and margin step
          aside there; a second rule 28px under the first read as a double
          line. At xl the bar is hidden and the rule is the section's again. */}
      <Section
        title="Experience"
        className="mt-7 max-xl:mt-0 max-xl:border-t-0"
      >
        <ExperienceTimeline companies={companies} maxLines={3} />
      </Section>

      {/* Same logo rail as Experience, so the two sections read as one system.
          No connector between them: they are separate institutions. */}
      <Section title="Education">
        <ol className="m-0 list-none p-0">
          {education.map((e, i) => (
            <li
              key={e.institution}
              className={`flex gap-4 ${i > 0 ? "mt-6" : ""}`}
            >
              <OrgLogo src={e.logo} name={e.institution} size={40} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base leading-snug">
                  {e.institution}
                </h3>
                <p className="text-[15px] text-text-soft leading-snug">
                  {e.degree}
                  {e.honors ? `, ${e.honors}` : ""}
                  {e.gpa ? ` (GPA ${e.gpa})` : ""}
                </p>
                <p className="mt-0.5 text-muted text-sm">
                  {e.start} – {e.end} · {e.location}
                </p>
                {/* Same spacing and list style as an experience entry, so a
                    degree with details reads like a role with bullets. */}
                {e.details?.length ? (
                  <div className="mt-3">
                    <ExpandableBullets bullets={e.details} />
                  </div>
                ) : null}
                {/* One line, comma-separated, rather than more bullets: a
                    course name is a keyword to scan for, not a sentence to
                    read, and six of them as bullets would outweigh the
                    degree they belong to. */}
                {e.coursework?.length ? (
                  <p
                    className={`${PROSE} mt-2 text-[15px] text-text-soft leading-[1.65]`}
                  >
                    <span className="font-semibold text-text">
                      Relevant coursework:
                    </span>{" "}
                    {e.coursework.join(", ")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Skills">
        <SkillsMarquee />
      </Section>

      {/* Last, as the page's closing word: after what Sara has done, what the
          people she did it with say. The section and its nav entry are
          driven by the one list of references, so with none it disappears
          rather than showing an empty heading. */}
      {references.length ? (
        <Section title="References">
          <ReferencesFocused references={references} />
        </Section>
      ) : null}

      {/* Leadership & Service is parked, not deleted. It was the largest
          section on the page, about 29% of it on desktop and 33% on a phone,
          which put more weight on volunteering than on Experience, and its
          space went to References instead (Certifications may follow).

          Everything it needs is still here: <ServiceFrontPage /> in
          components, `service` and `serviceIntro` in content/experience.ts.
          To bring it back, uncomment the two imports at the top of this file,
          the "Leadership & Service" entry in SECTIONS, and the line below.

          <ServiceFrontPage entries={service} intro={serviceIntro} /> */}
    </div>
  );
}

import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/brand-icons";
import { CurrentAffiliations } from "@/components/current-affiliations";
import { NowPanel } from "@/components/now-panel";
import { OrgLogo } from "@/components/org-logo";
import { ResumePreview } from "@/components/resume-preview";
import { PROSE, Section } from "@/components/section";
import { SectionBar } from "@/components/section-bar";
import { SectionNav } from "@/components/section-nav";
import { SkillsMarquee } from "@/components/skills-marquee";
import { ExperienceTimeline, Timeline } from "@/components/timeline";
import { bio } from "@/content/about";
import { education } from "@/content/education";
import { companies, service } from "@/content/experience";
import { site } from "@/content/site";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
});

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
  "Leadership & Service",
] as const;

export default function Home() {
  return (
    <div className="relative">
      <SectionNav titles={SECTIONS} />
      {/* Header. The visitor map slots in behind this in Phase 3. */}
      {/* The name block takes the slack (flex-1), so the affiliations settle
          against the far edge without an ms-auto. Below md they claim a full
          row and wrap under the header instead of squeezing the name. */}
      <div className="mb-7 flex flex-wrap items-center gap-5">
        <Avatar />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[34px] font-semibold leading-[1.15]">
            {site.name}
          </h1>
          <p className="mt-2 text-base text-muted">
            {site.role} · {site.location}
          </p>
        </div>
        <CurrentAffiliations className="w-full md:w-auto md:max-w-[230px]" />
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
      <p className={`${PROSE} mb-5 text-[17px] leading-[1.7]`}>{bio}</p>

      <NowPanel />

      {/* Sits here on purpose: below the fold while the intro is read, pinned
          from the first section onward. See <SectionBar />. */}
      <SectionBar titles={SECTIONS} />

      {/* Two bullets, then "…more (n)". Nothing is truncated away:
          ExpandableBullets renders every bullet into the DOM and hides the
          overflow, so the full text is in the page source for search and for
          print. The cap is a scanning affordance, not a second page. */}
      <Section title="Experience" className="mt-7">
        <ExperienceTimeline companies={companies} maxBullets={2} />
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
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Skills">
        <SkillsMarquee />
      </Section>

      {/* Smaller marks than the roles above: these are monogram fallbacks with
          no real logos behind them, and at 40px they would carry more visual
          weight than the paid roles do. */}
      <Section title="Leadership & Service">
        <Timeline
          logoSize={30}
          entries={service.map((s) => ({
            key: `${s.org}-${s.start}`,
            title: s.title,
            org: s.org,
            start: s.start,
            end: s.end,
            children: (
              <p
                className={`${PROSE} text-[15px] text-text-soft leading-relaxed`}
              >
                {s.summary}
              </p>
            ),
          }))}
        />
      </Section>
    </div>
  );
}

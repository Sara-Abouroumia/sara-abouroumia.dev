import { Avatar } from "@/components/avatar";
import { Section } from "@/components/section";
import { bio, now } from "@/content/about";
import { education } from "@/content/education";
import { site } from "@/content/site";
import { skillGroups } from "@/content/skills";

const QUICK_LINK =
  "whitespace-nowrap rounded-[3px] border border-border px-3.5 py-1.5 text-sm text-text-soft no-underline hover:border-accent hover:text-accent";

export default function Home() {
  return (
    <div>
      {/* Header. The visitor map slots in behind this in Phase 3. */}
      <div className="mb-7 flex flex-wrap items-center gap-5">
        <Avatar />
        <div className="min-w-0">
          <h1 className="font-serif text-[34px] font-semibold leading-[1.15]">
            {site.name}
          </h1>
          <p className="mt-2 text-base text-muted">
            {site.role} · {site.location}
          </p>
        </div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2.5">
        <a href={`mailto:${site.email}`} className={QUICK_LINK}>
          Email
        </a>
        <a
          href={site.linkedin}
          target="_blank"
          rel="noopener"
          className={QUICK_LINK}
        >
          LinkedIn
        </a>
        <a
          href={site.resume}
          target="_blank"
          rel="noopener"
          className={QUICK_LINK}
        >
          Download Resume
        </a>
      </div>

      <p className="mb-5 max-w-[620px] text-[17px] leading-[1.7]">{bio}</p>

      <div className="flex items-baseline gap-2.5 rounded-[3px] bg-panel px-4 py-3.5">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.04em] text-muted">
          Now
        </span>
        <span className="text-[15px] leading-normal text-text-soft">{now}</span>
      </div>

      <Section title="Education">
        {education.map((e) => (
          <div key={e.institution}>
            <p className="mb-0.5 text-base leading-relaxed">
              <strong className="font-semibold">{e.institution}</strong> —{" "}
              {e.degree}
              {e.honors ? `, ${e.honors}` : ""}
              {e.gpa ? ` (GPA ${e.gpa})` : ""}
            </p>
            <p className="text-[15px] text-muted">
              {e.start} – {e.end} · {e.location}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        <p className="text-[15px] leading-[1.8] text-text-soft">
          {skillGroups.map((group, i) => (
            <span key={group.label}>
              {i > 0 ? " · " : ""}
              {group.items.join(", ")}
            </span>
          ))}
        </p>
      </Section>
    </div>
  );
}

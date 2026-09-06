import type { Metadata } from "next";
import { EntryHeading, PageTitle, Section } from "@/components/section";
import { roles, service } from "@/content/experience";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Software engineering roles at Nextarp and Mazaka Yazilim, plus university leadership and volunteering.",
};

export default function ExperiencePage() {
  return (
    <div>
      <PageTitle>Experience</PageTitle>

      {roles.map((role) => (
        <div key={`${role.org}-${role.start}`} className="mb-9">
          <EntryHeading
            title={`${role.title} — ${role.org}`}
            meta={`${role.start} – ${role.end}`}
          />
          <p className="mb-3 text-sm text-muted">{role.location}</p>
          <ul className="list-disc pl-5 text-base leading-[1.7] text-text-soft">
            {role.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ))}

      <Section title="Leadership & Service" className="mt-10">
        {service.map((s, i) => (
          <div
            key={`${s.org}-${s.start}`}
            className={i < service.length - 1 ? "mb-[18px]" : ""}
          >
            <EntryHeading
              title={`${s.title} — ${s.org}`}
              meta={`${s.start} – ${s.end}`}
              size="text-base"
            />
            <p className="mt-1.5 text-[15px] leading-relaxed text-text-soft">
              {s.summary}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}

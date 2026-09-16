import type { Metadata } from "next";
import { PageTitle, PROSE } from "@/components/section";
import { projects } from "@/content/projects";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Things Sara Abouroumia has designed, built and shipped end to end.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <div>
      <PageTitle>Projects</PageTitle>

      <ol className="m-0 list-none p-0">
        {projects.map((p, i) => (
          <li
            key={p.name}
            // A rule between entries, never after the last one: a trailing
            // border reads as a section that lost its content.
            className={
              i < projects.length - 1
                ? "border-border border-b pb-6"
                : undefined
            }
          >
            {/* Title and link share a baseline and wrap independently. Unlike
                the role rows, this one is safe as a space-between: both sides
                are short enough that neither wraps before the row does. */}
            <div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-semibold text-[19px] leading-tight">
                {p.name}
              </h2>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="text-accent text-sm hover:text-accent-hover"
                >
                  {p.urlLabel ?? new URL(p.url).host}
                </a>
              ) : null}
            </div>

            <p className="mt-1.5 mb-3 text-muted text-sm">
              {p.stack.join(" · ")}
              {p.period ? ` · ${p.period}` : ""}
            </p>

            <ul
              className={`${PROSE} list-disc space-y-1.5 pl-5 text-[15px] text-text-soft leading-[1.65]`}
            >
              {p.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

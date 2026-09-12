import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { now } from "@/content/about";
import { footerPages, site } from "@/content/site";
import { formatMonth } from "@/lib/dates";

const ICON_LINK =
  "flex h-[34px] w-[34px] items-center justify-center rounded border border-border bg-bg text-[13px] text-muted no-underline hover:border-accent hover:text-accent";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-panel">
      <div className="mx-auto grid max-w-[880px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 px-6 pt-11 pb-5">
        <div>
          <div className="mb-1.5 font-serif text-[17px] font-semibold text-text">
            {site.name}
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {site.role}
            <br />
            {site.location}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-light">
            Pages
          </span>
          {footerPages.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted no-underline hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-start gap-2.5">
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-light">
            Elsewhere
          </span>
          <div className="flex gap-2">
            <a href={`mailto:${site.email}`} className={ICON_LINK}>
              <span className="sr-only">Email {site.name}</span>
              <svg
                width="15"
                height="11"
                viewBox="0 0 24 18"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="22"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M2 2 L12 11 L22 2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
              </svg>
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener"
              className={`${ICON_LINK} font-bold`}
            >
              <span className="sr-only">LinkedIn profile</span>
              <span aria-hidden="true">in</span>
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noopener"
              className={ICON_LINK}
            >
              <span className="sr-only">GitHub profile</span>
              <GitHubIcon />
            </a>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener"
              className={ICON_LINK}
            >
              <span className="sr-only">Download CV (PDF)</span>
              <span aria-hidden="true">CV</span>
            </a>
          </div>
          <a
            href={`mailto:${site.email}`}
            className="text-sm text-muted no-underline hover:text-accent"
          >
            {site.email}
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[880px] flex-wrap justify-between gap-4 border-t border-border px-6 pt-4 pb-7 text-xs text-muted-light">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span className="flex items-center gap-3.5">
          {/* The same value the Now panel stamps itself with. Two hand-typed
              dates on one page is precisely the drift a timestamp exists to
              prevent, and on a personal site the Now note is the site update. */}
          <span>
            Last updated{" "}
            <time dateTime={now.updated}>{formatMonth(now.updated)}</time>
          </span>
        </span>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { footerPages, site } from "@/content/site";

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
            <a href={`mailto:${site.email}`} aria-label="Email" className={ICON_LINK}>
              <svg width="15" height="11" viewBox="0 0 24 18" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M2 2 L12 11 L22 2" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
              className={`${ICON_LINK} font-bold`}
            >
              in
            </a>
            <a href={site.resume} target="_blank" rel="noopener" aria-label="Resume" className={ICON_LINK}>
              CV
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
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span className="flex items-center gap-3.5">
          <span>Last updated September 2026</span>
        </span>
      </div>
    </footer>
  );
}

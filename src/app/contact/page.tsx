import type { Metadata } from "next";
import { PageTitle } from "@/components/section";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

const INLINE_LINK =
  "text-text underline decoration-field-border underline-offset-[3px] hover:text-accent hover:decoration-accent";

export default function ContactPage() {
  return (
    /**
     * Two columns from the `menu` breakpoint, the width at which the header
     * shows its full nav, so the page and the chrome change shape together.
     * The form column is the wider of the two (1 : 1.15) so the three topic
     * chips fit on one line: they need about 405px and an even split would
     * leave 388px, wrapping "Question" onto a row of its own.
     * minmax(0, …) lets a column shrink
     * below its content's natural width instead of pushing the grid wider
     * than the page, which is the usual cause of a stray horizontal scrollbar.
     */
    <div className="grid gap-10 menu:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] menu:gap-14">
      {/* Uncapped, unlike the form. Prose and a text field want different
          widths for different reasons: a field should hint at how much goes
          in it, while a paragraph only has to stay readable, and the 880
          column it sits in is already the measure the rest of the site
          reads at. In one column this runs the full width above a form that
          stops at 420. */}
      <div className="flex flex-col gap-6">
        <div>
          <PageTitle tight>Contact</PageTitle>
          {/* text-pretty keeps the last line from ending up a single short
              word. Without it this paragraph left "inbox." alone on line four. */}
          <p className="m-0 text-pretty text-[16px] text-text-soft leading-[1.7]">
            Have a role in mind, something you want to build together, or a
            question about a project on this site? Send me a note. It lands
            straight in my inbox.
          </p>
        </div>

        {/* text-pretty, not text-balance. Balance evens the two lines, which
            suits a heading but leaves body copy filling barely half the first
            line before wrapping. Pretty fills the line normally and only steps
            in to stop the last one being a single stranded word: 83% of the
            first line here against balance's 52%, and still no lone "GitHub.". */}
        <p className="m-0 text-pretty text-[14px] text-muted leading-[1.7]">
          Rather skip the form? Find me on{" "}
          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener"
            className={INLINE_LINK}
          >
            LinkedIn
          </a>{" "}
          and{" "}
          <a
            href={site.github}
            target="_blank"
            rel="noopener"
            className={INLINE_LINK}
          >
            GitHub
          </a>
          .
        </p>

        {/* Where and when: two 14px rows 8px apart, each led by a 16px mark.
            Read as one block of detail rather than two statements, so they
            sit closer to each other than to the paragraph above.

            items-start keeps a mark on the first line when the text wraps on
            a narrow phone, where centring would float it between the two. */}
        <div className="flex flex-col gap-2 text-[14px] leading-[22px]">
          <p className="m-0 flex items-start gap-2.5 text-text-soft">
            <PinIcon />
            {site.location} ({site.timezone})
          </p>
          <p className="m-0 flex items-start gap-2.5 text-text-soft">
            <ClockIcon />
            Expect a reply within two business days.
          </p>
        </div>
      </div>

      {/* No top offset: the title's 45px line box and the label's 21px one
          both start at the row's top edge, which puts the cap of "Contact"
          and the cap of "What is this about?" within a pixel of each other.

          The cap matters between 640 and 941px, where the page is one column
          and the form would otherwise run the full 832px: a name field half a
          metre wide invites nothing, and the eye has to travel the whole width
          to get from a label to the end of its box.

          420 rather than a rounder number because that is what the grid track
          measures at 941 (415px). A larger cap made the form *narrower* as the
          window grew past the breakpoint, which is the one reflow a visitor
          actually notices while resizing. Now the width barely moves. */}
      <div className="max-w-[420px]">
        <ContactForm />
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      /* A 16px mark on a 22px line: 3px down centres it on the first. */
      className="mt-[3px] shrink-0 text-muted"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-[3px] shrink-0 text-muted"
    >
      <path
        d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

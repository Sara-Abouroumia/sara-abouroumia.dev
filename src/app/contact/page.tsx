import type { Metadata } from "next";
import { PageTitle, PROSE } from "@/components/section";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div>
      <PageTitle>Contact</PageTitle>

      <p className={`${PROSE} mb-7 text-[16px] text-text-soft leading-[1.7]`}>
        Work, collaboration, or a question about something on this site. The
        form reaches my inbox directly, and my email and LinkedIn are in the
        footer if you would rather use those.
      </p>

      {/* The design's 440px cap, kept: a form is scanned field by field, and a
          wider input makes the whole column feel like a survey. */}
      <div className="max-w-[440px]">
        <ContactForm />
      </div>
    </div>
  );
}

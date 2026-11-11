import { LinkedInIcon } from "@/components/brand-icons";
import type { Reference } from "@/content/references";

/**
 * A name that is a link to the person's own LinkedIn profile, with the
 * LinkedIn mark beside it, in LinkedIn's blue (#0a66c2), so it can be seen
 * to be one: a name alone in plain text did not say it could be clicked.
 *
 * The mark is always shown on a phone or a touch screen, where there is no
 * hover to reveal it; from md, on a device that can hover, it appears when
 * the name is hovered or focused (the .profile-link and .profile-mark rule
 * in globals.css). On the dark card the blue is lightened to #4a9ce8: the
 * official blue measures 2.9:1 against it, under the 3:1 a graphic needs,
 * and the lighter one 5.6:1.
 *
 * The whole thing is one <a>, so one tab stop and one click target; the mark
 * is hidden from screen readers, who hear "on LinkedIn" instead. It opens
 * in a new tab, so the card is not left.
 */
export function ProfileLink({
  reference: r,
  className = "",
}: {
  reference: Reference;
  className?: string;
}) {
  return (
    <a
      href={r.profile}
      target="_blank"
      rel="noopener"
      className={`profile-link inline-flex items-center gap-1.5 font-semibold text-text no-underline transition-colors hover:text-accent ${className}`}
    >
      {r.name}
      <LinkedInIcon className="profile-mark text-[#0a66c2] dark:text-[#4a9ce8]" />
      <span className="sr-only"> on LinkedIn</span>
    </a>
  );
}

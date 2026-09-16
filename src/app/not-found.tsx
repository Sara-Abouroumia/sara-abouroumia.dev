import Link from "next/link";
import { PageTitle, PROSE } from "@/components/section";
import { navItems } from "@/content/site";

/**
 * Replaces Next's built-in 404, which styles itself from the OS colour scheme
 * rather than the site's theme class and draws its own colours and font. On a
 * dark site that meant a pure black panel between the header and footer.
 *
 * Rendering inside the root layout, this picks up the tokens, fonts and theme
 * like any other page. Next adds `noindex` to the response on its own, and the
 * layout declares no canonical URL, so this page claims none.
 */
export default function NotFound() {
  return (
    <div>
      <PageTitle>Page not found</PageTitle>

      <p className={`${PROSE} mb-6 text-[16px] text-text-soft leading-[1.7]`}>
        There is nothing at this address. It may have moved, or the link that
        brought you here has a typo in it.
      </p>

      {/* Offer every section rather than only "go home": someone who followed
          an old link usually wants a specific page, not the front door. */}
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[15px]">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-accent underline hover:text-accent-hover"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

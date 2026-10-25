"use client";

import { useEffect } from "react";

/**
 * The route-level error boundary.
 *
 * Wraps every page and nested layout below the root, so a throw during render
 * swaps the page body for this while the header and footer stay put. That is
 * the difference from <GlobalError />: this one runs inside the root layout,
 * so it has the chrome, the fonts, the theme class and globals.css.
 *
 * Replaces Next's built-in error page for the same reason not-found.tsx
 * replaces the built-in 404: the default styles itself from the OS colour
 * scheme rather than the site's theme class, so on a dark page it arrived as a
 * white slab.
 *
 * Error boundaries have to be Client Components. React needs a component that
 * survives the failed render to show in its place, and that is a client
 * concern.
 */
// Named RouteError, not Error: Next only looks at the default export, and
// calling it Error shadows the global of that name.
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  /**
   * Re-runs the render, and in Next 16.3 also re-fetches the segment. Named
   * `retry` since 16.3, where earlier versions called it `reset`. `reset`
   * still exists but only clears the boundary without re-fetching, which on a
   * data error just fails again.
   */
  retry: () => void;
}) {
  useEffect(() => {
    // The one place this error is visible. There is no Sentry on this site by
    // design (see the plan's "Skip" list), so without this a client-side throw
    // leaves nothing behind at all.
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex flex-col items-start gap-[18px] menu:gap-[22px]">
      <span className="font-semibold text-[12px] text-muted uppercase tracking-[0.14em] menu:text-[13px]">
        Something went wrong
      </span>

      <h1 className="m-0 font-serif font-semibold text-[42px] text-text leading-[1.05] menu:text-[48px]">
        This page failed to load
      </h1>

      <p className="m-0 max-w-[560px] text-[17px] text-text-soft leading-[1.65] menu:text-[19px]">
        Something broke while building this page. Trying again often clears it.
        If it keeps happening, the contact form still works.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {/* Not a <form> or a link: retry re-renders in place, so navigating
            anywhere would throw away the thing being recovered. */}
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-[3px] bg-accent px-[26px] font-semibold text-[15px] text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Try again
        </button>

        {/* A plain <a>, not a <Link>. The router is part of what may have just
            failed, so a full document request is the reliable way out. */}
        <a
          href="/"
          className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-[3px] border border-border px-[26px] text-[15px] text-text-soft no-underline transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Back to home
        </a>
      </div>

      {/* The digest is a hash of the error, not its message: in production Next
          deliberately withholds the message of a Server Component error so it
          cannot leak internals to the browser. This is the string that matches
          the entry in the server logs, so it is the one useful thing to be able
          to quote. Absent for client-side errors, hence the guard. */}
      {error.digest ? (
        <p className="m-0 pt-2 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
          Reference {error.digest}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * The last resort: shown only when the root layout itself throws.
 *
 * This file *replaces* the root layout, so it renders its own <html> and
 * <body> and inherits nothing: no globals.css, no next/font, no ThemeProvider,
 * no header or footer. Next's own docs spell out the consequence, that an
 * app-level theme class never reaches this document and the default UI falls
 * back to the OS colour scheme. So every token it needs is redeclared below.
 *
 * Nothing here may import from the rest of the app. Whatever broke the root
 * layout could be any module it pulled in, so this page depends on React and
 * nothing else.
 */

/**
 * The site's tokens, copied rather than imported, for the reason above.
 *
 * Three states, the same shape the site uses. Bare :root is the light set;
 * prefers-color-scheme handles a visitor who never chose, guarded with
 * :not([data-theme="light"]) so an explicit light choice still wins on a dark
 * OS; the [data-theme="dark"] block lets the stored choice win in the other
 * direction. Kept in sync with globals.css by hand, which is acceptable for
 * eight values on a page that should never render.
 */
const STYLES = `
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --text: #1c1c1a;
    --soft: #33322d;
    --muted: #6b675c;
    --border: #e2ded3;
    --accent: #ad4f2d;
    --accent-hover: #8f3f22;
    --accent-fg: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --bg: #14161a;
      --text: #f1efe9;
      --soft: #d8d5cb;
      --muted: #9b9789;
      --border: #2b2e33;
      --accent: #d97757;
      --accent-hover: #e6916f;
      --accent-fg: #0f1115;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #14161a;
    --text: #f1efe9;
    --soft: #d8d5cb;
    --muted: #9b9789;
    --border: #2b2e33;
    --accent: #d97757;
    --accent-hover: #e6916f;
    --accent-fg: #0f1115;
  }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 400 17px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .wrap { margin: 0 auto; max-width: 880px; padding: 88px 24px; }
  .eyebrow {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0 0 18px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 42px;
    font-weight: 600;
    line-height: 1.05;
  }
  p { margin: 0 0 18px; max-width: 560px; color: var(--soft); }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  button, a.home {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 26px;
    border-radius: 3px;
    font: 600 15px/1 inherit;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }
  button { border: 0; background: var(--accent); color: var(--accent-fg); }
  button:hover { background: var(--accent-hover); }
  a.home { border: 1px solid var(--border); background: none; color: var(--soft); font-weight: 400; }
  a.home:hover { border-color: var(--accent); color: var(--accent); }
  .digest {
    margin: 22px 0 0;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  @media (max-width: 480px) { h1 { font-size: 34px; } .wrap { padding: 56px 20px; } }
`;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  /**
   * The visitor's stored theme, applied after mount rather than during render.
   *
   * next-themes keeps the choice in localStorage under "theme" (its default
   * key, and the layout does not override it). Reading it during render would
   * mismatch the server-rendered HTML, which has no way to know it; reading it
   * in an effect costs one repaint on a page nobody should ever see. "system"
   * is left alone deliberately, so the media query above decides.
   */
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Only place this error surfaces, as in error.tsx.
    console.error(error);
  }, [error]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") setTheme(stored);
    } catch {
      // Private mode and blocked site data both throw on access. The media
      // query is already a correct answer, so there is nothing to handle.
    }
  }, []);

  return (
    <html lang="en" data-theme={theme ?? undefined} suppressHydrationWarning>
      <body>
        {/* No metadata export is allowed in an error boundary, since it is a
            Client Component. React's own <title> is the documented way. */}
        <title>Something went wrong</title>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant
            stylesheet, no interpolation, and this document has no other way to
            carry styles. */}
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />

        <div className="wrap">
          <p className="eyebrow">Something went wrong</p>
          <h1>The site failed to load</h1>
          <p>
            This one is on our side, not yours. Trying again often clears it.
          </p>

          <div className="actions">
            <button type="button" onClick={() => retry()}>
              Try again
            </button>
            <a className="home" href="/">
              Back to home
            </a>
          </div>

          {error.digest ? (
            <p className="digest">Reference {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}

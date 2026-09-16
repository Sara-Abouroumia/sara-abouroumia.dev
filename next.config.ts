import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * Every route on this site is statically prerendered. The strict, nonce-based
 * CSP in the Next docs requires a fresh nonce per request, which forces every
 * page to render dynamically: no static generation, no CDN caching, a server
 * render on every visit. That is a real cost, and the thing it buys - blocking
 * inline script injection - protects against an XSS this site has no surface
 * for. There is no user-generated HTML anywhere: every string rendered comes
 * from a typed module in src/content, and React escapes it on the way out.
 * Nothing calls dangerouslySetInnerHTML.
 *
 * So this is the no-nonce policy, and 'unsafe-inline' is unavoidable in it:
 *   - script-src, because Next inlines the hydration payload
 *     (self.__next_f.push(...)) and next-themes inlines the script that sets
 *     the theme class before first paint, which is what stops the flash.
 *   - style-src, because `style` attributes are covered by style-src, and
 *     <Avatar /> positions the photo with an inline style object.
 *
 * The directives that do real work here are the rest of them: an injected
 * <base> cannot retarget links (base-uri), a stolen form cannot POST to an
 * attacker (form-action), nothing can frame this site to clickjack the resume
 * dialog (frame-ancestors), and no external origin can serve script, style,
 * font, or image (default-src 'self').
 *
 * Note object-src is 'self', not 'none'. The resume preview in
 * components/resume-preview.tsx embeds the PDF with <object type=
 * "application/pdf">, and 'none' blocks that element outright. frame-src is
 * 'self' for the same feature: Chrome renders an embedded PDF inside a nested
 * browsing context, which frame-src governs.
 *
 * Those two directives only cover the page's side of the embed. The PDF's own
 * response gets a vote too: frame-ancestors and X-Frame-Options are enforced
 * on the document being framed, so if the PDF says "never frame me", no
 * permission on the page overrides it. See pdfFrameHeaders below.
 */
const policy = (frameAncestors: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // next/font self-hosts Inter and Lora into /_next/static/media at build
    // time, so no fonts.gstatic.com origin is needed here.
    "font-src 'self'",
    // data: and blob: cover the placeholder and optimised outputs of next/image.
    "img-src 'self' data: blob:",
    // Server Actions post back to this origin. ws: is the dev HMR socket.
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'self'",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    "upgrade-insecure-requests",
  ].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: policy("'none'"),
  },
  {
    /**
     * Two years, and the preload flag submits this origin to the browser-vendor
     * HSTS list. Committing every subdomain is free here: .dev is preloaded at
     * the TLD level, so browsers already refuse plain http for this domain and
     * everything under it. Vercel also sets this on custom domains; setting it
     * explicitly means the policy lives in the repo rather than in a dashboard.
     */
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Stops a browser from second-guessing a Content-Type and executing an
    // uploaded or user-supplied file as script.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Superseded by frame-ancestors above, kept for browsers that predate it.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Full URL to same-origin, bare origin cross-origin, nothing on a downgrade
    // to http. Outbound links to GitHub and LinkedIn leak the origin, not the
    // path the visitor was reading.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // This site asks for none of these. Denying them up front means an embedded
    // third party cannot ask on its behalf either.
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  {
    // Severs the window.opener relationship for anything this site opens or is
    // opened by, which closes the tabnabbing and cross-origin-leak class.
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

/**
 * PDFs, and only PDFs, may be framed by this origin. Every other response keeps
 * 'none' / DENY, so no page on the site can be framed, not even by itself.
 */
const pdfFrameHeaders = [
  { key: "Content-Security-Policy", value: policy("'self'") },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  // Next sets `X-Powered-By: Next.js` by default, which tells a scanner which
  // framework and therefore which CVE list to try. Nothing needs it.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Everything, including /public assets. Headers are matched before the
        // filesystem, so this covers static files too.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Must come after the rule above. When two rules set the same key on
        // one path, the later rule wins, which is what lets this loosen the
        // framing headers for PDFs without restating the others.
        source: "/:path(.*\\.pdf)",
        headers: pdfFrameHeaders,
      },
    ];
  },
};

export default nextConfig;

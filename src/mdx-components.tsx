import type { MDXComponents } from "mdx/types";

/**
 * How markdown turns into this site's typography.
 *
 * Markdown has no classes. It compiles to bare <h2>, <p>, <ul>, and the
 * project has no global element styles to catch them, by design: Tailwind's
 * preflight strips heading sizes and list markers so components own their
 * appearance. Without this map a post renders as unstyled browser defaults.
 *
 * Required file. `@next/mdx` will not work with the App Router without it, and
 * it must sit beside the app directory, so src/ here.
 *
 * Note the signature: useMDXComponents() takes NO arguments in this version.
 * Older Next took a `components` parameter to merge into, and examples of that
 * shape are still everywhere; it does not apply here.
 */

/** Headings clear the sticky header when linked to, same as section anchors. */
const HEADING_ANCHOR = "scroll-mt-[var(--anchor-offset)]";

const components: MDXComponents = {
  /**
   * No h1. The post template renders the title from frontmatter as the page's
   * only h1, so a `#` in the body would produce a second one and break the
   * document outline. Start posts at `##`.
   */
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className={`${HEADING_ANCHOR} mt-11 mb-3 font-serif font-semibold text-[26px] text-text leading-tight`}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className={`${HEADING_ANCHOR} mt-8 mb-2 font-serif font-semibold text-[20px] text-text leading-snug`}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      {...props}
      className={`${HEADING_ANCHOR} mt-6 mb-2 font-semibold text-[17px] text-text`}
    >
      {children}
    </h4>
  ),

  p: ({ children }) => (
    <p className="my-4 text-[17px] text-text-soft leading-[1.75]">{children}</p>
  ),

  a: ({ children, href, ...props }) => {
    // Anything that is not same-document and not same-origin-relative opens
    // away from the site, so it gets the usual noopener treatment. Written as
    // a check rather than a rule for the author to remember.
    const external = href?.startsWith("http");
    return (
      <a
        {...props}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener" } : {})}
        className="text-accent underline decoration-field-border underline-offset-[3px] transition-colors hover:decoration-accent"
      >
        {children}
      </a>
    );
  },

  // list-outside, not inside: a wrapped line should align with the text above
  // it rather than running back under the bullet.
  ul: ({ children }) => (
    <ul className="my-4 list-disc list-outside pl-5 text-[17px] text-text-soft leading-[1.75] marker:text-muted-light">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal list-outside pl-5 text-[17px] text-text-soft leading-[1.75] marker:text-muted-light">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="my-1.5 pl-1">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-6 border-accent border-l-2 pl-5 text-[17px] text-muted italic leading-[1.7]">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-10 border-border border-t" />,

  /**
   * One component for two jobs, because markdown uses <code> for both a
   * backticked word inside a sentence and the body of a fenced block.
   *
   * rehype-pretty-code puts data-language on the block form, so that attribute
   * is the discriminator. Styling both the same way would either box every
   * line of a code block individually or leave inline code unmarked.
   */
  code: ({ children, ...props }) =>
    "data-language" in props ? (
      <code {...props}>{children}</code>
    ) : (
      <code className="rounded-[3px] border border-border bg-input-bg px-1.5 py-0.5 font-mono text-[0.88em] text-text">
        {children}
      </code>
    ),

  // Tables come from remark-gfm. Wrapped so a wide table scrolls inside its
  // own box instead of making the whole page scroll sideways.
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-[15px]">{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border-border border-b px-3 py-2 text-left font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      {...props}
      className="border-border border-b px-3 py-2 text-text-soft align-top"
    >
      {children}
    </td>
  ),

  /**
   * A plain <img>, not next/image, and that is deliberate.
   *
   * next/image needs intrinsic width and height (or a fill parent) to reserve
   * space, and markdown's ![alt](src) syntax carries neither. The options are
   * a plain tag or making every author write JSX for every screenshot. If a
   * post ever needs optimisation badly enough, it can import <Image /> in the
   * MDX itself, which is exactly what MDX is for.
   */
  img: ({ alt, ...props }) => (
    // markdown carries no width or height, so next/image cannot reserve
    // space for the picture. See the note above the component.
    // biome-ignore lint/performance/noImgElement: see above
    <img
      {...props}
      alt={alt ?? ""}
      className="my-6 h-auto w-full rounded-[3px] border border-border"
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}

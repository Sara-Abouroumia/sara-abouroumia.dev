import { Avatar } from "@/components/avatar";
import { AskSara } from "./not-found-client";
// Paired with the commented-out <RequestedPath /> below:
// import { RequestedPath } from "./not-found-client";

/**
 * The 404, built from the "Editorial notice" board of the 404 canvas.
 *
 * Replaces Next's built-in page, which styles itself from the OS colour scheme
 * rather than the site's theme class and draws its own colours and font. On a
 * dark site that meant a pure black panel between the header and footer.
 *
 * Next adds `noindex` to the response on its own, and the layout declares no
 * canonical URL, so this page claims none.
 */
export default function NotFound() {
  return (
    /**
     * The numeral is a grid cell beside the text from the `menu` breakpoint up,
     * and behind it below that, which is how the two boards differ. It comes
     * after the text in the source either way: on a wide screen the grid puts
     * it in the second column, and on a narrow one it is taken out of flow, so
     * the reading order stays text-first for anything that follows the DOM.
     *
     * Nothing clips here. The numeral used to hang 12px past this box with
     * overflow-hidden trimming it, which left a hard vertical edge down its
     * right side at every width below the breakpoint. It is now sized to sit
     * inside its space instead, so there is nothing to cut off.
     */
    <div className="relative grid items-center gap-10 menu:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="relative flex flex-col items-start gap-[18px] pt-[88px] menu:gap-[22px] menu:pt-0">
        <span className="font-semibold text-[12px] text-muted uppercase tracking-[0.14em] menu:text-[13px]">
          Error 404
        </span>

        <h1 className="m-0 font-serif font-semibold text-[42px] text-text leading-[1.05] menu:text-[48px]">
          Page not found
        </h1>

        <p className="m-0 max-w-[560px] text-[17px] text-text-soft leading-[1.65] menu:text-[19px]">
          There is nothing at this address. It may have moved, or the link that
          brought you here has a typo in it.
        </p>

        {/* <RequestedPath /> */}

        {/* Two navigation buttons said where you could go. This says who is
            asking, and offers the two things someone who lands here actually
            wants: the About page, which is home, or the contact form. */}
        <div className="pt-2">
          <AskSara avatar={<Avatar size={52} />} />
        </div>
      </div>

      {/* Decorative: the page already says "Page not found" and "Error 404" in
          words, so this is hidden rather than read out a third time.

          Sized to fit rather than to bleed. "404" in this face runs about
          1.55x its font size wide, so the caps below are what keep it inside
          the column: 42vw on a phone (about 254px of a 342px column at 390)
          and 230px against the 377px grid track above the breakpoint.

          It belongs to the background, so it is pinned below everything with
          a negative z-index. Both this and the text are positioned elements,
          and without saying so the numeral would paint over the words simply by
          coming after them in the source.

          Negative here rather than z-0 against z-10 on the text: the header is
          sticky at z-10, and page content on the same layer wins on source
          order, so the text scrolled over the header. Keeping the whole page
          on the default layer leaves the header above it where it belongs.
          pointer-events-none keeps the numeral out of the way of the links and
          the button crossing it. */}
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute top-0 right-0 select-none font-serif font-medium text-[min(42vw,180px)] text-ghost italic leading-[0.8] tracking-[-0.05em] menu:static menu:text-right menu:text-[clamp(150px,20vw,230px)]"
      >
        404
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { FileIcon } from "@/components/brand-icons";
import { site } from "@/content/site";

const TOOL_BUTTON =
  "inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2.5 py-1 text-[13px] text-text-soft no-underline hover:border-accent hover:text-accent";

const MENU_ITEM =
  "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-text-soft no-underline hover:bg-bg hover:text-accent";

function ChevronIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ d }: { d: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-muted"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PATH_PREVIEW =
  "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12ZM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z";
const PATH_OPEN =
  "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
const PATH_DOWNLOAD = "M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16";

/**
 * Resume as an Outlook attachment chip: the body opens an in-page preview, and
 * the caret opens the same actions Outlook offers: preview, open, download.
 *
 * The preview is a native <dialog> rather than a hand-rolled overlay, so the
 * focus trap, Esc-to-close, and inert background come from the platform.
 */
export function ResumePreview({ className = "" }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // showModal()/close() are imperative and are the only way to get the
  // top-layer backdrop, so React state has to be pushed onto the node.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Backdrop click. The backdrop is painted by the dialog itself, so a click
  // landing on the element rather than its children is a click outside the
  // content. Bound natively instead of via onClick: the keyboard equivalent is
  // Esc, which <dialog> handles on its own and reports through onClose.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === el) setOpen(false);
    };
    el.addEventListener("click", onBackdropClick);
    return () => el.removeEventListener("click", onBackdropClick);
  }, []);

  // Dismiss the caret menu on outside click or Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!chipRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const preview = () => {
    setMenuOpen(false);
    setOpen(true);
  };

  return (
    <>
      <div ref={chipRef} className="relative inline-flex">
        <div className={className}>
          <button
            type="button"
            onClick={preview}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 hover:text-accent"
          >
            <FileIcon className="text-muted" />
            Resume
          </button>

          <span aria-hidden="true" className="w-px self-stretch bg-border" />

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center px-2 py-1.5 hover:text-accent"
          >
            <span className="sr-only">Resume options</span>
            <ChevronIcon />
          </button>
        </div>

        {menuOpen ? (
          <div
            role="menu"
            aria-label="Resume options"
            className="absolute top-full left-0 z-20 mt-1 min-w-[190px] overflow-hidden rounded-[3px] border border-border bg-panel py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={preview}
              className={MENU_ITEM}
            >
              <MenuIcon d={PATH_PREVIEW} />
              Preview
            </button>
            <a
              role="menuitem"
              href={site.resume}
              target="_blank"
              rel="noopener"
              onClick={() => setMenuOpen(false)}
              className={MENU_ITEM}
            >
              <MenuIcon d={PATH_OPEN} />
              Open in new tab
            </a>
            <a
              role="menuitem"
              href={site.resume}
              download={site.resumeFileName}
              onClick={() => setMenuOpen(false)}
              className={MENU_ITEM}
            >
              <MenuIcon d={PATH_DOWNLOAD} />
              Download
            </a>
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`Preview of ${site.resumeFileName}`}
        onClose={() => setOpen(false)}
        className="m-auto h-[min(88vh,900px)] w-[min(920px,94vw)] flex-col overflow-hidden rounded border border-border bg-panel p-0 text-text backdrop:bg-black/50 open:flex"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          <FileIcon className="text-muted" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {site.resumeFileName}
          </span>

          <a
            href={site.resume}
            target="_blank"
            rel="noopener"
            className={TOOL_BUTTON}
          >
            Open in tab
          </a>
          <a
            href={site.resume}
            download={site.resumeFileName}
            className={TOOL_BUTTON}
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close preview"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-[3px] border border-border text-muted hover:border-accent hover:text-accent"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* <object> over <iframe>: its children render as real fallback when
            the browser has no inline PDF viewer, which is the common case on
            mobile. Only mounted while open so the PDF is not fetched on load. */}
        <div className="min-h-0 flex-1 bg-bg">
          {open ? (
            <object
              data={site.resume}
              type="application/pdf"
              className="h-full w-full"
              aria-label={`${site.resumeFileName} preview`}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-[15px] text-text-soft">
                  Your browser can&rsquo;t preview PDFs inline.
                </p>
                <a
                  href={site.resume}
                  download={site.resumeFileName}
                  className={TOOL_BUTTON}
                >
                  Download the PDF
                </a>
              </div>
            </object>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

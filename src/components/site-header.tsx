"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems, site } from "@/content/site";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4 px-6 py-5">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap font-serif text-[19px] font-semibold tracking-[0.01em] text-text no-underline"
        >
          {site.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-end gap-[22px] text-[15px] menu:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={
                isActive(pathname, item.href)
                  ? "font-semibold text-text no-underline"
                  : "text-muted no-underline hover:text-text"
              }
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.resume}
            target="_blank"
            rel="noopener"
            className="whitespace-nowrap rounded-[3px] border border-border px-3 py-[5px] text-sm text-muted no-underline hover:border-accent hover:text-accent"
          >
            Resume ↓
          </a>
          <ThemeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2.5 menu:hidden">
          <ThemeToggle />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-border text-lg leading-none text-text"
            >
              ☰
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-20 bg-black/35" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-30 flex w-[min(78vw,300px)] flex-col gap-1 border-l border-border bg-bg p-5">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Close
                  aria-label="Close menu"
                  className="mb-3 self-end text-xl leading-none text-muted"
                >
                  ×
                </Dialog.Close>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={
                      isActive(pathname, item.href)
                        ? "py-1.5 font-semibold text-text no-underline"
                        : "py-1.5 text-muted no-underline"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={site.resume}
                  target="_blank"
                  rel="noopener"
                  className="mt-3 border-t border-border pt-3 text-[15px] text-muted no-underline"
                >
                  Resume ↓
                </a>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}

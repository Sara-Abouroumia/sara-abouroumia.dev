"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const SunIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Light and dark, and nothing else.
 *
 * "System" is still how the site starts: the provider is mounted with
 * defaultTheme="system" and enableSystem, so a first visit follows whatever
 * the device is set to. It simply is not a position on this control any more.
 * A third state that looks identical to one of the other two is a setting you
 * can only read by opening the menu, and the device default is what a visitor
 * who has never touched it already gets.
 *
 * Pressing it writes "light" or "dark" to localStorage through next-themes,
 * which is what makes the choice stick on this device for later visits. Until
 * then the stored value stays "system" and the site keeps following the
 * device, including when that device switches over at sunset.
 *
 * `resolvedTheme` rather than `theme`: the second is the literal preference
 * ("system" before any click) and the first is what is actually on screen,
 * which is what this has to invert.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // resolvedTheme reads the device preference, which the server cannot know,
  // so the first client render has to match the server's empty-handed one.
  // Rendering the icon only after mount keeps hydration honest; the button
  // holds its size meanwhile so the header does not shift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={mounted ? label : "Switch theme"}
      title={mounted ? label : undefined}
      className="flex h-[30px] w-[34px] items-center justify-center rounded-[3px] border border-border text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {/* The mark is the destination, not the current state: on a dark page
          this is a sun, because that is what pressing it gets you. */}
      {mounted ? (
        isDark ? (
          SunIcon
        ) : (
          MoonIcon
        )
      ) : (
        <span className="block h-[15px] w-[15px]" />
      )}
    </button>
  );
}

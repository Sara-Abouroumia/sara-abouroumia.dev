"use client";

import { useEffect } from "react";

const SESSION_KEY = "visit-counted";

/**
 * Pings /api/beacon once per browser session, so the visitor map counts
 * visits rather than page views (twelve pages read in one sitting is one
 * visit from that country, not twelve).
 *
 * sessionStorage, not a cookie and not localStorage: it is never sent to any
 * server, it is gone when the tab closes, and it holds one flag rather than
 * anything identifying. A new session tomorrow counts again, which is what a
 * "visit" means.
 *
 * navigator.sendBeacon rather than fetch: the browser queues it and delivers
 * it even if the visitor navigates away a moment later, and it never holds
 * the page up. Renders nothing.
 */
export function VisitBeacon() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage blocked (private mode, strict settings): count this page view
      // anyway rather than never counting this visitor at all.
    }
    navigator.sendBeacon?.("/api/beacon");
  }, []);

  return null;
}

import { track as vercelTrack } from "@vercel/analytics";

/**
 * The event list, and the only way to send one.
 *
 * `vercelTrack` takes an arbitrary string and an arbitrary bag of properties,
 * which is how analytics turns into landfill: `contact_sent`, `contactSent`
 * and `contact-sent` all record happily and none of them add up. Naming every
 * event here makes a typo a build error, and gives one place to read to learn
 * what the site measures.
 *
 * Eight events, from the plan, and no more until one is actually missed. The
 * point of a short list is that each event has a question behind it; a list
 * nobody can hold in their head gets consulted by nobody.
 *
 * Four of these have no code path yet (tray, inquiry, reference, Mochi) and
 * are declared anyway, because the list is the specification. They are Phase 2
 * and 3 features, and `palette_opened` is explicitly V2.
 */
type Events = {
  /** A product demo was opened on its own site. */
  demo_opened: { slug: string };
  /** A demo was added to the interest tray. `count` is the tray size after. */
  tray_pick: { slug: string; count: number };
  /** The products inquiry form was submitted, for `count` demos. */
  inquiry_sent: { count: number };
  /** The contact form was submitted and the server accepted it. */
  contact_sent: undefined;
  /** The resume PDF was downloaded, from either the chip or the dialog. */
  cv_downloaded: undefined;
  /** A referee began the form. `invited` separates a token link from the open one. */
  reference_started: { invited: boolean };
  /** One of the assistant's five intents was chosen. */
  mochi_action: { intent: string };
  /** The command palette was opened. */
  palette_opened: undefined;
};

/** Events that carry nothing, so calling them takes one argument. */
type EmptyEvent = {
  [K in keyof Events]: Events[K] extends undefined ? K : never;
}[keyof Events];

type PayloadEvent = Exclude<keyof Events, EmptyEvent>;

/**
 * Send one event.
 *
 * Two overloads rather than an optional second argument, so the payload is
 * required exactly where the event declares one and rejected where it does
 * not. Vercel silently drops unknown-shaped properties, so a missed payload
 * would otherwise be invisible until someone went looking for a number that
 * was never recorded.
 *
 * Browser only. `@vercel/analytics/server` exists for Server Actions but needs
 * the request to stay open long enough to flush; every event here fires from a
 * client component after the server has already answered, which is simpler and
 * loses nothing.
 */
export function track(name: EmptyEvent): void;
export function track<K extends PayloadEvent>(name: K, props: Events[K]): void;
export function track(name: string, props?: Record<string, unknown>): void {
  // In development this logs instead of sending, which is the behaviour we
  // want: no local noise in the dashboard, but the call is still visible.
  vercelTrack(name, props as never);
}

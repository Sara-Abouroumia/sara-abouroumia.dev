import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { NotesBrowser } from "@/components/notes-browser";
import { PageTitle, PROSE } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";
import { getNotes, NOTES_DESCRIPTION, NOTES_PATH } from "@/lib/notes";

const base = pageMetadata({
  title: "Notes",
  description: NOTES_DESCRIPTION,
  path: NOTES_PATH,
});

/**
 * The canonical comes from pageMetadata; the feed link is added on top.
 *
 * Spread and re-merge rather than assigned, for the same shallow-merge reason
 * pageMetadata exists at all: writing `alternates: { types: ... }` here would
 * replace the whole object and drop the canonical with it.
 */
export const metadata: Metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    // Gives the browser and any feed reader an <link rel="alternate"> to find,
    // which is how a reader autodiscovers the feed from the page URL alone.
    types: {
      "application/rss+xml": [
        { url: `${NOTES_PATH}/rss.xml`, title: "Sara Abouroumia: Notes" },
      ],
    },
  },
};

/**
 * The notes index, as a grid of overview cards. See <NotesBrowser /> for the
 * cards and the category filter.
 *
 * This page absorbed what used to be the separate Blog tab, and was itself
 * called Research until 2026-10 (see the note at the top of lib/notes.ts).
 * Notes land here as MDX in src/content/notes.
 */
export default function NotesPage() {
  const notes = getNotes();

  return (
    <div>
      <PageTitle>Notes</PageTitle>

      <p className={`${PROSE} mb-8 text-[16px] text-text-soft leading-[1.7]`}>
        {NOTES_DESCRIPTION}
      </p>

      {notes.length === 0 ? (
        <EmptyState>
          Nothing published yet. The first notes are coming.
        </EmptyState>
      ) : (
        <NotesBrowser notes={notes} />
      )}
    </div>
  );
}

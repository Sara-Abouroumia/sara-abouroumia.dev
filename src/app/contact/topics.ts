/**
 * The "What is this about?" choices, shared by the form and the server action.
 *
 * Lives in its own module because of where it is used. actions.ts is a
 * "use server" file, and those may only export async functions, so it cannot
 * export this list. contact-form.tsx is a client module, and the server action
 * should not reach into client code for its data. A plain module sits on
 * neither side and both can import it.
 */
export const TOPICS = [
  {
    id: "work",
    label: "Work opportunity",
    placeholder:
      "Tell me about the role or project, the team, and the timeline.",
  },
  {
    id: "collab",
    label: "Collaboration",
    placeholder: "What are you building, and where could I help?",
  },
  {
    id: "question",
    label: "Question",
    placeholder: "Which page or project is your question about?",
  },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

/** Typed as a non-empty tuple so zod's z.enum() accepts it directly. */
export const TOPIC_IDS = TOPICS.map((t) => t.id) as [TopicId, ...TopicId[]];

export const DEFAULT_TOPIC: TopicId = "work";

/** One limit for the textarea, the counter, and the server's schema. */
export const MESSAGE_MAX = 2000;

export function topicLabel(id: TopicId) {
  return TOPICS.find((t) => t.id === id)?.label ?? TOPICS[0].label;
}

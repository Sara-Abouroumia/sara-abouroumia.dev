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

/**
 * Whether the form asks "What is this about?" at all.
 *
 * Off: one more decision in front of the message box is one more reason not
 * to write, and the subject line does not need it. The visitor's own words say
 * what the message is about better than a chip does.
 *
 * A flag rather than commented-out JSX, so the chips stay type-checked and
 * keep compiling as the form around them changes, and turning them back on is
 * this one word. The server action already treats the topic as optional: it
 * drops an absent one and leaves it out of the email subject.
 */
export const SHOW_TOPICS = false;

/**
 * Whether the fields show example text ("Jane", "jane@company.com", ...).
 *
 * Off: with the label sitting on each field's border, the field already says
 * what it wants, and an example inside it is a second voice saying the same
 * thing. Placeholders also read as pre-filled at a glance, and they vanish
 * the moment typing starts, so they are no place for anything the visitor
 * needs to remember. Same flag pattern as SHOW_TOPICS, for the same reasons.
 */
export const SHOW_PLACEHOLDERS = false;

/** The message hint when no topic is chosen. */
export const NEUTRAL_PLACEHOLDER =
  "A role, a collaboration, a question about something here: whatever brought you, a few lines is plenty.";

/** One limit for the textarea, the counter, and the server's schema. */
export const MESSAGE_MAX = 2000;

export function topicLabel(id: TopicId) {
  return TOPICS.find((t) => t.id === id)?.label ?? TOPICS[0].label;
}

"use client";

import {
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { type ContactField, type ContactState, submitContact } from "./actions";
import { DEFAULT_TOPIC, MESSAGE_MAX, TOPICS, type TopicId } from "./topics";

/**
 * Quiet: 13px at regular weight in --muted, not 14px medium in a body tone.
 * A field label is a caption on the box under it, and the box already has
 * an edge, a fill and a hint inside it. At the heavier weight the labels
 * were the loudest thing in the column, competing with the page title.
 */
const LABEL = "text-[13px] text-muted";

/**
 * The 3px used by every other bordered thing on the site: the resume chip,
 * the theme toggle, the drawer trigger, the footer's icon buttons. One value
 * in one place, so the chips, fields and buttons here cannot drift apart.
 */
const RADIUS = "rounded-[3px]";

/**
 * Sized from the design canvas: 17px Lora, 12px and 14px of padding, 48px
 * tall. Serif for what the visitor types, sans for everything the site says,
 * so their words read as a letter being written rather than a form being
 * filled in. Over 16px either way, which is the threshold below which iOS
 * zooms into a focused field and stays there.
 *
 * The placeholder is the same face in italic, two steps down at 15px and
 * set in --placeholder, which is lighter than any body tone: it is an example
 * of an answer, not an answer, and Lora's large x-height makes it sit heavier
 * than its size suggests. The italic is what separates the two.
 */
const FIELD = `w-full ${RADIUS} border bg-input-bg px-3.5 font-serif text-[17px] text-text transition-colors placeholder:text-[15px] placeholder:text-placeholder placeholder:italic focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus-ring`;

/** 48px on the canvas, and the height of the send button. */
const INPUT = `${FIELD} h-12`;

const TEXTAREA = `${FIELD} min-h-[180px] resize-y py-3 leading-[1.6]`;

/** Idle borders, and the hover that only applies while the field is valid. */
const edge = (invalid: boolean) =>
  invalid ? "border-error" : "border-field-border hover:border-muted-light";

const FIELD_ORDER: ContactField[] = ["name", "surname", "email", "message"];

const INITIAL: ContactState = { status: "idle" };

/**
 * useActionState has no reset. Remounting under a new key is the reset: the
 * action state, the chosen topic, and every uncontrolled field start over.
 */
export function ContactForm() {
  const [attempt, setAttempt] = useState(0);
  return <Form key={attempt} onSendAnother={() => setAttempt((n) => n + 1)} />;
}

function Form({ onSendAnother }: { onSendAnother: () => void }) {
  const [state, formAction, isPending] = useActionState(submitContact, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  const values = state.status === "error" ? state.values : undefined;
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  /**
   * Fields edited since the last response. An error describes what was sent,
   * so once the visitor starts fixing a field its message no longer applies.
   *
   * Reset whenever a new response arrives, during render rather than in an
   * effect: an effect would paint one frame with the old list against the new
   * errors, hiding them for a flicker.
   */
  const [topic, setTopic] = useState<TopicId>(values?.topic ?? DEFAULT_TOPIC);

  const [edited, setEdited] = useState<ContactField[]>([]);
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    setEdited([]);
  }

  const errorFor = (field: ContactField) =>
    edited.includes(field) ? undefined : errors?.[field];

  const markEdited = (field: ContactField) => {
    if (errors?.[field] && !edited.includes(field)) {
      setEdited((prev) => [...prev, field]);
    }
  };

  // Send focus to the first field that needs attention. Its label, invalid
  // state and error text are then read out together, which a list of errors
  // announced at the top of the form would leave the visitor to map back.
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;
    const first = FIELD_ORDER.find((f) => state.fieldErrors?.[f]);
    if (first)
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <Sent
        name={state.name}
        email={state.email}
        onSendAnother={onSendAnother}
      />
    );
  }

  // The message hint follows the chosen topic, which is the one thing on
  // screen that the topic changes.
  const placeholder =
    TOPICS.find((t) => t.id === topic)?.placeholder ?? TOPICS[0].placeholder;

  return (
    // noValidate: the browser's own required-field tooltips would fire first
    // and the inline messages below would never show. `required` stays on
    // each field, so assistive tech still announces them as required.
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-6"
    >
      {state.status === "error" && !errors ? (
        <p
          role="alert"
          className={`${RADIUS} border border-border bg-panel px-4 py-3 text-[14px] text-text-soft`}
        >
          {state.message}
        </p>
      ) : null}

      {/* A radio group, drawn as chips. Only one topic applies, which is what
          radios express, and they bring arrow-key movement and a submitted
          value without any script. Spacing sits on the legend because a
          <legend> takes no part in its fieldset's flex or grid layout.

          The chosen chip keeps a light fill and puts the signal in its edge:
          baby blue in light, where the navy accent carried no more weight
          than the text beside it, and the accent in dark. See
          --selected-border. */}
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className={`${LABEL} mb-3 p-0`}>What is this about?</legend>
        <div className="flex flex-wrap gap-2.5">
          {TOPICS.map((t) => (
            <label
              key={t.id}
              className={`inline-flex min-h-11 cursor-pointer items-center ${RADIUS} border border-field-border px-[18px] text-[14px] font-medium text-form-label transition-colors hover:border-muted-light has-checked:border-selected-border has-checked:bg-selected-bg has-checked:text-accent has-focus-visible:outline-2 has-focus-visible:outline-accent has-focus-visible:outline-offset-2`}
            >
              <input
                type="radio"
                name="topic"
                value={t.id}
                defaultChecked={t.id === topic}
                onChange={() => setTopic(t.id)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Name and surname share a row where there is room for two, and
          stack below that. Email is never paired: addresses are the longest
          thing typed into this form and the one most often mistyped, so it
          gets the full column to show what was entered. */}
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <Field
          id="name"
          label="Name"
          error={errorFor("name")}
          input={(describedBy, invalid) => (
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              autoComplete="given-name"
              placeholder="Jane"
              defaultValue={values?.name}
              onChange={() => markEdited("name")}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={`${INPUT} ${edge(invalid)}`}
            />
          )}
        />
        <Field
          id="surname"
          label="Surname"
          error={errorFor("surname")}
          input={(describedBy, invalid) => (
            <input
              id="surname"
              name="surname"
              type="text"
              required
              maxLength={100}
              autoComplete="family-name"
              placeholder="Doe"
              defaultValue={values?.surname}
              onChange={() => markEdited("surname")}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={`${INPUT} ${edge(invalid)}`}
            />
          )}
        />
      </div>

      <Field
        id="email"
        label="Email"
        error={errorFor("email")}
        input={(describedBy, invalid) => (
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            inputMode="email"
            placeholder="jane@company.com"
            defaultValue={values?.email}
            onChange={() => markEdited("email")}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${INPUT} ${edge(invalid)}`}
          />
        )}
      />

      <Field
        id="message"
        label="Message"
        error={errorFor("message")}
        input={(describedBy, invalid) => (
          <textarea
            id="message"
            name="message"
            rows={7}
            required
            maxLength={MESSAGE_MAX}
            placeholder={placeholder}
            defaultValue={values?.message}
            onChange={() => markEdited("message")}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${TEXTAREA} ${edge(invalid)}`}
          />
        )}
      />

      {/* Honeypot. Off-screen rather than display:none, since some bots skip
          fields they can tell are hidden. aria-hidden and tabIndex keep it away
          from anyone using a keyboard or a screen reader. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* The canvas's closing row: note at the left, button at the right. The
          button leads in the source so it sits on top on a phone, full width
          with the note centred under it; row-reverse puts it back on the
          right from sm up. Only the button is focusable, so reversing the
          visual order cannot scramble the tab order. */}
      <div className="flex flex-col gap-2.5 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 ${RADIUS} bg-accent px-[26px] text-[15px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent whitespace-nowrap focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto`}
        >
          {isPending ? <SpinnerIcon /> : null}
          <span>{isPending ? "Sending…" : "Send message"}</span>
          {isPending ? null : <SendIcon />}
        </button>
        <p className="m-0 text-center text-[13px] text-form-hint sm:text-left">
          Only used to reply to you.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  aside,
  input,
}: {
  id: ContactField;
  label: string;
  error?: string;
  aside?: ReactNode;
  input: (describedBy: string | undefined, invalid: boolean) => ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {aside}
      </div>
      {input(error ? errorId : undefined, Boolean(error))}
      {error ? (
        // text-pretty: in a 200px column these messages run to two lines, and
        // without it the second is often a single stranded word.
        <p id={errorId} className="m-0 text-pretty text-[13px] text-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Fires a burst from a point, twice, a beat apart.
 *
 * Loaded on demand rather than imported at the top: it is a few kB of canvas
 * code that only runs on the one frame after a message sends, so there is no
 * reason for it to sit in the bundle every visitor downloads.
 *
 * It draws on a canvas of our own with useWorker: false, rather than calling
 * the library's default export. Left to itself canvas-confetti moves the
 * animation into a Web Worker built from a blob: URL, and the site's CSP has
 * no worker-src, so the browser blocks it and nothing appears. Widening the
 * policy to allow blob: workers would be a real concession for a decorative
 * effect; running on the main thread costs nothing at this scale.
 */
async function burst(from: { x: number; y: number }) {
  const { default: confetti } = await import("canvas-confetti");

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // Fixed and click-through: it covers the page for a second and must not
  // swallow a click meant for what is underneath.
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40";
  document.body.append(canvas);

  const fire = confetti.create(canvas, { resize: true, useWorker: false });
  const shared = {
    origin: from,
    disableForReducedMotion: true,
    colors: ["#2c4a6e", "#7da7d9", "#16a34a", "#4ade80", "#f0c42b"],
  };

  /**
   * fire() hands back null rather than a promise when the library disables
   * itself, which it does for a visitor who asked for reduced motion. Wrapping
   * both calls in Promise.resolve keeps that from hanging the await, and so
   * from leaving the canvas pinned over the page for the rest of the visit.
   */
  await Promise.all([
    Promise.resolve(
      fire({ ...shared, particleCount: 70, spread: 70, startVelocity: 38 }),
    ),
    new Promise<void>((done) => {
      setTimeout(() => {
        void Promise.resolve(
          fire({
            ...shared,
            particleCount: 40,
            spread: 110,
            startVelocity: 26,
            decay: 0.92,
          }),
        ).then(() => done());
      }, 180);
    }),
  ]);

  // fire() resolves when the last particle has gone, so the canvas can go
  // with it rather than sitting over the page for the rest of the visit.
  canvas.remove();
}
function Sent({
  name,
  email,
  onSendAnother,
}: {
  name: string;
  email: string;
  onSendAnother: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);

  // The form that had focus has just been removed from the page, which drops
  // focus to <body> and leaves a screen reader silent. Moving it here reads
  // the confirmation out and puts keyboard users back where the action is.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // The burst comes out of the tick itself rather than the middle of the
  // window, so the celebration points at the thing it is celebrating.
  // confetti() takes an origin in fractions of the viewport.
  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;
    const box = mark.getBoundingClientRect();
    void burst({
      x: (box.left + box.width / 2) / window.innerWidth,
      y: (box.top + box.height / 2) / window.innerHeight,
    });
  }, []);

  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="flex flex-col items-start gap-4 py-4">
      <span ref={markRef} className="inline-flex">
        <CheckCircleIcon />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="m-0 font-serif text-[26px] font-semibold text-text focus:outline-none"
      >
        Message sent
      </h2>
      <p className="m-0 max-w-[420px] text-[16px] text-text-soft leading-[1.6]">
        Thanks, {firstName}. I&rsquo;ll get back to you at{" "}
        <span className="text-text">{email}</span> soon.
      </p>
      <button
        type="button"
        onClick={onSendAnother}
        className={`mt-1 inline-flex min-h-11 items-center ${RADIUS} border border-field-border px-4 text-[14px] font-medium text-text transition-colors hover:border-muted-light focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
      >
        Send another message
      </button>
    </div>
  );
}
function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Proportioned off the reference: the mark is a touch wider than it
          is tall (about 1.08:1 once the stroke is counted), and the notch is
          set in a fifth of the width. Flatter than that and it stops reading
          as a plane and starts reading as a play button. */}
      <path d="M20.4 12 3.6 4.3 7 12 3.6 19.7Z" />
    </svg>
  );
}

function SpinnerIcon() {
  // motion-safe: with reduced motion requested, this stays a still arc beside
  // the word "Sending…", which already says the same thing.
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="motion-safe:animate-spin"
    >
      <path
        d="M21 12a9 9 0 1 1-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-success-mark"
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

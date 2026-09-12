"use client";

import { useActionState } from "react";
import { type ContactState, submitContact } from "./actions";

const FIELD =
  "w-full rounded-[3px] border border-border bg-input-bg px-3 py-2.5 text-[15px] text-text placeholder:text-muted-light focus:border-accent focus:outline-none";
const LABEL = "mb-1.5 block text-[13px] text-muted";

const INITIAL: ContactState = { status: "idle" };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[13px] text-accent" role="alert">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, INITIAL);

  if (state.status === "success") {
    return (
      // <output> carries an implicit role="status", so it is announced on swap
      // without the attribute. That matters here: the form it replaced is gone,
      // and a screen reader would otherwise get no signal anything happened.
      // Needs `block`, since <output> is inline by default.
      <output className="block rounded-[3px] border border-success-border bg-success-bg px-5 py-5 text-[15px] text-success-text leading-relaxed">
        Thanks, that came through. I read everything myself and will reply to
        the address you gave.
      </output>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;

  return (
    // No onSubmit and no preventDefault: with `action` this posts and works
    // before React hydrates, and progressively upgrades once it has.
    <form action={formAction} className="flex flex-col gap-3.5">
      {state.status === "error" && !errors ? (
        <p
          role="alert"
          className="rounded-[3px] border border-border bg-panel px-4 py-3 text-[14px] text-text-soft"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className={LABEL}>
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          defaultValue={values?.name}
          aria-invalid={errors?.name ? true : undefined}
          className={FIELD}
        />
        <FieldError message={errors?.name} />
      </div>

      <div>
        <label htmlFor="email" className={LABEL}>
          Your email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          defaultValue={values?.email}
          aria-invalid={errors?.email ? true : undefined}
          className={FIELD}
        />
        <FieldError message={errors?.email} />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          maxLength={5000}
          defaultValue={values?.message}
          aria-invalid={errors?.message ? true : undefined}
          className={`${FIELD} resize-y`}
        />
        <FieldError message={errors?.message} />
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-[3px] bg-accent px-5 py-2.5 text-[15px] text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-light"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

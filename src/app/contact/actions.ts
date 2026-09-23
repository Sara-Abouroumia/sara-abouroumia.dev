"use server";

import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/content/site";
import { MESSAGE_MAX, TOPIC_IDS, type TopicId, topicLabel } from "./topics";

export type ContactField = "name" | "surname" | "email" | "message";

export type ContactValues = {
  /** Absent while the topic chips are switched off in the form. */
  topic?: TopicId;
  name: string;
  surname: string;
  email: string;
  message: string;
};

export type ContactState =
  | { status: "idle" }
  /** Name and email come back so the confirmation can address the visitor. */
  | { status: "success"; name: string; email: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<ContactField, string>>;
      /** Echoed back so a failed submit does not wipe what was typed. */
      values?: ContactValues;
    };

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  surname: z.string().trim().min(1, "Please add your surname.").max(100),
  email: z
    .string()
    .trim()
    .min(1, "I need an email address to reply to.")
    .pipe(z.email("That email does not look quite right.").max(200)),
  message: z
    .string()
    .trim()
    .min(10, "A few more words would help (at least 10 characters).")
    .max(MESSAGE_MAX, `Please keep it under ${MESSAGE_MAX} characters.`),
});

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  /**
   * Only used when the form actually offers the choice. A radio group can
   * submit only its own values, so anything else was hand-crafted and is
   * dropped rather than rejected: the topic shapes a subject line, nothing
   * more. Absent means the subject simply does not mention one, which beats
   * labelling every message with whichever chip happened to be default.
   */
  const raw = formData.get("topic");
  const topic =
    typeof raw === "string" && (TOPIC_IDS as readonly string[]).includes(raw)
      ? (raw as TopicId)
      : undefined;

  const values: ContactValues = {
    topic,
    name: String(formData.get("name") ?? ""),
    surname: String(formData.get("surname") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  /**
   * Honeypot. The field is invisible and off the tab order, so a person never
   * fills it and a naive bot that autofills every input always does. Silently
   * return success: telling a bot it was caught only teaches it to try again
   * without the field.
   */
  if (String(formData.get("company") ?? "") !== "") {
    return { status: "success", name: values.name, email: values.email };
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    // Configuration gap, not a user mistake. Say so plainly and give the
    // address, rather than letting the message vanish into a 500.
    return {
      status: "error",
      message: `Sending is not configured yet. Please email ${site.email} directly.`,
      values,
    };
  }

  const fullName = `${parsed.data.name} ${parsed.data.surname}`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      /**
       * Sent as the site, never as the visitor. Putting their address in
       * `from` fails SPF and DKIM for their domain and lands the mail in spam.
       * `replyTo` is what makes hitting Reply go to them.
       */
      from,
      to: site.email,
      replyTo: parsed.data.email,
      // A filter on "Portfolio contact" catches every one of these. The
      // topic is named only when the visitor chose one.
      subject: topic
        ? `Portfolio contact: ${topicLabel(topic)} from ${fullName}`
        : `Portfolio contact from ${fullName}`,
      text: [
        parsed.data.message,
        "",
        // "-- " (dash, dash, space) on its own line is the standard signature
        // delimiter (RFC 3676). Mail clients recognise it and set what follows
        // apart from the message.
        "-- ",
        `${fullName} <${parsed.data.email}>`,
        `Sent from the contact form on ${site.url.replace("https://", "")}`,
      ].join("\n"),
    });

    if (error) {
      return {
        status: "error",
        message: `That did not send. Please email ${site.email} directly.`,
        values,
      };
    }

    return {
      status: "success",
      name: parsed.data.name,
      email: parsed.data.email,
    };
  } catch {
    return {
      status: "error",
      message: `That did not send. Please email ${site.email} directly.`,
      values,
    };
  }
}

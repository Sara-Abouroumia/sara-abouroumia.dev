"use server";

import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/content/site";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
      /** Echoed back so a failed submit does not wipe what was typed. */
      values?: { name: string; email: string; message: string };
    };

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: z.email("That email address does not look right.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "A little more detail would help.")
    .max(5000, "That is longer than this form can send."),
});

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
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
    return { status: "success" };
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
      message: "Please check the fields below.",
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
      subject: `Portfolio contact from ${parsed.data.name}`,
      text: [
        parsed.data.message,
        "",
        // "-- " (dash, dash, space) on its own line is the standard signature
        // delimiter (RFC 3676). Mail clients recognise it and set what follows
        // apart from the message.
        "-- ",
        `${parsed.data.name} <${parsed.data.email}>`,
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

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: `That did not send. Please email ${site.email} directly.`,
      values,
    };
  }
}

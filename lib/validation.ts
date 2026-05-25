import { z } from "zod";

/**
 * Email signup schema.
 *
 * Used on the server (Server Action) and can be shared with the client if we
 * ever want pre-submit validation. Single source of truth for what a valid
 * waitlist payload looks like.
 *
 * The honeypot field (`company`) is intentionally NOT part of this schema.
 * It is checked manually at the top of the Server Action, before any other
 * work, and a non-empty value returns silent success without ever reaching
 * Zod or the database. Mixing it into Zod risked routing bot submissions
 * through the regular validation-error branch, which leaks signal to bots
 * and bypasses the silent-drop contract.
 */
export const waitlistSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is required." })
    .max(254, { message: "Email is too long." })
    .email({ message: "Enter a valid email address." }),
});

export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>;

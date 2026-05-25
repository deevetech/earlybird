"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { waitlistSignupSchema } from "@/lib/validation";

export type WaitlistActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; field?: "email" | "form" };

const WAITLIST_TABLE_NAME = "waitlist_signups";
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

const SUCCESS_NEW_SIGNUP_MESSAGE =
  "You're on the list. We'll be in touch when something ships.";
const SUCCESS_ALREADY_SIGNED_UP_MESSAGE = "You're already on the list.";
const GENERIC_ERROR_MESSAGE =
  "Something went wrong on our end. Please try again in a moment.";

const IS_DEVELOPMENT_ENVIRONMENT = process.env.NODE_ENV !== "production";

function hashClientIpAddress(rawIpAddress: string): string {
  return createHash("sha256").update(rawIpAddress).digest("hex");
}

function readClientIpAddress(forwardedFor: string | null, realIp: string | null): string {
  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
    if (firstForwardedIp) {
      return firstForwardedIp;
    }
  }

  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function buildDevDiagnosticMessage(
  prefix: string,
  diagnosticPayload: Record<string, unknown>,
): string {
  if (!IS_DEVELOPMENT_ENVIRONMENT) {
    return GENERIC_ERROR_MESSAGE;
  }
  try {
    return `${prefix} ${JSON.stringify(diagnosticPayload)}`;
  } catch {
    return `${prefix} (diagnostic payload not serializable)`;
  }
}

export async function submitWaitlistSignup(
  _previousState: WaitlistActionResult | null,
  formData: FormData,
): Promise<WaitlistActionResult> {
  try {
    // Honeypot check runs first, before Zod and before any I/O. Bots fill
    // every field they detect; humans never see the `company` input because
    // it lives inside an sr-only container. If it has any non-empty value
    // we silently drop the submission and return the same success shape a
    // real signup would receive, so the bot has no signal that it was
    // caught. No insert, no validation, no database round trip.
    const rawHoneypotValue = formData.get("company");
    if (
      typeof rawHoneypotValue === "string" &&
      rawHoneypotValue.trim().length > 0
    ) {
      console.warn(
        "[waitlist] Honeypot triggered, silently dropping submission",
      );
      return {
        status: "success",
        message: SUCCESS_NEW_SIGNUP_MESSAGE,
      };
    }

    const rawEmail = formData.get("email");
    const parsedFormFields = waitlistSignupSchema.safeParse({
      email: typeof rawEmail === "string" ? rawEmail : "",
    });

    if (!parsedFormFields.success) {
      const firstIssue = parsedFormFields.error.issues[0];
      const fieldName: "email" | "form" =
        firstIssue?.path[0] === "email" ? "email" : "form";
      return {
        status: "error",
        message: firstIssue?.message ?? "Please check your input and try again.",
        field: fieldName,
      };
    }

    const { email: validatedEmail } = parsedFormFields.data;

    const requestHeaders = await headers();
    const forwardedForHeader = requestHeaders.get("x-forwarded-for");
    const realIpHeader = requestHeaders.get("x-real-ip");
    const userAgentHeader = requestHeaders.get("user-agent") ?? "unknown";

    const clientIpAddress = readClientIpAddress(forwardedForHeader, realIpHeader);
    const clientIpHash = hashClientIpAddress(clientIpAddress);

    const supabaseClient = getSupabaseServerClient();
    const { error: insertError } = await supabaseClient
      .from(WAITLIST_TABLE_NAME)
      .insert({
        email: validatedEmail,
        ip_hash: clientIpHash,
        user_agent: userAgentHeader,
      });

    if (insertError) {
      if (insertError.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
        return {
          status: "success",
          message: SUCCESS_ALREADY_SIGNED_UP_MESSAGE,
        };
      }

      const insertErrorDiagnostic = {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      };
      console.error("[waitlist] Supabase insert failed", insertErrorDiagnostic);
      return {
        status: "error",
        message: buildDevDiagnosticMessage(
          "DEV insert error:",
          insertErrorDiagnostic,
        ),
        field: "form",
      };
    }

    return {
      status: "success",
      message: SUCCESS_NEW_SIGNUP_MESSAGE,
    };
  } catch (unexpectedError) {
    const errorDiagnostic =
      unexpectedError instanceof Error
        ? {
            name: unexpectedError.name,
            message: unexpectedError.message,
            stack: unexpectedError.stack?.split("\n").slice(0, 4).join(" | "),
          }
        : { raw: String(unexpectedError) };
    console.error("[waitlist] Unexpected action failure", errorDiagnostic);
    return {
      status: "error",
      message: buildDevDiagnosticMessage(
        "DEV unexpected error:",
        errorDiagnostic,
      ),
      field: "form",
    };
  }
}

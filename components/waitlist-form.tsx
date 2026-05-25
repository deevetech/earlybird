"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  submitWaitlistSignup,
  type WaitlistActionResult,
} from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_ACTION_STATE: WaitlistActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-disabled={pending}
      className="h-11 rounded-sm px-5 font-mono text-[0.78rem] uppercase tracking-[0.18em] bg-ink text-paper hover:bg-ink/90 disabled:opacity-60"
    >
      {pending ? "Joining..." : "Join the list"}
    </Button>
  );
}

export function WaitlistForm() {
  const [actionState, formAction] = useActionState(
    submitWaitlistSignup,
    INITIAL_ACTION_STATE,
  );

  const formElementRef = useRef<HTMLFormElement>(null);
  const emailFieldId = useId();
  const emailErrorId = useId();
  const statusRegionId = useId();

  const isSuccessState = actionState?.status === "success";
  const isErrorState = actionState?.status === "error";
  const emailFieldHasError = isErrorState && actionState.field === "email";
  const formLevelErrorMessage =
    isErrorState && actionState.field !== "email" ? actionState.message : null;

  useEffect(() => {
    if (isSuccessState && formElementRef.current) {
      formElementRef.current.reset();
    }
  }, [isSuccessState]);

  if (isSuccessState) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border border-hairline px-5 py-6"
      >
        <p className="smallcaps text-[0.7rem] text-ink-soft">Confirmed</p>
        <p className="mt-2 font-display text-2xl leading-tight text-ink">
          {actionState.message}
        </p>
        <p className="mt-3 font-mono text-[0.78rem] leading-relaxed text-ink-soft">
          One email when it counts. Nothing more.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formElementRef}
      action={formAction}
      noValidate
      className="flex w-full max-w-md flex-col gap-3"
    >
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="company">Company (do not fill)</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label
        htmlFor={emailFieldId}
        className="smallcaps text-[0.7rem] text-ink-soft"
      >
        Email address
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={emailFieldId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@studio.work"
          aria-invalid={emailFieldHasError || undefined}
          aria-describedby={emailFieldHasError ? emailErrorId : undefined}
          className="h-11 rounded-sm border-hairline bg-transparent px-3 font-mono text-base text-ink placeholder:text-ink-soft/60 focus-visible:border-ink focus-visible:ring-0 sm:flex-1"
        />
        <SubmitButton />
      </div>

      {emailFieldHasError ? (
        <p
          id={emailErrorId}
          className="font-mono text-[0.78rem] text-[color:var(--accent-terracotta)]"
        >
          {actionState.message}
        </p>
      ) : null}

      <p
        id={statusRegionId}
        role="status"
        aria-live="polite"
        className="font-mono text-[0.78rem] text-[color:var(--accent-terracotta)]"
      >
        {formLevelErrorMessage}
      </p>

      <p className="font-mono text-[0.72rem] leading-relaxed text-ink-soft">
        No spam. No newsletters. One email when it matters.
      </p>
    </form>
  );
}

# Earlybird — Project Brief for Claude Code

You are continuing work on a Next.js 16 App Router project called **Earlybird**, a one-page waitlist landing page. This brief is the source of truth. Read it fully before touching any file.

## Context

- **Project name:** Earlybird
- **Purpose:** Single-page waitlist signup. Real client screener test, 24-hour deadline.
- **Repo:** https://github.com/deevetech/earlybird
- **Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui (Radix, Nova preset), Supabase, Zod, Vercel deploy
- **Owner:** Deeve (Dinnes), Cadiz City, PH
- **Style rules:** Do not use em dashes or en dashes anywhere. Use commas, periods, parentheses. Variables must be descriptive and unique. Production-grade only, no placeholders, no `TODO`, no demo code.

## Current State (do not redo)

Already complete:

- Next.js scaffold (App Router, TypeScript, Tailwind v4, no `src/` dir)
- shadcn/ui initialized with Radix + Nova preset, `button` and `input` components added
- Dependencies installed: `@supabase/supabase-js`, `zod`
- Git repo initialized, pushed to GitHub `main` branch
- Supabase project provisioned, region Asia-Pacific
- Supabase table `waitlist_signups` created with RLS enabled and these columns:
  - `id uuid primary key default gen_random_uuid()`
  - `email text not null unique`
  - `created_at timestamptz not null default now()`
  - `ip_hash text`
  - `user_agent text`
- Supabase using new key system (`sb_publishable_*` and `sb_secret_*`, not legacy JWT)
- `.env.local` exists with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`
- `.env.example` committed with placeholders
- `.gitignore` has `.env*` and `!.env.example`
- `lib/validation.ts` created with Zod schema for waitlist signup (email + honeypot field named `company`)

## What You Need to Build

### 1. `lib/supabase-server.ts` (verify it exists; create if missing)

Server-only Supabase client using a lazy factory pattern. Must:

- Read `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from env at call time, not import time
- Throw a clear error if either env var is missing
- Disable session persistence and auto-refresh (server-to-server only)
- Export a single function `getSupabaseServerClient()`
- Never imported by client components

### 2. `app/actions/waitlist.ts` (create)

Server Action file with `"use server"` directive. Exports:

- Type `WaitlistActionResult` as a discriminated union: `{ status: "success"; message: string } | { status: "error"; message: string; field?: "email" | "form" }`
- Async function `submitWaitlistSignup(previousState, formData)` with the React `useActionState` signature

Behavior:

1. Read `email` and `company` (honeypot) from FormData
2. Validate with `waitlistSignupSchema` from `lib/validation.ts`
3. If honeypot has any value, return success silently (do not insert)
4. Hash the client IP with SHA-256 (use `node:crypto`). Read IP from `x-forwarded-for` (first item, comma-split, trimmed) or `x-real-ip`, fallback to `"unknown"`
5. Read `user-agent` header
6. Insert `{ email, ip_hash, user_agent }` into `waitlist_signups`
7. Handle Postgres error code `23505` (unique violation) as a soft success: return "You're already on the list."
8. Other DB errors: log via `console.error`, return generic error
9. Wrap in try/catch for unexpected errors

### 3. `components/waitlist-form.tsx` (create)

Client component (`"use client"`). The form UI.

Must:

- Use React 19's `useActionState` hook bound to `submitWaitlistSignup`
- Include a hidden honeypot field named `company` (CSS-hidden via `sr-only` + `aria-hidden`, NOT `display:none` since some bots skip those)
- Use shadcn `Input` and `Button` components
- Handle three states cleanly: idle, pending (button disabled, button text changes to "Joining..."), success (replace form with success message), error (inline error message below input)
- Email input: `type="email"`, `required`, `autoComplete="email"`, `inputMode="email"`, `name="email"`
- Use `useFormStatus` from `react-dom` inside a `SubmitButton` subcomponent for the pending state (cleanest pattern)
- Accessibility: proper label, aria-describedby for errors, aria-live polite region for status messages
- Mobile-first responsive

### 4. `app/page.tsx` (replace existing scaffold)

The landing page. **Editorial / magazine direction.** Black and white with one terracotta accent.

Design spec:

- **Background:** warm off-white `#FAFAF7`
- **Text:** deep ink `#0A0A0A`
- **Accent:** terracotta `#B5472D` (used sparingly: one underline, one small mark)
- **Display font:** Fraunces (Google Fonts), weight 300 to 600, used for the hero headline
- **Body font:** Geist Mono (already in Nova preset) or import IBM Plex Mono if Geist Mono is sans
- **Layout:** asymmetric, NOT centered hero. Hero text left-aligned, form left-aligned. Generous whitespace.
- **Composition zones:**
  - Top bar (thin): tiny "EARLYBIRD" wordmark left, "EST. 2026" right, hairline 1px border below
  - Hero (left half): large serif headline like "Quiet apps for noisy work." or similar editorial copy. Sub-line in mono. Below that, the waitlist form.
  - Right half (desktop only): a tall numbered list of three "principles" (01, 02, 03) with terse two-line descriptions. Mono font, hairline borders between items.
  - Footer (bottom): small mono text, year, "Built by Deeve" link to https://deeve.info, subtle.
- Details: numbered labels using small caps + tracking, hairline 1px borders, no shadows, no gradients, no rounded corners larger than 4px (sharp aesthetic)
- One subtle detail that signals craft: a tiny terracotta dot or asterisk somewhere intentional, NOT decorative chaos

Reference vibe: Linear's landing meets Mast magazine meets Swiss design. Confident, restrained, expensive-looking. The opposite of every default shadcn site.

Write actual editorial copy. Don't use "Lorem ipsum". The product is fictional but should feel real. Something like:

> Headline: "The list before the launch."
> Sub: "Earlybird sends one email when something worth your attention ships. No newsletters, no noise."
> Principles: 01 Signal over volume. 02 Builders, not marketers. 03 Unsubscribe is one click.

Adjust copy if you find something better. Tone: quiet, confident, terse.

### 5. `app/layout.tsx` (modify)

- Replace default fonts with Fraunces (display) and Geist Mono (or IBM Plex Mono) using `next/font/google`
- Set CSS variables `--font-display` and `--font-mono` on the body
- Metadata: title "Earlybird — the list before the launch", description matching the sub-headline, OpenGraph tags, theme color matching the off-white
- HTML lang="en"

### 6. `app/globals.css` (modify)

- Override Tailwind v4 theme tokens to use the editorial palette: off-white background, ink foreground, terracotta accent
- Make sure CSS variables work with shadcn components (the `--background`, `--foreground`, `--primary` tokens shadcn uses)
- Add small caps utility class if not already present in Tailwind
- Smooth font rendering, antialiased

### 7. `README.md` (create)

Production-quality README. Sections:

1. **Earlybird** — one-line description
2. **Live demo** — placeholder for Vercel URL (you fill in after deploy)
3. **Stack** — Next.js 16, TypeScript, Tailwind, shadcn/ui, Supabase, Zod, Vercel
4. **Architecture** — short paragraph on the Server Action flow, why no API route, why service-side Supabase client only
5. **Security** — RLS enabled, secret key server-only, honeypot, IP hashing (not raw), Zod validation
6. **Local development** — clone, `cp .env.example .env.local`, fill in Supabase values, `npm install`, `npm run dev`
7. **Database schema** — SQL block for the `waitlist_signups` table
8. **Deployment** — Vercel steps, env var setup, build command
9. **Known issues** — One note: "postcss < 8.5.10 vulnerability is a transitive dev-only dependency in Next.js, awaiting upstream patch. No runtime exposure."
10. **License** — MIT (or omit if Deeve prefers)
11. **Author** — Deeve / Deeve Technologies, link to deeve.info

Tone: professional, terse, no marketing fluff. The README itself should signal seniority.

## Code Quality Standards

- No em dashes or en dashes anywhere (hard rule)
- Descriptive unique variable names (e.g. `supabaseProjectUrl`, not `url`)
- All user input validated server-side with Zod
- Parameterized DB calls only (Supabase client handles this)
- Server-only env vars never prefixed with `NEXT_PUBLIC_`
- All async operations wrapped in try/catch where they can fail
- All states handled in UI (idle, pending, success, error)
- WCAG AA: proper labels, aria-live for status, sufficient contrast, keyboard navigable
- Mobile-first responsive (test at 320px width)
- No `console.log` left in code (only `console.error` for genuine errors)
- No unused imports
- Run `npx tsc --noEmit` before declaring done, fix any errors

## Acceptance Criteria

The build is done when ALL of these pass:

1. `npm run dev` starts cleanly, no errors in terminal
2. `http://localhost:3000` renders the editorial landing page
3. Submitting a valid email shows the success state and a row appears in Supabase `waitlist_signups`
4. Submitting the same email twice shows "already on the list" (not a crash)
5. Submitting an invalid email shows an inline error
6. Filling the honeypot field via DevTools and submitting returns success but does NOT insert
7. `npx tsc --noEmit` passes with zero errors
8. `npm run build` succeeds with zero errors
9. The page is responsive at 320px, 768px, and 1280px widths
10. Keyboard tab order is logical, focus rings visible
11. README is complete and accurate

## Workflow

Work in this order:

1. Verify or create `lib/supabase-server.ts`
2. Create `app/actions/waitlist.ts`
3. Update `app/globals.css` with editorial palette
4. Update `app/layout.tsx` with fonts and metadata
5. Create `components/waitlist-form.tsx`
6. Replace `app/page.tsx` with editorial layout
7. Create `README.md`
8. Run `npx tsc --noEmit` and `npm run build`, fix any issues
9. Commit in logical chunks with Conventional Commits style (e.g. `feat: add waitlist server action`, `feat: build editorial landing page`, `docs: add readme`)

After everything compiles and the dev server confirms the page works, stop and report back to Deeve so he can do a visual review and deploy to Vercel.

## Do NOT

- Do NOT add features beyond this spec (no auth, no admin page, no analytics, no extra pages)
- Do NOT install additional dependencies without asking
- Do NOT use em dashes or en dashes
- Do NOT commit `.env.local`
- Do NOT modify `.gitignore` unless adding `!.env.example` is missing
- Do NOT use generic Inter/Geist/Roboto defaults for the display font, the editorial direction requires Fraunces or similar serif
- Do NOT center the hero (asymmetric layout is intentional)
- Do NOT add purple/blue gradients, dark mode toggle, or other generic AI-aesthetic patterns
- Do NOT touch the Supabase schema, it is already correct

End of brief.

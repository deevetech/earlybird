# Earlybird

One-page waitlist for product launches that respect the inbox. One email when something ships. No newsletters, no noise.

## Live demo
https://earlybird-omega.vercel.app/

## Stack

- Next.js 16 (App Router, React 19)
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui on Radix (Nova preset)
- Supabase (Postgres + RLS)
- Zod for validation
- Vercel for hosting

## Architecture

A single Server Action (`app/actions/waitlist.ts`) handles the entire submission flow. There is no API route, no client-side data fetching, and no exposed key on the browser. The Server Action validates the form with the shared Zod schema in `lib/validation.ts`, hashes the request IP, then writes a row through a server-only Supabase client (`lib/supabase-server.ts`) created with the Supabase secret key. The client component (`components/waitlist-form.tsx`) talks to the action through React 19's `useActionState`, and uses `useFormStatus` inside a dedicated submit button to render the pending state cleanly.

## Security

- Supabase RLS is enabled on `waitlist_signups`. Inserts run through `service_role` via the server-only secret key, scoped by an explicit policy in the migration in `supabase/migrations/`. The secret key is never exposed to the browser.
- `SUPABASE_SECRET_KEY` is read at request time and is never prefixed with `NEXT_PUBLIC_`.
- Every payload is parsed server-side with Zod. Invalid input is rejected before it touches the database.
- A CSS-hidden honeypot field named `company` traps naive bots. Any non-empty value short-circuits to a silent success without an insert.
- Client IP is hashed with SHA-256 before storage. The raw IP never lands on disk.
- Supabase parameterizes all queries, so user input cannot be concatenated into SQL.
- The unique constraint on `email` makes duplicate signups a no-op with a friendly message rather than an error.

## Local development

```bash
git clone https://github.com/deevetech/earlybird.git
cd earlybird
cp .env.example .env.local
# Fill in SUPABASE_URL and SUPABASE_SECRET_KEY from the Supabase dashboard.
npm install
npm run dev
```

Open http://localhost:3000.

## Database schema

```sql
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

alter table public.waitlist_signups enable row level security;
```

## Database setup

Before the form will accept its first signup, two SQL operations must run against the Supabase project, in order:

1. **Create the table.** The `CREATE TABLE` block above is the canonical schema. Run it once when the project is first provisioned. It is already in place on the current Supabase project; new environments need it.
2. **Grant API role privileges.** The file [`supabase/migrations/0001_grant_waitlist_privileges.sql`](supabase/migrations/0001_grant_waitlist_privileges.sql) grants the privileges the Server Action needs and adds an explicit insert policy for `service_role`. Run it once per environment.

Both files are designed to be pasted into the Supabase Dashboard SQL Editor (Project → SQL Editor → New query → Run). The migration is idempotent.

The GRANT migration is mandatory because of Supabase's 2025 API key system migration. Projects using the new opaque `sb_publishable_*` and `sb_secret_*` keys no longer get the implicit blanket privileges the legacy `service_role` JWT used to carry. Without the migration, inserts fail with Postgres error `42501, permission denied for table waitlist_signups`. The application code is identical between the two key systems; only the database authorization layer changed.

For any future environment (a staging project, a fresh local Supabase, a new production project), run both blocks before the first deploy or the form will return the generic error from `app/actions/waitlist.ts`.

## Deployment

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Set environment variables in the Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
4. Use the default Next.js build settings (`npm run build`, output `.next`).
5. Trigger a deploy. The Server Action runs on Vercel's Node runtime.

## Known issues

`postcss` below 8.5.10 currently shows up as a transitive dev-only dependency through Next.js. There is no runtime exposure (it is only invoked by the build pipeline) and a fix will land once the upstream patch is released. Production builds and runtime behavior are unaffected.

## License

MIT.

## Author

Deeve, Deeve Technologies. https://deeve.info

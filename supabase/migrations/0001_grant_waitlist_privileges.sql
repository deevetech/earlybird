-- Migration: 0001_grant_waitlist_privileges
-- Purpose:   Grant the table-level privileges the waitlist Server Action needs.
--
-- Context:
--   In late 2025 Supabase migrated from the legacy JWT-based API key system
--   (anon JWT, service_role JWT) to a new opaque-token key system
--   (sb_publishable_*, sb_secret_*). Under the legacy system, the
--   service_role JWT was hard wired to bypass RLS and silently inherited
--   broad privileges on every table in the public schema. Under the new
--   system, Supabase enforces the underlying Postgres GRANTs strictly: a
--   freshly created table will reject INSERTs from the API role until those
--   GRANTs are added explicitly.
--
--   This migration adds the minimum privileges needed for the public
--   waitlist signup flow and for any future internal tooling that may read
--   the table with a server-side client. It is safe to run more than once.
--
-- Roles:
--   anon            Public, unauthenticated requests. The waitlist form
--                   never submits with an anon key today, but granting
--                   INSERT here keeps the door open for a future move to a
--                   client-side insert with an RLS policy.
--   authenticated   Logged in users. Same rationale as anon.
--   service_role    The role the new sb_secret_* server key maps to. The
--                   Server Action in app/actions/waitlist.ts runs here.
--
-- Notes:
--   - RLS is already enabled on public.waitlist_signups. service_role is
--     designed to bypass RLS, but the explicit insert policy at the bottom
--     of this file makes the bypass deterministic across key system
--     versions and Supabase platform updates.
--   - SELECT is granted alongside INSERT because PostgREST issues an
--     implicit RETURNING on insert. Without SELECT the API call returns a
--     misleading permission error even when the row is written.

begin;

-- Schema usage is a prerequisite for any object access in public.
grant usage on schema public to anon, authenticated, service_role;

-- The privileges the Server Action actually exercises.
grant select, insert on table public.waitlist_signups
  to anon, authenticated, service_role;

-- Explicit RLS policy for service_role inserts. Idempotent.
drop policy if exists "service_role can insert waitlist signups"
  on public.waitlist_signups;

create policy "service_role can insert waitlist signups"
  on public.waitlist_signups
  for insert
  to service_role
  with check (true);

commit;

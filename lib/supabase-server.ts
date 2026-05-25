import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * Uses a lazy factory pattern so env vars are read at call time (not import
 * time). This keeps build-time evaluation safe and gives us a clear error
 * message at the first request if the environment is misconfigured.
 *
 * The secret key is read from `SUPABASE_SECRET_KEY`, matching the new
 * Supabase API key naming convention. The new Supabase key system uses
 * `sb_secret_*` strings; the client treats them as opaque bearer tokens, so
 * no extra configuration is needed.
 *
 * Do not import this module from any client component.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const supabaseProjectUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseProjectUrl) {
    throw new Error(
      "Missing SUPABASE_URL environment variable. Set it in .env.local for local development or in the Vercel project settings for production.",
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY environment variable. Set it in .env.local for local development or in the Vercel project settings for production.",
    );
  }

  return createClient(supabaseProjectUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseSecretKey}`,
        apikey: supabaseSecretKey,
      },
    },
  });
}

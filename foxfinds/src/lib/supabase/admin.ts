import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (service role).
 * Bypasses RLS — NEVER import this into a client component or expose the key.
 * Used to read public-safe fields of Listed items for the storefront.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars are not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

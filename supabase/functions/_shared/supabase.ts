import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Service-role client for edge functions. Bypasses RLS entirely, so this
 * must only ever be used after requireAuth() (auth-guard.ts) has confirmed
 * the caller holds a valid admin session — there's no other gate.
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by
 * the platform on every function; no manual secret to set.
 */
export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

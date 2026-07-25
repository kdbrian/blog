import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { id, label, url, sortOrder } = await req.json();
    if (!url || !url.trim()) return jsonResponse({ error: "URL is required." }, 400);

    const supabase = serviceClient();
    const row = { label: label || null, url, sort_order: sortOrder ?? 0 };

    const { data, error } = id
      ? await supabase.from("social_links").update(row).eq("id", id).select().single()
      : await supabase.from("social_links").insert(row).select().single();
    if (error) throw error;

    return jsonResponse({ id: data.id });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

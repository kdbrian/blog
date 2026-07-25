import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { id } = await req.json();
    if (!id) return jsonResponse({ error: "Invalid id." }, 400);

    const supabase = serviceClient();
    // milestone_skills rows for this milestone are removed automatically (on delete cascade).
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

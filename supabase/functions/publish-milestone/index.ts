import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { id, date, title, description, url, theme, skillIds } = await req.json();

    if (!title) {
      return jsonResponse({ error: "Title is required." }, 400);
    }

    const cleanDate = date || new Date().toISOString().slice(0, 10);
    const milestoneId = id || `${cleanDate}-${slugify(title)}`;
    const supabase = serviceClient();

    const { error } = await supabase.from("milestones").upsert(
      {
        id: milestoneId,
        date: cleanDate,
        title,
        description: description || null,
        url: url || null,
        theme: theme || null,
      },
      { onConflict: "id" }
    );
    if (error) throw error;

    await supabase.from("milestone_skills").delete().eq("milestone_id", milestoneId);
    if (Array.isArray(skillIds) && skillIds.length > 0) {
      const { error: skillErr } = await supabase
        .from("milestone_skills")
        .insert(skillIds.map((skill_id: string) => ({ milestone_id: milestoneId, skill_id })));
      if (skillErr) throw skillErr;
    }

    return jsonResponse({ ok: true, id: milestoneId });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

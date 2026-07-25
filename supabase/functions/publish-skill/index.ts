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
    const { name, dateAdded } = await req.json();
    if (!name || !name.trim()) {
      return jsonResponse({ error: "Skill name is required." }, 400);
    }

    const cleanName = name.trim();
    const id = slugify(cleanName);
    const supabase = serviceClient();

    // Upsert on the name (case-sensitive) — if a skill with this slug id
    // already exists, just return it rather than erroring, so a Studio user
    // retyping an existing skill name behaves like "select" not "fail".
    const { data: existing } = await supabase.from("skills").select("*").eq("id", id).maybeSingle();
    if (existing) {
      return jsonResponse({ skill: { id: existing.id, name: existing.name, dateAdded: existing.date_added } });
    }

    const row: Record<string, unknown> = { id, name: cleanName };
    if (dateAdded) row.date_added = dateAdded;

    const { data, error } = await supabase.from("skills").insert(row).select().single();
    if (error) throw error;

    return jsonResponse({ skill: { id: data.id, name: data.name, dateAdded: data.date_added } });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

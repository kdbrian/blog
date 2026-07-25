import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

const KINDS = ["education", "experience"];

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { id, kind, title, org, startDate, endDate, description, url, sortOrder } = await req.json();

    if (!KINDS.includes(kind)) {
      return jsonResponse({ error: "kind must be 'education' or 'experience'." }, 400);
    }
    if (!title || !title.trim()) {
      return jsonResponse({ error: "Title is required." }, 400);
    }
    if (!startDate) {
      return jsonResponse({ error: "Start date is required." }, 400);
    }
    if (endDate && endDate < startDate) {
      return jsonResponse({ error: "End date can't be before the start date." }, 400);
    }

    const supabase = serviceClient();
    const row = {
      kind,
      title,
      org: org || "",
      start_date: startDate,
      end_date: endDate || null,
      description: description || null,
      url: url || null,
      sort_order: sortOrder ?? 0,
    };

    const { data, error } = id
      ? await supabase.from("history_entries").update(row).eq("id", id).select().single()
      : await supabase.from("history_entries").insert(row).select().single();
    if (error) throw error;

    return jsonResponse({ id: data.id });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

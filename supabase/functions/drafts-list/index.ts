import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const drafts = (data || []).map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt,
      tags: d.tags,
      cover: d.cover,
      body: d.body,
      format: d.format,
      updatedAt: new Date(d.updated_at).getTime(),
      publishedSlug: d.published_slug ?? undefined,
    }));

    return jsonResponse({ drafts });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

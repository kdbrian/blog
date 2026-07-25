import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { id, title, slug, excerpt, tags, cover, body, format, publishedSlug } = await req.json();
    if (!id) return jsonResponse({ error: "Draft id is required." }, 400);

    const supabase = serviceClient();
    const { error } = await supabase.from("drafts").upsert(
      {
        id,
        title: title || "",
        slug: slug || "",
        excerpt: excerpt || "",
        tags: tags || [],
        cover: cover || "",
        body: body || "",
        format: format === "markdown" ? "markdown" : "html",
        published_slug: publishedSlug || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

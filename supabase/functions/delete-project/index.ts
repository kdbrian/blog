import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

const SLUG_RE = /^[a-z0-9-]+$/;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { slug, deleteMedia } = await req.json();
    if (!slug || !SLUG_RE.test(slug)) {
      return jsonResponse({ error: "Invalid slug." }, 400);
    }

    const supabase = serviceClient();

    // project_skills rows for this project are removed automatically (on delete cascade).
    const { error } = await supabase.from("projects").delete().eq("slug", slug);
    if (error) throw error;

    if (deleteMedia) {
      const { data: files, error: listErr } = await supabase.storage.from("media").list(`projects/${slug}`);
      if (listErr) throw listErr;
      if (files?.length) {
        const paths = files.map((f) => `projects/${slug}/${f.name}`);
        const { error: removeErr } = await supabase.storage.from("media").remove(paths);
        if (removeErr) throw removeErr;
      }
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

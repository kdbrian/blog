import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { headline, tagline, bio, location, imageUrl, shapeSeed, shapePoints, shapeIrregularity } =
      await req.json();

    const row = {
      headline: headline ?? "",
      tagline: tagline ?? "",
      bio: bio ?? "",
      location: location ?? "",
      image_url: imageUrl ?? null,
      shape_seed: shapeSeed ?? 1,
      shape_points: shapePoints ?? 7,
      shape_irregularity: shapeIrregularity ?? 0.35,
      updated_at: new Date().toISOString(),
    };

    const supabase = serviceClient();
    const { error } = await supabase.from("profile").update(row).eq("id", "main");
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

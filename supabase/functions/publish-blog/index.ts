import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Defense-in-depth only — the site's renderer runs DOMPurify on every post
 * at render time regardless. This just keeps obviously hostile markup out
 * of the stored row itself.
 */
function stripDangerousHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { slug, title, body, format, excerpt, tags, cover, date, theme, skillIds } = await req.json();

    if (!slug || !SLUG_RE.test(slug)) {
      return jsonResponse({ error: "Slug must be lowercase letters, numbers, and hyphens only." }, 400);
    }
    if (!title || !body) {
      return jsonResponse({ error: "Title and body are required." }, 400);
    }

    const cleanFormat = format === "markdown" ? "markdown" : "html";
    const cleanBody = cleanFormat === "html" ? stripDangerousHtml(body) : body;
    const supabase = serviceClient();

    const { error } = await supabase.from("posts").upsert(
      {
        slug,
        title,
        body: cleanBody,
        format: cleanFormat,
        excerpt: excerpt || null,
        cover: cover || null,
        tags: tags || [],
        theme: theme || null,
        date: date || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw error;

    await supabase.from("post_skills").delete().eq("post_slug", slug);
    if (Array.isArray(skillIds) && skillIds.length > 0) {
      const { error: skillErr } = await supabase
        .from("post_skills")
        .insert(skillIds.map((skill_id: string) => ({ post_slug: slug, skill_id })));
      if (skillErr) throw skillErr;
    }

    return jsonResponse({ ok: true, slug });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

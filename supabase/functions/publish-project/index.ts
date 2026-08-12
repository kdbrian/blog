import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

const SLUG_RE = /^[a-z0-9-]+$/;
const GITHUB_URL_RE = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i;
const STATUSES = ["planned", "active", "paused", "completed"];
const PRIORITIES = ["low", "medium", "high"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface MilestoneInput {
  id?: string;
  title?: string;
  date?: string;
  completed?: boolean;
  sortOrder?: number;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const {
      slug,
      title,
      summary,
      description,
      notes,
      images,
      tags,
      theme,
      repoUrl,
      playStoreUrl,
      links,
      featured,
      status,
      priority,
      dueDate,
      client,
      engagement,
      skillIds,
      milestones,
    } = await req.json();

    if (!slug || !SLUG_RE.test(slug)) {
      return jsonResponse({ error: "Slug must be lowercase letters, numbers, and hyphens only." }, 400);
    }
    if (!title) {
      return jsonResponse({ error: "Title is required." }, 400);
    }
    if (repoUrl && !GITHUB_URL_RE.test(repoUrl)) {
      return jsonResponse(
        { error: "Repo URL must look like https://github.com/owner/repo, or leave it blank for a private project." },
        400
      );
    }
    if (status && !STATUSES.includes(status)) {
      return jsonResponse({ error: `Status must be one of: ${STATUSES.join(", ")}.` }, 400);
    }
    if (priority && !PRIORITIES.includes(priority)) {
      return jsonResponse({ error: `Priority must be one of: ${PRIORITIES.join(", ")}.` }, 400);
    }

    const supabase = serviceClient();

    const { error } = await supabase.from("projects").upsert(
      {
        slug,
        title,
        summary: summary || "",
        description: description || "",
        notes: notes || "",
        images: images || [],
        tags: tags || [],
        theme: theme || null,
        repo_url: repoUrl || null,
        play_store_url: playStoreUrl || null,
        links: Array.isArray(links) ? links.filter((l) => l && l.url) : [],
        featured: !!featured,
        status: status || "planned",
        priority: priority || "medium",
        due_date: dueDate || null,
        client: client || null,
        engagement: engagement || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw error;

    await supabase.from("project_skills").delete().eq("project_slug", slug);
    if (Array.isArray(skillIds) && skillIds.length > 0) {
      const { error: skillErr } = await supabase
        .from("project_skills")
        .insert(skillIds.map((skill_id: string) => ({ project_slug: slug, skill_id })));
      if (skillErr) throw skillErr;
    }

    await supabase.from("project_milestones").delete().eq("project_slug", slug);
    if (Array.isArray(milestones) && milestones.length > 0) {
      const milestoneLinks: { project_slug: string; milestone_id: string; completed: boolean; sort_order: number }[] = [];
      for (const [i, m] of (milestones as MilestoneInput[]).entries()) {
        let milestoneId = m.id;
        if (!milestoneId) {
          // Standalone milestone created inline for this project — create the
          // underlying milestones row (same id scheme as publish-milestone)
          // before linking it.
          if (!m.title) continue;
          const cleanDate = m.date || new Date().toISOString().slice(0, 10);
          milestoneId = `${cleanDate}-${slugify(m.title)}`;
          const { error: msError } = await supabase.from("milestones").upsert(
            { id: milestoneId, date: cleanDate, title: m.title },
            { onConflict: "id" }
          );
          if (msError) throw msError;
        }
        milestoneLinks.push({
          project_slug: slug,
          milestone_id: milestoneId,
          completed: !!m.completed,
          sort_order: m.sortOrder ?? i,
        });
      }
      if (milestoneLinks.length > 0) {
        const { error: linkErr } = await supabase.from("project_milestones").insert(milestoneLinks);
        if (linkErr) throw linkErr;
      }
    }

    return jsonResponse({ ok: true, slug });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

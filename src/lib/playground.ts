import { restGet } from "@/lib/supabase-rest";

export interface SkillHistoryItem {
  type: "post" | "project" | "milestone";
  date: string;
  title: string;
  href?: string;
  description?: string;
}

type PostRow = { slug: string; title: string; date: string; excerpt: string | null };
type ProjectRow = { slug: string; title: string; description: string; created_at: string; repo_url: string | null };
type MilestoneRow = { id: string; title: string; date: string; description: string | null };

export async function fetchSkillHistory(skillId: string): Promise<SkillHistoryItem[]> {
  const id = encodeURIComponent(skillId);
  const [postRows, projectRows, milestoneRows] = await Promise.all([
    restGet<{ post: PostRow }[]>(`post_skills?select=post:posts(slug,title,date,excerpt)&skill_id=eq.${id}`),
    restGet<{ project: ProjectRow }[]>(
      `project_skills?select=project:projects(slug,title,description,created_at,repo_url)&skill_id=eq.${id}`
    ),
    restGet<{ milestone: MilestoneRow }[]>(
      `milestone_skills?select=milestone:milestones(id,title,date,description)&skill_id=eq.${id}`
    ),
  ]);

  const items: SkillHistoryItem[] = [
    ...postRows.map((r) => ({
      type: "post" as const,
      date: r.post.date,
      title: r.post.title,
      href: `${import.meta.env.BASE_URL}${r.post.slug}`,
      description: r.post.excerpt ?? undefined,
    })),
    ...projectRows.map((r) => ({
      type: "project" as const,
      date: r.project.created_at,
      title: r.project.title,
      href: r.project.repo_url ?? undefined,
      description: r.project.description,
    })),
    ...milestoneRows.map((r) => ({
      type: "milestone" as const,
      date: r.milestone.date,
      title: r.milestone.title,
      description: r.milestone.description ?? undefined,
    })),
  ];

  return items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

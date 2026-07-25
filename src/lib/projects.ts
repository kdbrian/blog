import type { Project, ProjectLink, Skill, Theme } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SkillRow = { id: string; name: string; date_added: string };
type ProjectRow = {
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  notes: string | null;
  images: string[];
  tags: string[];
  theme: Theme | null;
  repo_url: string | null;
  play_store_url: string | null;
  links: ProjectLink[] | null;
  featured: boolean;
  project_skills: { skill: SkillRow }[];
};

const SELECT = "*,project_skills(skill:skills(id,name,date_added))";

function mapSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, dateAdded: row.date_added };
}

function mapProject(row: ProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary || undefined,
    description: row.description,
    notes: row.notes || "",
    images: row.images || [],
    tags: row.tags || [],
    theme: row.theme,
    repoUrl: row.repo_url || "",
    playStoreUrl: row.play_store_url ?? undefined,
    links: row.links || [],
    featured: row.featured,
    skills: (row.project_skills || []).map((ps) => mapSkill(ps.skill)),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const rows = await restGet<ProjectRow[]>(
    `projects?select=${SELECT}&order=featured.desc,created_at.desc`
  );
  return rows.map(mapProject);
}

export async function fetchProjectBySlug(slug: string): Promise<Project | undefined> {
  const rows = await restGet<ProjectRow[]>(
    `projects?select=${SELECT}&slug=eq.${encodeURIComponent(slug)}`
  );
  return rows[0] ? mapProject(rows[0]) : undefined;
}

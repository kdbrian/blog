import type { Project, ProjectLink, ProjectMilestone, ProjectPriority, ProjectStatus, Skill, Theme } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SkillRow = { id: string; name: string; date_added: string };
type MilestoneRow = { id: string; title: string; date: string; description: string | null; url: string | null };
type ProjectMilestoneRow = { completed: boolean; sort_order: number; milestone: MilestoneRow };
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
  status: ProjectStatus;
  priority: ProjectPriority;
  due_date: string | null;
  client: string | null;
  engagement: string | null;
  project_skills: { skill: SkillRow }[];
  project_milestones: ProjectMilestoneRow[];
};

const SELECT =
  "*,project_skills(skill:skills(id,name,date_added))," +
  "project_milestones(completed,sort_order,milestone:milestones(id,title,date,description,url))";

function mapSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, dateAdded: row.date_added };
}

function mapMilestone(row: ProjectMilestoneRow): ProjectMilestone {
  return {
    id: row.milestone.id,
    title: row.milestone.title,
    date: row.milestone.date,
    description: row.milestone.description ?? undefined,
    url: row.milestone.url ?? undefined,
    completed: row.completed,
    sortOrder: row.sort_order,
  };
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
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    client: row.client ?? undefined,
    engagement: row.engagement ?? undefined,
    milestones: (row.project_milestones || [])
      .map(mapMilestone)
      .sort((a, b) => a.sortOrder - b.sortOrder),
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

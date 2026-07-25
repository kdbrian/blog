import type { ActivityEntry, Skill, Theme } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SkillRow = { id: string; name: string; date_added: string };
type MilestoneRow = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  url: string | null;
  theme: Theme | null;
  milestone_skills: { skill: SkillRow }[];
};

const SELECT = "*,milestone_skills(skill:skills(id,name,date_added))";

function mapSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, dateAdded: row.date_added };
}

function mapMilestone(row: MilestoneRow): ActivityEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description ?? undefined,
    url: row.url ?? undefined,
    theme: row.theme,
    skills: (row.milestone_skills || []).map((ms) => mapSkill(ms.skill)),
  };
}

export async function fetchMilestones(): Promise<ActivityEntry[]> {
  const rows = await restGet<MilestoneRow[]>(`milestones?select=${SELECT}&order=date.desc`);
  return rows.map(mapMilestone);
}

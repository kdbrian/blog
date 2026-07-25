import type { Skill } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SkillRow = { id: string; name: string; date_added: string };

function mapSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, dateAdded: row.date_added };
}

export async function fetchSkills(): Promise<Skill[]> {
  const rows = await restGet<SkillRow[]>("skills?select=*&order=date_added.asc");
  return rows.map(mapSkill);
}

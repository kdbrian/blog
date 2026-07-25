import type { Post, PostFormat, Skill, Theme } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SkillRow = { id: string; name: string; date_added: string };
type PostRow = {
  slug: string;
  title: string;
  body: string;
  format: PostFormat;
  excerpt: string | null;
  cover: string | null;
  tags: string[];
  theme: Theme | null;
  date: string;
  post_skills: { skill: SkillRow }[];
};

const SELECT = "*,post_skills(skill:skills(id,name,date_added))";

function mapSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, dateAdded: row.date_added };
}

function mapPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    body: row.body,
    format: row.format,
    excerpt: row.excerpt ?? undefined,
    cover: row.cover ?? undefined,
    tags: row.tags || [],
    theme: row.theme,
    date: row.date,
    skills: (row.post_skills || []).map((ps) => mapSkill(ps.skill)),
  };
}

export async function fetchPosts(): Promise<Post[]> {
  const rows = await restGet<PostRow[]>(`posts?select=${SELECT}&order=date.desc`);
  return rows.map(mapPost);
}

export async function fetchPostBySlug(slug: string): Promise<Post | undefined> {
  const rows = await restGet<PostRow[]>(`posts?select=${SELECT}&slug=eq.${encodeURIComponent(slug)}`);
  return rows[0] ? mapPost(rows[0]) : undefined;
}

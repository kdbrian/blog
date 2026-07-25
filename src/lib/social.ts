import type { SocialLink } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type SocialLinkRow = { id: string; label: string | null; url: string; sort_order: number };

function mapSocialLink(row: SocialLinkRow): SocialLink {
  return { id: row.id, label: row.label ?? undefined, url: row.url, sortOrder: row.sort_order };
}

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  const rows = await restGet<SocialLinkRow[]>("social_links?select=*&order=sort_order.asc");
  return rows.map(mapSocialLink);
}

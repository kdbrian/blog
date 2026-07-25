import type { HistoryEntry, HistoryKind } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type HistoryRow = {
  id: string;
  kind: HistoryKind;
  title: string;
  org: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  url: string | null;
  sort_order: number;
};

function mapHistoryEntry(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    org: row.org,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    description: row.description ?? undefined,
    url: row.url ?? undefined,
    sortOrder: row.sort_order,
  };
}

export async function fetchHistoryEntries(kind: HistoryKind): Promise<HistoryEntry[]> {
  const rows = await restGet<HistoryRow[]>(
    `history_entries?select=*&kind=eq.${kind}&order=start_date.desc`,
  );
  return rows.map(mapHistoryEntry);
}

import { api } from "@/lib/api";

export interface Draft {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  cover: string;
  body: string;
  format: "html" | "markdown";
  updatedAt: number;
  publishedSlug?: string; // set once this draft has been published, for edit-in-place
}

/** Cross-device: backed by the drafts table via edge functions, not localStorage. */
export async function listDrafts(): Promise<Draft[]> {
  const { drafts } = await api.listDrafts();
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveDraft(draft: Draft): Promise<void> {
  await api.saveDraft(draft);
}

export async function deleteDraft(id: string): Promise<void> {
  await api.deleteDraft(id);
}

export function newDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    excerpt: "",
    tags: [],
    cover: "",
    body: "",
    format: "html",
    updatedAt: Date.now(),
  };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

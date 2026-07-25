import { getValidToken, touchSession } from "@/lib/auth";
import type { Draft } from "@/lib/drafts";
import type { HistoryKind, ProjectLink, Skill, Theme } from "@/types/content";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, body: unknown, requireAuth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (requireAuth) {
    const token = getValidToken();
    if (!token) throw new ApiError("Session expired — please log in again.", 401);
    headers.Authorization = `Bearer ${token}`;
    touchSession();
  }

  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export const api = {
  login: (password: string) => call<{ token: string }>("auth", { password }, false),

  publishPost: (post: {
    slug: string;
    title: string;
    body: string;
    format: "html" | "markdown";
    excerpt?: string;
    tags?: string[];
    cover?: string;
    date?: string;
    theme?: Theme | null;
    skillIds?: string[];
  }) => call<{ ok: true; slug: string }>("publish-blog", post),

  deletePost: (slug: string, deleteMedia: boolean) =>
    call<{ ok: true }>("delete-blog", { slug, deleteMedia }),

  publishProject: (project: {
    slug: string;
    title: string;
    summary?: string;
    description: string;
    notes?: string;
    images: string[];
    tags?: string[];
    theme?: Theme | null;
    repoUrl: string;
    playStoreUrl?: string;
    links?: ProjectLink[];
    featured?: boolean;
    skillIds?: string[];
  }) => call<{ ok: true; slug: string }>("publish-project", project),

  deleteProject: (slug: string, deleteMedia: boolean) =>
    call<{ ok: true }>("delete-project", { slug, deleteMedia }),

  uploadMedia: (filename: string, base64: string, folder: "blog-images" | "projects" | "profile", slug: string) =>
    call<{ path: string; url: string }>("upload-media", { filename, base64, folder, slug }),

  publishMilestone: (milestone: {
    id?: string;
    date?: string;
    title: string;
    description?: string;
    url?: string;
    theme?: Theme | null;
    skillIds?: string[];
  }) => call<{ ok: true; id: string }>("publish-milestone", milestone),

  deleteMilestone: (id: string) => call<{ ok: true }>("delete-milestone", { id }),

  publishSkill: (skill: { name: string; dateAdded?: string }) =>
    call<{ skill: Skill }>("publish-skill", skill),

  listDrafts: () => call<{ drafts: Draft[] }>("drafts-list", {}),

  saveDraft: (draft: Draft) => call<{ ok: true }>("drafts-save", draft),

  deleteDraft: (id: string) => call<{ ok: true }>("drafts-delete", { id }),

  publishSocialLink: (link: { id?: string; label?: string; url: string; sortOrder?: number }) =>
    call<{ id: string }>("publish-social-link", link),

  deleteSocialLink: (id: string) => call<{ ok: true }>("delete-social-link", { id }),

  publishProfile: (profile: {
    headline: string;
    tagline: string;
    bio: string;
    location: string;
    imageUrl?: string;
    shapeSeed: number;
    shapePoints: number;
    shapeIrregularity: number;
  }) => call<{ ok: true }>("publish-profile", profile),

  publishHistoryEntry: (entry: {
    id?: string;
    kind: HistoryKind;
    title: string;
    org?: string;
    startDate: string;
    endDate?: string | null;
    description?: string;
    url?: string;
    sortOrder?: number;
  }) => call<{ id: string }>("publish-history-entry", entry),

  deleteHistoryEntry: (id: string) => call<{ ok: true }>("delete-history-entry", { id }),
};

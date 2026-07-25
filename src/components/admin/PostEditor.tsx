import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, FileText, Globe, Pencil, Plus, Send, Trash2, Loader2 } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import TagInput from "@/components/admin/TagInput";
import SkillPicker from "@/components/admin/SkillPicker";
import ThemePicker from "@/components/admin/ThemePicker";
import PostRenderer from "@/components/blog/PostRenderer";
import ThemeBanner from "@/components/ThemeBanner";
import { api, ApiError } from "@/lib/api";
import { deleteDraft, listDrafts, newDraft, saveDraft, slugify, type Draft } from "@/lib/drafts";
import { fetchPostBySlug, fetchPosts } from "@/lib/posts";
import type { Post, Skill, Theme } from "@/types/content";

type Screen = "list" | "view" | "edit";

export default function PostEditor() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("list");
  const [activePost, setActivePost] = useState<Post | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [skills, setSkills] = useState<Skill[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    Promise.all([listDrafts(), fetchPosts()]).then(([ds, posts]) => {
      setDrafts(ds);
      setPublishedPosts(posts);
      setLoading(false);
    });
  }, []);

  function update(patch: Partial<Draft>) {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    setSaveState("idle");
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      await saveDraft(updated);
      setDrafts(await listDrafts());
      setSaveState("saved");
    }, 600);
  }

  async function openNewDraft() {
    const d = newDraft();
    await saveDraft(d);
    setDrafts(await listDrafts());
    setActiveId(d.id);
    setDraft(d);
    setSkills([]);
    setTheme(null);
    setPublishError(null);
    setScreen("edit");
  }

  function openDraftForEdit(id: string) {
    const d = drafts.find((x) => x.id === id);
    if (!d) return;
    setActiveId(id);
    setDraft(d);
    setPublishError(null);
    const p = d.publishedSlug ? publishedPosts.find((x) => x.slug === d.publishedSlug) : undefined;
    setSkills(p?.skills || []);
    setTheme(p?.theme || null);
    setScreen("edit");
  }

  async function openPublishedView(slug: string) {
    const post = await fetchPostBySlug(slug);
    if (!post) return;
    setActivePost(post);
    setScreen("view");
  }

  async function editFromView(post: Post) {
    const existing = drafts.find((d) => d.publishedSlug === post.slug);
    let d: Draft;
    if (existing) {
      d = existing;
    } else {
      d = {
        id: crypto.randomUUID(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        tags: post.tags || [],
        cover: post.cover || "",
        body: post.body,
        format: post.format,
        updatedAt: Date.now(),
        publishedSlug: post.slug,
      };
      await saveDraft(d);
      setDrafts(await listDrafts());
    }
    setActiveId(d.id);
    setDraft(d);
    setSkills(post.skills || []);
    setTheme(post.theme || null);
    setPublishError(null);
    setScreen("edit");
  }

  async function removeDraft(id: string) {
    await deleteDraft(id);
    setDrafts(await listDrafts());
  }

  async function handlePublish() {
    if (!draft.title.trim() || !draft.body.trim()) {
      setPublishError("Title and body are required.");
      setPublishState("error");
      return;
    }
    const wasAlreadyPublished = !!draft.publishedSlug;
    setPublishState("publishing");
    setPublishError(null);
    try {
      const slug = draft.publishedSlug || slugify(draft.title);
      await api.publishPost({
        slug,
        title: draft.title,
        body: draft.body,
        format: "html",
        excerpt: draft.excerpt || undefined,
        tags: draft.tags,
        cover: draft.cover || undefined,
        theme,
        skillIds: skills.map((s) => s.id),
      });
      const updatedDraft = { ...draft, publishedSlug: slug, slug };
      await saveDraft(updatedDraft);
      setDraft(updatedDraft);
      setDrafts(await listDrafts());
      const posts = await fetchPosts();
      setPublishedPosts(posts);
      setPublishState("idle");

      if (wasAlreadyPublished) {
        setActivePost(posts.find((p) => p.slug === slug) || null);
        setScreen("view");
      } else {
        setScreen("list");
      }
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Publish failed.");
      setPublishState("error");
    }
  }

  async function handleDelete(deleteMedia: boolean) {
    const slug = activePost?.slug;
    if (!slug) return;
    await api.deletePost(slug, deleteMedia);
    setConfirmingDelete(false);
    setPublishedPosts(await fetchPosts());
    const linkedDraft = drafts.find((d) => d.publishedSlug === slug);
    if (linkedDraft) await removeDraft(linkedDraft.id);
    setScreen("list");
    setActivePost(null);
  }

  function backToList() {
    setScreen("list");
    setActivePost(null);
  }

  if (loading) return <p className="py-8 text-sm text-ink/40">Loading…</p>;

  if (screen === "view" && activePost) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
            <ArrowLeft size={14} /> Back to posts
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => editFromView(activePost)}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <article className="card p-6">
          {activePost.cover && (
            <img src={activePost.cover} alt="" className="mb-6 aspect-[16/9] w-full rounded-xl object-cover" />
          )}
          <ThemeBanner theme={activePost.theme} className="-mx-6 rounded-xl px-6 py-5 sm:mx-0">
            <p className="text-sm opacity-60">
              {new Date(activePost.date).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{activePost.title}</h1>
            {!!activePost.tags?.length && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {activePost.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </ThemeBanner>
          <div className="mt-6">
            <PostRenderer post={activePost} />
          </div>
        </article>

        {confirmingDelete && (
          <DeleteConfirmDialog
            itemName={activePost.slug}
            extraOption="Also delete its uploaded media"
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    );
  }

  if (screen === "edit") {
    return (
      <div className="mx-auto max-w-2xl">
        <button onClick={backToList} className="mb-4 flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft size={14} /> Back to posts
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-ink/40">
            {saveState === "saved" ? (
              <>
                <Check size={12} /> Saved
              </>
            ) : (
              "Editing…"
            )}
            {draft.publishedSlug && (
              <span className="rounded-full bg-teal-soft px-2 py-0.5 text-teal">Published</span>
            )}
          </p>
          <button
            onClick={handlePublish}
            disabled={publishState === "publishing"}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            {publishState === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {draft.publishedSlug ? "Update" : "Publish"}
          </button>
        </div>

        {publishError && <p className="mt-2 text-sm text-red-600">{publishError}</p>}

        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Post title"
          className="mt-4 w-full border-none bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-ink/25"
        />
        <input
          value={draft.slug || slugify(draft.title)}
          onChange={(e) => update({ slug: slugify(e.target.value) })}
          placeholder="url-slug"
          className="mt-1 w-full border-none bg-transparent font-mono text-sm text-ink/40 outline-none"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <textarea
            value={draft.excerpt}
            onChange={(e) => update({ excerpt: e.target.value })}
            placeholder="Short excerpt (optional, markdown supported)"
            rows={2}
            className="rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
          />
          <TagInput value={draft.tags} onChange={(tags) => update({ tags })} placeholder="Tags, press Enter to add" />
        </div>

        <div className="mt-3">
          <SkillPicker value={skills} onChange={setSkills} />
        </div>

        <div className="mt-3">
          <ThemePicker value={theme} onChange={setTheme} />
        </div>

        <div className="mt-4">
          <RichTextEditor
            content={draft.body}
            slug={draft.slug || slugify(draft.title) || draft.id}
            onChange={(body) => update({ body })}
          />
        </div>
      </div>
    );
  }

  const localSlugs = new Set(drafts.map((d) => d.publishedSlug).filter(Boolean));
  const otherPublished = publishedPosts.filter((p) => !localSlugs.has(p.slug));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Posts</h2>
        <button
          onClick={openNewDraft}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm text-paper hover:opacity-90"
        >
          <Plus size={14} /> New post
        </button>
      </div>

      <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-ink/40">Drafts</p>
      <div className="space-y-2">
        {drafts.map((d) => (
          <div key={d.id} className="card flex items-center gap-3 p-3">
            <button onClick={() => openDraftForEdit(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <FileText size={16} className="shrink-0 text-ink/30" />
              <span className="min-w-0 flex-1 truncate font-medium">{d.title || "Untitled draft"}</span>
              {d.publishedSlug && (
                <span className="shrink-0 rounded-full bg-teal-soft px-2 py-0.5 text-xs text-teal">Published</span>
              )}
            </button>
            <button onClick={() => removeDraft(d.id)} className="shrink-0 text-ink/30 hover:text-red-600">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {drafts.length === 0 && <p className="text-sm text-ink/40">No drafts yet.</p>}
      </div>

      {otherPublished.length > 0 && (
        <>
          <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-ink/40">Published</p>
          <div className="space-y-2">
            {otherPublished.map((p) => (
              <button
                key={p.slug}
                onClick={() => openPublishedView(p.slug)}
                className="card flex w-full items-center gap-3 p-3 text-left hover:border-ink/20"
              >
                <Globe size={16} className="shrink-0 text-ink/30" />
                <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

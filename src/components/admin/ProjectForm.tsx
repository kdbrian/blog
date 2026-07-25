import { Loader2, Send, X } from "lucide-react";
import MediaUploader from "@/components/admin/MediaUploader";
import TagInput from "@/components/admin/TagInput";
import SkillPicker from "@/components/admin/SkillPicker";
import ThemePicker from "@/components/admin/ThemePicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import GithubRepoPicker from "@/components/admin/GithubRepoPicker";
import LinksEditor from "@/components/admin/LinksEditor";
import type { Project, Skill } from "@/types/content";

const SLUG_RE = /^[a-z0-9-]+$/;
const GITHUB_URL_RE = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i;

export default function ProjectForm({
  value,
  onChange,
  skills,
  onSkillsChange,
  onSave,
  saving,
  error,
  submitLabel,
}: {
  value: Project;
  onChange: (patch: Partial<Project>) => void;
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const slug = value.slug;
  const repoUrlInvalid = !!value.repoUrl && !GITHUB_URL_RE.test(value.repoUrl);

  return (
    <div className="space-y-3">
      <input
        value={value.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
      />

      <div>
        <input
          value={slug}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
          placeholder="url-friendly-slug"
          className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none focus:border-accent ${
            slug && !SLUG_RE.test(slug) ? "border-red-300" : "border-line"
          }`}
        />
        <p className="mt-1 text-xs text-ink/40">
          Used in the project's URL and media folder — lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div>
        <input
          value={value.summary || ""}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="One-line summary (shown on the project card)"
          className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <textarea
        value={value.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Full description (shown on the project's detail page)"
        rows={3}
        className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
      />
      <TagInput value={value.tags || []} onChange={(tags) => onChange({ tags })} />
      <SkillPicker value={skills} onChange={onSkillsChange} />
      <div>
        <GithubRepoPicker value={value.repoUrl} onChange={(repoUrl) => onChange({ repoUrl })} />
        {repoUrlInvalid && (
          <p className="mt-1 text-xs text-red-600">
            Repo URL must look like https://github.com/owner/repo, or leave it blank.
          </p>
        )}
      </div>
      <input
        value={value.playStoreUrl || ""}
        onChange={(e) => onChange({ playStoreUrl: e.target.value })}
        placeholder="Play Store URL (optional)"
        className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
      />

      <LinksEditor value={value.links || []} onChange={(links) => onChange({ links })} />

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={!!value.featured}
          onChange={(e) => onChange({ featured: e.target.checked })}
        />
        Feature at top of grid
      </label>

      <ThemePicker value={value.theme ?? null} onChange={(theme) => onChange({ theme })} />

      <div className="flex flex-wrap gap-2">
        {value.images.map((img) => (
          <div key={img} className="relative h-16 w-16 overflow-hidden rounded-lg">
            <img src={img} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => onChange({ images: value.images.filter((i) => i !== img) })}
              className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-paper"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <MediaUploader
        folder="projects"
        slug={slug}
        onUploaded={(url) => onChange({ images: [...value.images, url] })}
      />

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/40">
          Notes (shown on the project's detail page)
        </p>
        <RichTextEditor
          content={value.notes || ""}
          slug={slug}
          folder="projects"
          onChange={(notes) => onChange({ notes })}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={onSave}
        disabled={saving || repoUrlInvalid}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {submitLabel}
      </button>
    </div>
  );
}

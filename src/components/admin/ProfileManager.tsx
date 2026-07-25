import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Shuffle, UploadCloud } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { fetchProfile } from "@/lib/profile";
import { BLOB_PRESETS } from "@/lib/blob-shape";
import type { BlobShape, Profile } from "@/types/content";
import BlobImage from "@/components/ui/BlobImage";
import ImageCropModal from "@/components/admin/ImageCropModal";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadProfileImage(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const { url } = await api.uploadMedia(file.name, base64, "profile", "main");
  return url;
}

const EMPTY: Profile = {
  headline: "",
  tagline: "",
  bio: "",
  location: "",
  imageUrl: undefined,
  shape: { seed: 1, points: 7, irregularity: 0.35 },
};

export default function ProfileManager() {
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile().then((p) => {
      if (p) setForm(p);
      setLoading(false);
    });
  }, []);

  function updateShape(patch: Partial<BlobShape>) {
    setForm((f) => ({ ...f, shape: { ...f.shape, ...patch } }));
    setSaved(false);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.publishProfile({
        headline: form.headline,
        tagline: form.tagline,
        bio: form.bio,
        location: form.location,
        imageUrl: form.imageUrl,
        shapeSeed: form.shape.seed,
        shapePoints: form.shape.points,
        shapeIrregularity: form.shape.irregularity,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-8 text-sm text-ink/40">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Profile</h2>

        <div className="card space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/40">
              Headline
            </label>
            <input
              value={form.headline}
              onChange={(e) => {
                setForm({ ...form, headline: e.target.value });
                setSaved(false);
              }}
              placeholder="Hey, I'm Brian 👋"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/40">
              Tagline
            </label>
            <textarea
              value={form.tagline}
              onChange={(e) => {
                setForm({ ...form, tagline: e.target.value });
                setSaved(false);
              }}
              rows={2}
              placeholder="A short line under your name"
              className="w-full resize-none rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/40">
              About
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => {
                setForm({ ...form, bio: e.target.value });
                setSaved(false);
              }}
              rows={4}
              placeholder="A bit more detail"
              className="w-full resize-none rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/40">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => {
                setForm({ ...form, location: e.target.value });
                setSaved(false);
              }}
              placeholder="Earth 🌍"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Shape</p>
          <div className="flex flex-wrap gap-2">
            {BLOB_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateShape(preset.shape)}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink/70 hover:border-accent hover:text-ink"
              >
                {preset.name}
              </button>
            ))}
            <button
              onClick={() => updateShape({ seed: Math.floor(Math.random() * 100_000) })}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-ink/70 hover:border-accent hover:text-ink"
            >
              <Shuffle size={13} /> Shuffle
            </button>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink/40">
              <span>Points</span>
              <span>{form.shape.points}</span>
            </div>
            <input
              type="range"
              min={4}
              max={10}
              step={1}
              value={form.shape.points}
              onChange={(e) => updateShape({ points: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink/40">
              <span>Squishiness</span>
              <span>{Math.round(form.shape.irregularity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={form.shape.irregularity}
              onChange={(e) => updateShape({ irregularity: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Save profile
          {saved && <span className="text-paper/60">· saved</span>}
        </button>
      </div>

      <div className="card h-fit space-y-4 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Preview</p>
        <div className="flex flex-col items-center gap-3">
          <BlobImage
            src={form.imageUrl || "/profile.jpg"}
            alt="Profile preview"
            shape={form.shape}
            className="h-36 w-36"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-accent hover:text-ink"
          >
            <UploadCloud size={14} /> Change photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onPickFile} />
        </div>
        <div>
          <p className="font-display font-semibold">{form.headline || "—"}</p>
          <p className="mt-1 text-sm text-ink/60">{form.tagline || "—"}</p>
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          uploadFn={uploadProfileImage}
          onCancel={() => setCropSrc(null)}
          onApply={(url) => {
            setForm((f) => ({ ...f, imageUrl: url }));
            setCropSrc(null);
            setSaved(false);
          }}
        />
      )}
    </div>
  );
}

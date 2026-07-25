import { useEffect, useState } from "react";
import { Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { fetchSocialLinks } from "@/lib/social";
import type { SocialLink } from "@/types/content";

const EMPTY: SocialLink = { id: "", label: "", url: "", sortOrder: 0 };

export default function SocialLinksManager() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialLinks().then((l) => {
      setLinks(l);
      setLoading(false);
    });
  }, []);

  function startNew() {
    setEditing({ ...EMPTY, sortOrder: links.length });
    setIsNew(true);
    setError(null);
  }

  function startEdit(l: SocialLink) {
    setEditing({ ...l });
    setIsNew(false);
    setError(null);
  }

  async function handleSave() {
    if (!editing || !editing.url.trim()) {
      setError("URL is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.publishSocialLink({
        id: isNew ? undefined : editing.id,
        label: editing.label,
        url: editing.url,
        sortOrder: editing.sortOrder,
      });
      setLinks(await fetchSocialLinks());
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteSocialLink(id);
    setLinks(await fetchSocialLinks());
  }

  if (loading) return <p className="py-8 text-sm text-ink/40">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Social links</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm text-paper hover:opacity-90"
          >
            <Plus size={14} /> Add link
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {links.map((l) => (
            <div key={l.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.label || l.url}</p>
                <p className="truncate text-sm text-ink/50">{l.url}</p>
              </div>
              <button onClick={() => startEdit(l)} className="text-sm text-ink/60 hover:text-ink">
                Edit
              </button>
              <button onClick={() => handleDelete(l.id)} className="text-ink/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {links.length === 0 && <p className="text-sm text-ink/40">No links yet.</p>}
        </div>
      </div>

      {editing && (
        <div className="card h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{isNew ? "New link" : "Edit link"}</h3>
            <button onClick={() => setEditing(null)} className="text-ink/30 hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={editing.label || ""}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="Label (optional, e.g. GitHub)"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={editing.url}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              placeholder="https://github.com/you"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {isNew ? "Add link" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

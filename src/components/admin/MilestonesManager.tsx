import { useEffect, useState } from "react";
import { Loader2, Plus, Send, Trash2, X } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import SkillPicker from "@/components/admin/SkillPicker";
import ThemePicker from "@/components/admin/ThemePicker";
import { api, ApiError } from "@/lib/api";
import { fetchMilestones } from "@/lib/activity";
import type { ActivityEntry, Skill } from "@/types/content";

const EMPTY: ActivityEntry = { id: "", date: new Date().toISOString().slice(0, 10), title: "", description: "", url: "" };

export default function MilestonesManager() {
  const [milestones, setMilestones] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ActivityEntry | null>(null);
  const [editingSkills, setEditingSkills] = useState<Skill[]>([]);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<ActivityEntry | null>(null);

  useEffect(() => {
    fetchMilestones().then((m) => {
      setMilestones(m);
      setLoading(false);
    });
  }, []);

  function startNew() {
    setEditing({ ...EMPTY });
    setEditingSkills([]);
    setIsNew(true);
    setError(null);
  }

  function startEdit(m: ActivityEntry) {
    setEditing({ ...m });
    setEditingSkills(m.skills || []);
    setIsNew(false);
    setError(null);
  }

  async function handleSave() {
    if (!editing || !editing.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.publishMilestone({
        id: isNew ? undefined : editing.id,
        date: editing.date,
        title: editing.title,
        description: editing.description,
        url: editing.url,
        theme: editing.theme,
        skillIds: editingSkills.map((s) => s.id),
      });
      setMilestones(await fetchMilestones());
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    await api.deleteMilestone(confirmingDelete.id);
    setMilestones(await fetchMilestones());
    setConfirmingDelete(null);
  }

  if (loading) return <p className="py-8 text-sm text-ink/40">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Milestones</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm text-paper hover:opacity-90"
          >
            <Plus size={14} /> Add milestone
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="truncate text-sm text-ink/50">{m.date}</p>
              </div>
              <button onClick={() => startEdit(m)} className="text-sm text-ink/60 hover:text-ink">
                Edit
              </button>
              <button onClick={() => setConfirmingDelete(m)} className="text-ink/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {milestones.length === 0 && <p className="text-sm text-ink/40">No milestones yet.</p>}
        </div>
      </div>

      {editing && (
        <div className="card h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{isNew ? "New milestone" : "Edit milestone"}</h3>
            <button onClick={() => setEditing(null)} className="text-ink/30 hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              type="date"
              value={editing.date}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={editing.url || ""}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              placeholder="Link URL (optional)"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <SkillPicker value={editingSkills} onChange={setEditingSkills} />
            <ThemePicker value={editing.theme ?? null} onChange={(theme) => setEditing({ ...editing, theme })} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {isNew ? "Publish milestone" : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <DeleteConfirmDialog
          itemName={confirmingDelete.title}
          onCancel={() => setConfirmingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

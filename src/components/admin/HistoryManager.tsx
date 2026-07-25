import { useEffect, useState } from "react";
import { Loader2, Plus, Send, Trash2, X, AlertTriangle } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { fetchHistoryEntries } from "@/lib/history";
import type { HistoryEntry, HistoryKind } from "@/types/content";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyEntry(kind: HistoryKind): HistoryEntry {
  return { id: "", kind, title: "", org: "", startDate: today(), endDate: undefined, description: "", url: "", sortOrder: 0 };
}

function formatYear(date: string) {
  return date.slice(0, 4);
}

function formatRange(entry: HistoryEntry) {
  return `${formatYear(entry.startDate)} – ${entry.endDate ? formatYear(entry.endDate) : "Present"}`;
}

/** Same-kind date ranges overlap if each starts before (or when) the other ends. Missing end = ongoing. */
function rangesOverlap(aStart: string, aEnd: string | undefined, bStart: string, bEnd: string | undefined) {
  const aEndVal = aEnd || "9999-12-31";
  const bEndVal = bEnd || "9999-12-31";
  return aStart <= bEndVal && bStart <= aEndVal;
}

export default function HistoryManager({
  kind,
  label,
  orgLabel,
}: {
  kind: HistoryKind;
  label: string;
  orgLabel: string;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HistoryEntry | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    fetchHistoryEntries(kind).then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, [kind]);

  function startNew() {
    setEditing(emptyEntry(kind));
    setIsNew(true);
    setError(null);
  }

  function startEdit(e: HistoryEntry) {
    setEditing({ ...e });
    setIsNew(false);
    setError(null);
  }

  const overlap =
    editing &&
    entries.find(
      (e) => e.id !== editing.id && rangesOverlap(editing.startDate, editing.endDate, e.startDate, e.endDate),
    );

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!editing.startDate) {
      setError("Start date is required.");
      return;
    }
    if (editing.endDate && editing.endDate < editing.startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.publishHistoryEntry({
        id: isNew ? undefined : editing.id,
        kind: editing.kind,
        title: editing.title,
        org: editing.org,
        startDate: editing.startDate,
        endDate: editing.endDate || null,
        description: editing.description,
        url: editing.url,
        sortOrder: editing.sortOrder,
      });
      setEntries(await fetchHistoryEntries(kind));
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    await api.deleteHistoryEntry(confirmingDelete.id);
    setEntries(await fetchHistoryEntries(kind));
    setConfirmingDelete(null);
  }

  if (loading) return <p className="py-8 text-sm text-ink/40">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{label}</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm text-paper hover:opacity-90"
          >
            <Plus size={14} /> Add {label.toLowerCase()}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="truncate text-sm text-ink/50">
                  {e.org} · {formatRange(e)}
                </p>
              </div>
              <button onClick={() => startEdit(e)} className="text-sm text-ink/60 hover:text-ink">
                Edit
              </button>
              <button onClick={() => setConfirmingDelete(e)} className="text-ink/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-ink/40">No {label.toLowerCase()} entries yet.</p>}
        </div>
      </div>

      {editing && (
        <div className="card h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{isNew ? `New ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}</h3>
            <button onClick={() => setEditing(null)} className="text-ink/30 hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Title (e.g. degree or role)"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={editing.org}
              onChange={(e) => setEditing({ ...editing, org: e.target.value })}
              placeholder={orgLabel}
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-ink/40">Start date</label>
                <input
                  type="date"
                  value={editing.startDate}
                  onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                  className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-ink/40">End date</label>
                <input
                  type="date"
                  value={editing.endDate || ""}
                  disabled={editing.endDate === undefined}
                  onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                  className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent disabled:opacity-40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={!editing.endDate}
                onChange={(e) => setEditing({ ...editing, endDate: e.target.checked ? undefined : today() })}
              />
              Ongoing / present
            </label>

            <textarea
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Description (optional)"
              rows={3}
              className="w-full resize-none rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={editing.url || ""}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              placeholder="Link URL (optional)"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
            />

            {overlap && (
              <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                This overlaps with "{overlap.title}" ({formatRange(overlap)}) — that's fine if intentional,
                otherwise double-check the dates.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {isNew ? `Add ${label.toLowerCase()}` : "Save changes"}
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

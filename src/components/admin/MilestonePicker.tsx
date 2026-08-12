import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { ProjectMilestone } from "@/types/content";
import { fetchMilestones } from "@/lib/activity";
import { api } from "@/lib/api";

export default function MilestonePicker({
  value,
  onChange,
}: {
  value: ProjectMilestone[];
  onChange: (milestones: ProjectMilestone[]) => void;
}) {
  const [allMilestones, setAllMilestones] = useState<{ id: string; title: string; date: string }[]>([]);
  const [input, setInput] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMilestones().then(setAllMilestones).catch(() => {});
  }, []);

  const selectedIds = new Set(value.map((m) => m.id));
  const query = input.trim().toLowerCase();
  const matches = allMilestones.filter((m) => !selectedIds.has(m.id) && m.title.toLowerCase().includes(query));
  const exactMatch = allMilestones.some((m) => m.title.toLowerCase() === query);

  function add(milestone: ProjectMilestone) {
    onChange([...value, milestone]);
    setInput("");
  }

  function link(m: { id: string; title: string; date: string }) {
    add({ id: m.id, title: m.title, date: m.date, completed: false, sortOrder: value.length });
  }

  async function createAndLink() {
    const title = input.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      const { id } = await api.publishMilestone({ title, date });
      const milestone = { id, title, date };
      setAllMilestones((prev) => (prev.some((m) => m.id === id) ? prev : [...prev, milestone]));
      link(milestone);
    } finally {
      setCreating(false);
    }
  }

  function toggleCompleted(id: string) {
    onChange(value.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)));
  }

  function remove(id: string) {
    onChange(value.filter((m) => m.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const match = allMilestones.find((m) => m.title.toLowerCase() === query && !selectedIds.has(m.id));
      if (match) link(match);
      else if (query) createAndLink();
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/40">Milestones</p>

      {value.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {value.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5">
              <button
                type="button"
                onClick={() => toggleCompleted(m.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  m.completed ? "border-teal bg-teal text-paper" : "border-line text-transparent"
                }`}
                aria-label={m.completed ? "Mark as not done" : "Mark as done"}
              >
                <Check size={12} />
              </button>
              <span className={`flex-1 truncate text-sm ${m.completed ? "text-ink/40 line-through" : ""}`}>
                {m.title}
              </span>
              <button type="button" onClick={() => remove(m.id)} className="text-ink/30 hover:text-ink">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Link or create a milestone…"
          className="min-w-0 flex-1 rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-36 rounded-xl border border-line px-2.5 py-2 text-sm outline-none focus:border-accent"
        />

        {open && query && (matches.length > 0 || !exactMatch) && (
          <div className="absolute left-0 top-full z-10 mt-1 w-full max-w-full rounded-xl border border-line bg-white p-1 shadow-lg">
            {matches.slice(0, 6).map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => link(m)}
                className="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-ink/5"
              >
                {m.title}
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={createAndLink}
                disabled={creating}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-accent hover:bg-accent-soft disabled:opacity-50"
              >
                + Create "{input.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

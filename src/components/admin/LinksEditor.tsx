import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import type { ProjectLink } from "@/types/content";

export default function LinksEditor({
  value,
  onChange,
}: {
  value: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    if (!url.trim()) return;
    onChange([...value, { label: label.trim() || url.trim(), url: url.trim() }]);
    setLabel("");
    setUrl("");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
        Links (website, demo, docs — anything beyond the repo)
      </p>
      {value.map((link, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-line px-3 py-1.5 text-sm">
          <Link2 size={13} className="shrink-0 text-ink/30" />
          <span className="truncate font-medium">{link.label}</span>
          <span className="truncate text-ink/40">{link.url}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="ml-auto shrink-0 text-ink/30 hover:text-ink"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="w-28 rounded-xl border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://…"
          className="min-w-0 flex-1 rounded-xl border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={add}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

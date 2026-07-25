import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Skill } from "@/types/content";
import { fetchSkills } from "@/lib/skills";
import { api } from "@/lib/api";

export default function SkillPicker({
  value,
  onChange,
}: {
  value: Skill[];
  onChange: (skills: Skill[]) => void;
}) {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSkills().then(setAllSkills).catch(() => {});
  }, []);

  const selectedIds = new Set(value.map((s) => s.id));
  const query = input.trim().toLowerCase();
  const matches = allSkills.filter((s) => !selectedIds.has(s.id) && s.name.toLowerCase().includes(query));
  const exactMatch = allSkills.some((s) => s.name.toLowerCase() === query);

  function select(skill: Skill) {
    onChange([...value, skill]);
    setInput("");
  }

  async function createAndSelect() {
    const name = input.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const { skill } = await api.publishSkill({ name });
      setAllSkills((prev) => (prev.some((s) => s.id === skill.id) ? prev : [...prev, skill]));
      select(skill);
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const match = allSkills.find((s) => s.name.toLowerCase() === query && !selectedIds.has(s.id));
      if (match) select(match);
      else if (query) createAndSelect();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 focus-within:border-accent">
        {value.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 text-xs text-teal"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => onChange(value.filter((s) => s.id !== skill.id))}
              className="hover:text-ink"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? "Associate skills…" : ""}
          className="min-w-24 flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-ink/30"
        />
      </div>

      {open && query && (matches.length > 0 || !exactMatch) && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-white p-1 shadow-lg">
          {matches.slice(0, 6).map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(s)}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-ink/5"
            >
              {s.name}
            </button>
          ))}
          {!exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createAndSelect}
              disabled={creating}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-accent hover:bg-accent-soft disabled:opacity-50"
            >
              + Create "{input.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

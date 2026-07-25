import { useEffect, useState } from "react";
import { Loader2, FileText, Folder, Rocket } from "lucide-react";
import type { Skill } from "@/types/content";
import { fetchSkills } from "@/lib/skills";
import { fetchSkillHistory, type SkillHistoryItem } from "@/lib/playground";

const ICONS = { post: FileText, project: Folder, milestone: Rocket } as const;

export default function PlaygroundPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [history, setHistory] = useState<SkillHistoryItem[] | null>(null);

  useEffect(() => {
    fetchSkills().then(setSkills).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setHistory(null);
    fetchSkillHistory(selected.id).then(setHistory).catch(() => setHistory([]));
  }, [selected]);

  return (
    <section className="animate-fade-up py-14">
      <h1 className="text-3xl font-semibold">Playground</h1>
      <p className="mt-2 max-w-xl text-ink/60">
        Pick a skill to see when it started and everything it's touched since.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => setSelected(skill)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected?.id === skill.id ? "border-ink bg-ink text-paper" : "border-line text-ink/60 hover:text-ink"
            }`}
          >
            {skill.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-10">
          <p className="text-sm text-ink/50">
            Added to the stack{" "}
            {new Date(selected.dateAdded).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>

          {!history && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink/40">
              <Loader2 size={14} className="animate-spin" /> Loading history…
            </p>
          )}
          {history && history.length === 0 && (
            <p className="mt-4 text-sm text-ink/40">Nothing tagged with this skill yet.</p>
          )}
          {history && history.length > 0 && (
            <ol className="mt-4 space-y-3 border-l border-line pl-5">
              {history.map((item, i) => {
                const Icon = ICONS[item.type];
                const content = (
                  <>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Icon size={14} className="text-ink/40" /> {item.title}
                    </p>
                    {item.description && <p className="text-sm text-ink/60">{item.description}</p>}
                    <p className="mt-0.5 text-xs text-ink/40">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {item.type}
                    </p>
                  </>
                );
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="hover:text-accent"
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

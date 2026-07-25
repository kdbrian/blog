import { useEffect, useState } from "react";
import { ChevronDown, Github, Loader2 } from "lucide-react";

interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}

const USERNAME = import.meta.env.VITE_GITHUB_USERNAME || "kdbrian";

export default function GithubRepoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
        return res.json();
      })
      .then(setRepos)
      .catch(() => setError("Couldn't load your GitHub repos — you can still paste a URL directly."));
  }, []);

  const query = value.replace(/^https:\/\/github\.com\//i, "").toLowerCase();
  const filtered = (repos || []).filter(
    (r) => !query || r.full_name.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 focus-within:border-accent">
        <Github size={14} className="shrink-0 text-ink/30" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Repo URL (optional — leave blank for a private project)"
          className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-ink/30 hover:text-ink"
        >
          {repos === null && !error ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {open && repos && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg">
          {filtered.length === 0 && <p className="px-2.5 py-2 text-sm text-ink/40">No matching repos.</p>}
          {filtered.map((r) => (
            <button
              key={r.full_name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(r.html_url);
                setOpen(false);
              }}
              className="flex w-full flex-col items-start rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-ink/5"
            >
              <span className="font-medium">{r.name}</span>
              {r.description && <span className="truncate text-xs text-ink/40">{r.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

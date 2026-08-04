import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";

interface Commit {
  sha: string;
  message: string;
  url: string;
}

function parseRepo(repoUrl: string): { owner: string; repo: string } | null {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)\/?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

export default function CommitHistory({ repoUrl }: { repoUrl: string }) {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const parsed = parseRepo(repoUrl);
    if (!parsed) {
      setError(true);
      return;
    }
    fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=10`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) =>
        setCommits(
          data.map((c: { sha: string; commit: { message: string }; html_url: string }) => ({
            sha: c.sha,
            message: c.commit.message,
            url: c.html_url,
          }))
        )
      )
      .catch(() => setError(true));
  }, [repoUrl]);

  if (error) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink/40">
        <AlertCircle size={12} /> Couldn't load commit history.
      </p>
    );
  }
  if (!commits) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink/40">
        <Loader2 size={12} className="animate-spin" /> Loading commits…
      </p>
    );
  }
  if (commits.length === 0) return <p className="text-xs text-ink/40">No commits found.</p>;

  return (
    <ul className="space-y-1">
      {commits.map((c) => {
        const [subject, ...rest] = c.message.split("\n");
        const body = rest.join("\n").trim();
        const isOpen = expanded === c.sha;
        return (
          <li key={c.sha} className="rounded-lg border border-line">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(isOpen ? null : c.sha);
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs"
            >
              <ChevronDown size={12} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              <span className="shrink-0 font-mono text-ink/40">{c.sha.slice(0, 7)}</span>
              <span className="truncate">{subject}</span>
            </button>
            {isOpen && (
              <div className="border-t border-line px-2.5 py-2 text-xs text-ink/70">
                <p className="whitespace-pre-wrap">{body || subject}</p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 inline-block text-accent"
                >
                  View on GitHub ↗
                </a>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

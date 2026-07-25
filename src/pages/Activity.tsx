import { useEffect, useState } from "react";
import { GitCommit, GitFork, Star, Rocket, Loader2, AlertCircle } from "lucide-react";
import { fetchGithubActivity, type GithubEvent } from "@/lib/github-activity";
import { fetchMilestones } from "@/lib/activity";
import type { ActivityEntry } from "@/types/content";
import ThemeBanner from "@/components/ThemeBanner";

const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME || "kdbrian";

const ICONS: Record<string, typeof GitCommit> = {
  PushEvent: GitCommit,
  ForkEvent: GitFork,
  WatchEvent: Star,
};

function timeAgo(iso: string) {
  const diff = Date.now() - +new Date(iso);
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function ActivityPage() {
  const [events, setEvents] = useState<GithubEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [milestones, setMilestones] = useState<ActivityEntry[] | null>(null);
  const [milestoneError, setMilestoneError] = useState(false);

  useEffect(() => {
    fetchGithubActivity(GITHUB_USERNAME)
      .then((data) => {
        setEvents(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    fetchMilestones().then(setMilestones).catch(() => setMilestoneError(true));
  }, []);

  return (
    <section className="animate-fade-up py-14">
      <h1 className="text-3xl font-semibold">Activity</h1>
      <p className="mt-2 max-w-xl text-ink/60">What I've been building — live from GitHub, plus milestones I've called out myself.</p>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">Milestones</h2>
          {milestoneError && <p className="text-sm text-red-600">Couldn't load milestones.</p>}
          {!milestoneError && !milestones && (
            <p className="flex items-center gap-2 text-sm text-ink/40">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </p>
          )}
          {milestones && (
            <ol className="space-y-4 border-l border-line pl-5">
              {milestones.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <ThemeBanner theme={entry.theme} className={entry.theme?.value ? "rounded-xl p-3" : ""}>
                    <p className="font-medium">{entry.title}</p>
                    {entry.description && <p className="text-sm opacity-70">{entry.description}</p>}
                    <p className="mt-0.5 text-xs opacity-50">{timeAgo(entry.date)}</p>
                    {!!entry.skills?.length && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {entry.skills.map((skill) => (
                          <span key={skill.id} className="rounded-full bg-teal-soft px-2 py-0.5 text-xs text-teal">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </ThemeBanner>
                </li>
              ))}
              {milestones.length === 0 && <p className="text-sm text-ink/40">Nothing logged yet.</p>}
            </ol>
          )}
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            Live from GitHub
            {status === "ready" && <span className="h-1.5 w-1.5 rounded-full bg-teal" />}
          </h2>

          {status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-ink/40">
              <Loader2 size={14} className="animate-spin" /> Loading recent activity…
            </p>
          )}

          {status === "error" && (
            <p className="flex items-center gap-2 text-sm text-ink/40">
              <AlertCircle size={14} /> Couldn't reach GitHub right now.
            </p>
          )}

          {status === "ready" && (
            <ul className="space-y-3">
              {events.map((e) => {
                const Icon = ICONS[e.type] || Rocket;
                return (
                  <li key={e.id}>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="card flex items-start gap-3 p-3 hover:border-ink/20"
                    >
                      <Icon size={16} className="mt-0.5 shrink-0 text-ink/40" />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{e.summary}</p>
                        <p className="text-xs text-ink/40">{timeAgo(e.createdAt)}</p>
                      </div>
                    </a>
                  </li>
                );
              })}
              {events.length === 0 && <p className="text-sm text-ink/40">No recent public activity.</p>}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

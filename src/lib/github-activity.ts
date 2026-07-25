export interface GithubEvent {
  id: string;
  type: string;
  repo: string;
  createdAt: string;
  summary: string;
  url: string;
}

const EVENT_LABELS: Record<string, (payload: any, repo: string) => string> = {
  PushEvent: (p, repo) => `Pushed ${p.commits?.length ?? 0} commit(s) to ${repo}`,
  CreateEvent: (p, repo) => `Created ${p.ref_type} ${p.ref ? `"${p.ref}"` : ""} in ${repo}`.trim(),
  PullRequestEvent: (p, repo) => `${p.action} a pull request in ${repo}`,
  IssuesEvent: (p, repo) => `${p.action} an issue in ${repo}`,
  WatchEvent: (_p, repo) => `Starred ${repo}`,
  ForkEvent: (_p, repo) => `Forked ${repo}`,
  PublicEvent: (_p, repo) => `Made ${repo} public`,
  ReleaseEvent: (p, repo) => `Published release ${p.release?.tag_name ?? ""} on ${repo}`.trim(),
};

/**
 * Reads a user's public GitHub events. Unauthenticated requests are capped
 * at 60/hour by GitHub — fine for a personal portfolio's traffic, and no
 * secret is required since this only ever reads public data.
 */
export async function fetchGithubActivity(username: string, limit = 8): Promise<GithubEvent[]> {
  const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=${limit}`);
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);

  const raw: any[] = await res.json();

  return raw.slice(0, limit).map((e) => {
    const repo = e.repo?.name ?? "a repository";
    const label = EVENT_LABELS[e.type];
    return {
      id: e.id,
      type: e.type,
      repo,
      createdAt: e.created_at,
      summary: label ? label(e.payload, repo) : `${e.type.replace("Event", "")} on ${repo}`,
      url: `https://github.com/${repo}`,
    };
  });
}

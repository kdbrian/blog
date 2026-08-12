import type { ProjectMilestone, ProjectStatus } from "@/types/content";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; pill: string }> = {
  active: { label: "Active", dot: "bg-teal", pill: "bg-teal-soft text-teal" },
  planned: { label: "Planned", dot: "bg-ink/40", pill: "bg-ink/5 text-ink/50" },
  paused: { label: "Paused", dot: "bg-accent", pill: "bg-accent-soft text-accent" },
  completed: { label: "Completed", dot: "bg-ink/30", pill: "bg-ink/5 text-ink/40" },
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function projectProgress(milestones: ProjectMilestone[] | undefined) {
  const total = milestones?.length ?? 0;
  const completed = milestones?.filter((m) => m.completed).length ?? 0;
  return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function ProgressRing({ pct, size = 16 }: { pct: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-ink/10" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-accent"
      />
    </svg>
  );
}

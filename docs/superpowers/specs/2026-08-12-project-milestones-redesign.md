# Project cards redesign + per-project milestones

Date: 2026-08-12

## Problem

1. A handful of links across the blog and portfolio are broken or base-path-unaware (confirmed: `Playground.tsx` post links use a raw `href="/${slug}"`, which escapes the blog's `/blog` deployment base).
2. The projects UI (both apps' `ProjectCard.tsx`, plus the blog's `ProjectDetail.tsx`) is a plain content card. The owner wants a project-management-style redesign (status, priority, due date, client, progress) based on a reference screenshot, plus a real per-project milestone/task concept.

## Data model

Reuse the existing `milestones` table (already powers the site-wide Activity feed) rather than a parallel tasks table — mirrors the existing `skills` / `project_skills` pattern.

- `projects` table: add `status text not null default 'planned' check (status in ('planned','active','paused','completed'))`, `priority text not null default 'medium' check (priority in ('low','medium','high'))`, `due_date date`, `client text`, `engagement text`.
- New `project_milestones` join table: `project_slug references projects(slug) on delete cascade`, `milestone_id references milestones(id) on delete cascade`, `completed boolean not null default false`, `sort_order int not null default 0`, `primary key (project_slug, milestone_id)`. Public read RLS policy, matching `project_skills`/`milestone_skills`.
- "Standalone" vs "linked" milestones aren't structurally different — both are a `milestones` row with a `project_milestones` join row. Standalone just means the `milestones` row was created inline while editing the project, rather than picked from an existing one.
- Progress % and "x/y tasks" are computed client-side from `project_milestones` (completed / total), not stored.
- `featured` (already exists on `projects`) is reused as the "pinned" flag — no new column needed.

## Admin (Studio)

- `ProjectForm.tsx`: add status/priority selects, due-date input, client/engagement text inputs.
- New `MilestonePicker.tsx`, modeled on `SkillPicker.tsx`: search + link an existing milestone, or "+ Create '...'" to make a new standalone one inline (title + date). Each linked chip has its own completed toggle (the per-project `completed` flag).
- `publish-project` edge function: accept and upsert the 5 new columns; upsert `project_milestones` the same delete-then-insert way `project_skills` is handled, preserving each row's `completed`/`sort_order`.

## Public UI

**Card** (both apps' `ProjectCard.tsx`): keep the existing screenshot thumbnail. Add a status strip: status pill (dot + label — teal=active, ink/40=planned, muted line-bg=paused/completed), `client · engagement` line (only if set), due date (flag icon) + priority (bars icon, no color-coding — kept quiet against the existing palette), and a small ring progress indicator + "x/y tasks" (only if the project has linked milestones). No per-card avatar — solo-developer portfolio, avatar was dropped per owner's call.

**Project detail** (blog's `ProjectDetail.tsx`): add a "Milestones" checklist section — checkmark vs empty-circle per item, linking through `milestone.url` when present.

**Listing pages**:
- Portfolio `Projects.tsx`: show only pinned (`featured`) projects; if none are pinned, fall back to a handful of the most recent so the page is never empty.
- Blog `Projects.tsx`: unchanged — shows everything.

## Link sweep

Fix the confirmed `Playground.tsx`/`playground.ts` bug (use `import.meta.env.BASE_URL`-relative paths, same pattern as `Logo.tsx`, instead of a bare `/${slug}` anchor). Then sweep both apps' nav/footer, card/detail links, `SocialIcons`, and `blog-links.ts` for anything else stale, mismatched, or base-path-unaware.

## Out of scope

- No new colors added to the Tailwind palette beyond existing `ink`/`accent`/`teal`/`line`/`paper` tokens.
- No pagination/filtering UI for the blog's full project list (still a plain grid, just unfiltered).

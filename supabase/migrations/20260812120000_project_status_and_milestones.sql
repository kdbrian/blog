-- Project-management-style fields for the projects grid (status, priority,
-- due date, client/engagement), plus a join table linking projects to the
-- existing milestones table — mirrors the project_skills pattern, so a
-- milestone can be "standalone" (created inline for one project) or shared
-- (also visible on the site-wide Activity feed) without any structural
-- difference. completed/sort_order live on the join since the same
-- milestone could in principle be linked to more than one project.

alter table projects add column if not exists status text not null default 'planned'
  check (status in ('planned', 'active', 'paused', 'completed'));
alter table projects add column if not exists priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high'));
alter table projects add column if not exists due_date date;
alter table projects add column if not exists client text;
alter table projects add column if not exists engagement text;

create table if not exists project_milestones (
  project_slug text not null references projects(slug) on delete cascade,
  milestone_id text not null references milestones(id) on delete cascade,
  completed boolean not null default false,
  sort_order int not null default 0,
  primary key (project_slug, milestone_id)
);

alter table project_milestones enable row level security;

create policy "Public read project_milestones" on project_milestones for select using (true);

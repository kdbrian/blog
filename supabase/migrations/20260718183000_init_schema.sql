-- ============================================================
-- Core content tables
-- ============================================================

create table if not exists posts (
  slug text primary key,
  title text not null,
  body text not null,
  format text not null default 'html' check (format in ('html', 'markdown')),
  excerpt text,
  cover text,
  tags text[] not null default '{}',
  theme jsonb,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  slug text primary key,
  title text not null,
  description text not null default '',
  images text[] not null default '{}',
  tags text[] not null default '{}',
  theme jsonb,
  repo_url text,
  play_store_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists milestones (
  id text primary key,
  date date not null default current_date,
  title text not null,
  description text,
  url text,
  theme jsonb,
  created_at timestamptz not null default now()
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null default '',
  excerpt text not null default '',
  tags text not null default '',
  cover text not null default '',
  body text not null default '',
  format text not null default 'html' check (format in ('html', 'markdown')),
  published_slug text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Skills taxonomy: a curated, reusable vocabulary distinct from
-- each item's own free-text `tags`. Every post/project/milestone
-- can be associated with any number of skills, and each skill
-- records the date it was "added" to the stack (defaults to today
-- for anything created going forward; backfilled to 2023 below for
-- the skills that already existed before this system did).
-- ============================================================

create table if not exists skills (
  id text primary key,
  name text not null unique,
  date_added date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists post_skills (
  post_slug text not null references posts(slug) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  primary key (post_slug, skill_id)
);

create table if not exists project_skills (
  project_slug text not null references projects(slug) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  primary key (project_slug, skill_id)
);

create table if not exists milestone_skills (
  milestone_id text not null references milestones(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  primary key (milestone_id, skill_id)
);

-- ============================================================
-- Social links, shown in the site footer.
-- ============================================================

create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  label text,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security: anonymous reads for everything public-facing.
-- All writes go exclusively through edge functions using the
-- service-role key (which bypasses RLS) after the app's own
-- password-based auth check — so no insert/update/delete policies
-- are defined here on purpose.
-- ============================================================

alter table posts enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table drafts enable row level security;
alter table skills enable row level security;
alter table post_skills enable row level security;
alter table project_skills enable row level security;
alter table milestone_skills enable row level security;
alter table social_links enable row level security;

create policy "Public read posts" on posts for select using (true);
create policy "Public read projects" on projects for select using (true);
create policy "Public read milestones" on milestones for select using (true);
create policy "Public read skills" on skills for select using (true);
create policy "Public read post_skills" on post_skills for select using (true);
create policy "Public read project_skills" on project_skills for select using (true);
create policy "Public read milestone_skills" on milestone_skills for select using (true);
create policy "Public read social_links" on social_links for select using (true);
-- drafts has no policies at all — not even anon SELECT, since it may hold
-- unfinished writing. Only the service role (edge functions) can touch it.

-- ============================================================
-- Storage: a public bucket for post/project media.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

-- ============================================================
-- Seed data: carries over what existed as committed files / a
-- hardcoded skills list before this migration, so nothing is lost
-- in the move to Supabase-backed storage.
-- ============================================================

insert into posts (slug, title, body, format, excerpt, tags, date)
values (
  'rebuilding-this-site',
  'Rebuilding this site with a self-hosted CMS',
  $$This post was written from `/admin/studio`, the CMS built into this site. Posts, projects, and activity milestones live in a Supabase Postgres database now, editable from the admin dashboard on any device — no git commits required to publish.

Media (images, video) is stored in Supabase Storage.$$,
  'markdown',
  'No database, no monthly bill — content lives in Supabase now.',
  '{meta,android}',
  '2026-07-18'
)
on conflict (slug) do nothing;

insert into projects (slug, title, description, images, tags, featured)
values
  ('farm-connect', 'Farm Connect', 'A marketplace app connecting farmers directly with buyers.', '{/projects/farm-connect/1.jpeg}', '{Kotlin,"Jetpack Compose",Firebase}', false),
  ('sage', 'Sage Documents', 'An AI-powered RAG system for personalized document retrieval.', '{/projects/Sage/1.jpeg}', '{Kotlin,RAG,AI}', true)
on conflict (slug) do nothing;

insert into milestones (id, date, title, description)
values (
  '2026-07-18-relaunch',
  '2026-07-18',
  'Relaunched this site with a self-hosted blog & project CMS',
  'Vite + React, publishing straight to GitHub via Supabase Edge Functions.'
)
on conflict (id) do nothing;

insert into skills (id, name, date_added) values
  ('kotlin', 'Kotlin', '2023-01-01'),
  ('jetpack-compose', 'Jetpack Compose', '2023-01-01'),
  ('mvvm', 'MVVM', '2023-01-01'),
  ('retrofit', 'Retrofit', '2023-01-01'),
  ('room-db', 'Room DB', '2023-01-01'),
  ('coroutines', 'Coroutines', '2023-01-01'),
  ('firebase', 'Firebase', '2023-01-01'),
  ('git', 'Git', '2023-01-01')
on conflict (id) do nothing;

insert into project_skills (project_slug, skill_id) values
  ('farm-connect', 'kotlin'),
  ('farm-connect', 'jetpack-compose'),
  ('farm-connect', 'firebase'),
  ('sage', 'kotlin')
on conflict do nothing;

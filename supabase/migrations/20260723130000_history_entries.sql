-- ============================================================
-- History entries: education and work experience, sharing one
-- table since both are just (org, title, date range, description)
-- items on a timeline — one admin screen and one chronology-check
-- can serve both via the `kind` discriminator.
-- ============================================================

create table if not exists history_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('education', 'experience')),
  title text not null,
  org text not null default '',
  start_date date not null,
  end_date date,
  description text,
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table history_entries enable row level security;

create policy "Public read history_entries" on history_entries for select using (true);
-- No write policies: publish/delete go through edge functions using the
-- service-role key, same convention as every other content table here.

-- Seed data: carries over the education entry that was previously
-- hardcoded directly into Education.tsx, so nothing is lost in the
-- move to Supabase-backed storage.
do $$
begin
  if not exists (select 1 from history_entries where kind = 'education') then
    insert into history_entries (kind, title, org, start_date, end_date, description, sort_order)
    values (
      'education',
      'B.Sc. Computer Science',
      'Karatina University',
      '2020-01-01',
      '2024-12-31',
      'Graduated with honours. Focused on software engineering, algorithms, and distributed systems.',
      0
    );
  end if;
end $$;

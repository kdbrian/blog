-- ============================================================
-- Profile: a singleton row backing the About section (name, bio,
-- photo, and the custom "blob" shape it's clipped to). Singleton
-- is enforced by a fixed primary key rather than a separate
-- constraint, matching how the rest of this schema keeps things
-- simple.
-- ============================================================

create table if not exists profile (
  id text primary key default 'main',
  headline text not null default '',
  tagline text not null default '',
  bio text not null default '',
  location text not null default '',
  image_url text,
  shape_seed int not null default 1,
  shape_points int not null default 7,
  shape_irregularity numeric(3,2) not null default 0.35,
  updated_at timestamptz not null default now()
);

alter table profile enable row level security;

create policy "Public read profile" on profile for select using (true);
-- No insert/update/delete policies: writes go through the
-- publish-profile edge function via the service-role key, same
-- convention as every other content table in this schema.

insert into profile (id, headline, tagline, bio, location, image_url, shape_seed, shape_points, shape_irregularity)
values (
  'main',
  'Hey, I''m Brian 👋',
  'A passionate Android developer crafting smooth, elegant mobile experiences — from pixel-perfect UIs to rock-solid architecture.',
  'I live and breathe Kotlin, Jetpack Compose, and the Android ecosystem. When I''m not pushing commits, I''m exploring AI integrations, tinkering with backends, or making apps a little more delightful.',
  'Earth 🌍',
  '/profile.jpg',
  1,
  7,
  0.35
)
on conflict (id) do nothing;

-- Recover content that was published through the old file-based Studio on
-- master while this migration was in flight, so it isn't lost in the switch
-- to Supabase-backed storage.

insert into posts (slug, title, body, format, excerpt, tags, date)
values (
  'my-first-blog',
  'My first Blog',
  $$<p></p><h2>Hi guys</h2><h3>This is the story behind rebuilding my career as a software developer. Am doing this during the AI apocalypse. Layoffs, Mcp servers, Agents, Rag all these are tools designed to take away the career of a average SE. </h3><blockquote><p>The real question remains is why stay average.</p></blockquote><h5>Stay tuned and wish me luck.</h5><p></p><p></p><p></p><p></p><p></p>$$,
  'html',
  'Rebuilding my career as a software engineer in 2026 during the AI apocalypse.',
  '{career,software,engineering}',
  '2026-07-18'
)
on conflict (slug) do update set
  title = excluded.title,
  body = excluded.body,
  format = excluded.format,
  excerpt = excluded.excerpt,
  tags = excluded.tags,
  date = excluded.date;

update projects
set tags = '{Kotlin,"Jetpack Compose",Firebase,Gcp,Supabase,"Cloud Functions",Claude,Android,AGP,Mockito,JUnit,"Firebase Auth"}'
where slug = 'farm-connect';

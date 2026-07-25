-- General-purpose links (website, demo, docs, etc.) beyond the fixed
-- repo_url / play_store_url columns, so a project with no public repo
-- can still surface other links.
alter table projects add column if not exists links jsonb not null default '[]';

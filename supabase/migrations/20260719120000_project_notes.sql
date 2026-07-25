-- Public, richly-formatted notes for a project (same HTML pipeline as
-- blog post bodies), shown in the expanded project card on the site.
alter table projects add column if not exists notes text not null default '';

-- Insert a "Buy Me a Coffee" social link right after LinkedIn (wherever it
-- currently sits in sort order), shifting anything after it down by one.
do $$
declare
  li_order int;
begin
  if exists (select 1 from social_links where url ilike '%buymeacoffee.com%') then
    return;
  end if;

  select sort_order into li_order from social_links where url ilike '%linkedin.com%' limit 1;

  if li_order is not null then
    update social_links set sort_order = sort_order + 1 where sort_order > li_order;
    insert into social_links (label, url, sort_order)
    values ('Buy Me a Coffee', 'https://buymeacoffee.com/kidiga', li_order + 1);
  else
    insert into social_links (label, url, sort_order)
    select 'Buy Me a Coffee', 'https://buymeacoffee.com/kidiga', coalesce(max(sort_order), 0) + 1
    from social_links;
  end if;
end $$;

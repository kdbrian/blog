-- Switch drafts.tags from a comma-joined string to a real array, matching
-- posts.tags / projects.tags, now that the Studio UI uses a chip-based tag
-- input instead of a single comma-separated text field.
alter table drafts
  alter column tags drop default,
  alter column tags type text[] using case
    when tags is null or tags = '' then '{}'::text[]
    else string_to_array(tags, ',')
  end,
  alter column tags set default '{}';

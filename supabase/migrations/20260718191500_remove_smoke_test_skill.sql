-- Remove the "react" skill row created while smoke-testing publish-skill
-- during development — not a real entry in the skills taxonomy.
delete from skills where id = 'react';

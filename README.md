# kdbrian.github.io/blog — blog + admin studio

Vite + React + Tailwind blog with a self-hosted post/project/milestone CMS at
`/admin/studio`. All content — posts, projects, milestones, skills, social
links, drafts — lives in the **same Supabase Postgres database used by the
[portfolio repo](https://github.com/kdbrian/kdbrian.github.io)**, edited from
the admin dashboard on any device (local or deployed), no git commits
required to publish. Media (images/video) lives in Supabase Storage.

This site is deployed separately from the portfolio (`kdbrian.github.io`),
as a GitHub Pages *project* site at `kdbrian.github.io/blog`. The portfolio
stays a lightweight, read-only front end (skills, education, projects) that
reads the same Supabase data; this repo owns the blog, milestones/activity,
skill playground, and all write-side admin tooling.

## Project layout

```
src/lib/                 async fetchers (posts, projects, activity, skills, social, profile, history) against Supabase's PostgREST API
src/components/admin/    Studio editors: PostEditor, ProjectManager, MilestonesManager, SocialLinksManager,
                          ProfileManager, HistoryManager (education & experience), LinksEditor, TagInput,
                          SkillPicker, ThemePicker, RichTextEditor
supabase/migrations/      schema: posts, projects, milestones, drafts, skills (+ junction tables), social_links,
                          profile, history_entries (education & experience)
supabase/functions/       edge functions: auth, publish/delete for posts, projects, milestones, skills, social links,
                          profile, history entries, drafts CRUD, media upload — all write paths, gated by a custom
                          password + JWT (auth-guard.ts)
.github/workflows/        builds with Vite, deploys the static SPA to GitHub Pages under /blog/
```

Reads (public pages) call Supabase's REST API directly with the anon key,
gated by RLS (`select` policies only — see the migrations). Writes go
through edge functions using the service-role key, after `requireAuth()`
checks a custom JWT signed with `JWT_SECRET` — this app does not use
Supabase Auth.

Note: the portfolio repo also reads several of these same tables directly
(projects, skills, history entries, social links, profile) for its
read-only display — the fetcher files under `src/lib/` are intentionally
duplicated there rather than shared, since the two are now independent
repos against one backend.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the two VITE_ vars below — same
                              # Supabase project as the portfolio repo
npm run dev
```

## Deploying

1. **GitHub Pages**: Settings → Pages → Build and deployment → Source →
   **"GitHub Actions"** (not "Deploy from a branch" — that classic mode
   serves raw source files instead of the Vite build output). The included
   workflow deploys on every push to your default branch. Because this is a
   *project* Pages site (repo name `blog`, not `<user>.github.io`), it's
   served at `kdbrian.github.io/blog` — `vite.config.ts`'s `base: "/blog/"`
   already accounts for the subpath.
2. **Supabase**: this repo owns the backend source going forward. If you
   haven't already deployed the schema/functions from the portfolio repo
   (or are pointing at a fresh project), link and push from here:
   ```bash
   npx supabase login                              # or set SUPABASE_ACCESS_TOKEN
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase functions deploy auth publish-blog delete-blog publish-project delete-project \
     upload-media publish-milestone delete-milestone publish-skill publish-social-link \
     delete-social-link publish-profile publish-history-entry delete-history-entry \
     drafts-list drafts-save drafts-delete
   ```
   No local Supabase install or Docker needed — this only talks to your cloud
   project (`supabase start`/local dev emulation is unrelated and unused).
3. Set the secrets below, then visit `https://kdbrian.github.io/blog/admin/studio`.

## Secrets checklist

**Supabase Edge Function secrets** — set with `npx supabase secrets set
NAME=value`. Write-only: there's no way to read a value back once set, so
save whatever you generate somewhere safe first.

| Secret | Purpose |
|---|---|
| `ADMIN_SECRET` | The Studio login password. Generate: `openssl rand -base64 32`. |
| `JWT_SECRET` | Signs the session token. Generate: `openssl rand -base64 32`. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the platform — nothing to set for those.

**GitHub Actions repo secrets** (Settings → Secrets and variables → Actions —
public-safe values the client bundle needs at build time):

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` — same value used in the portfolio repo |
| `VITE_SUPABASE_ANON_KEY` | Your project's anon/public key — same value used in the portfolio repo |

Both are **required** — if either is missing, the build still succeeds, but
the client silently builds with an empty API base URL, so Studio requests go
to your own domain instead of Supabase and fail with a `405`.

**Client `.env.local`** (local dev only, gitignored) — same two `VITE_`
values, see `.env.example`.

## Troubleshooting

- **Page loads blank, console shows a MIME-type error on `main.tsx`**: Pages
  source is set to "Deploy from a branch" instead of "GitHub Actions". Fix
  the setting, then push a commit (an empty one is fine) to trigger a fresh
  deploy — the setting change alone doesn't retroactively republish.
- **Studio login (or any write) fails with `405` on a request to your own
  domain instead of Supabase**: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  Actions secrets aren't set.
- **Studio login fails with 401 no matter the password**: edge functions
  default to Supabase's own gateway-level JWT verification, which this app's
  custom auth doesn't satisfy. Every function needs `verify_jwt = false` in
  `supabase/config.toml` (already configured here) — if you add a new
  function, add its entry too, then redeploy.
- **"Live from GitHub" activity feed shows "Couldn't reach GitHub right
  now"**: the unauthenticated GitHub API allows only 60 requests/hour per IP.
  Self-clears within the hour.
- **Assets/icons 404 or the SPA fallback lands on the wrong page**: confirm
  `vite.config.ts`'s `base` and `public/404.html`'s redirect both say
  `/blog/` — a mismatch here is the usual cause after renaming the repo.

## Notes on design choices

- **Skills vs. tags**: tags are free-text per post/project; skills are a
  separate, curated taxonomy (`skills` table with a `date_added`) shared
  across posts/projects/milestones and the portfolio's About page stack
  badges. The Playground page (`/playground`) picks a skill and shows a
  chronological history of everything tagged with it.
- **Theming**: posts/projects/milestones can carry an optional background
  (`theme: { type: color|gradient|image, value }`). Solid colors get a real
  luminance check for text contrast; gradients/images (can't be cheaply
  introspected) always get a dark scrim + light text.
- **New posts are saved as HTML** (TipTap's native output); DOMPurify
  sanitizes on render regardless of source. The publish function also strips
  `<script>` tags and inline event handlers server-side as defense-in-depth.
- **Media is scoped per post/project slug** in Supabase Storage
  (`blog-images/<slug>/…`, `projects/<slug>/…`), so "also delete media" on
  the delete dialog removes exactly one item's uploads.
- **Drafts sync across devices** via the `drafts` table (RLS blocks all
  public access — only edge functions using the service-role key can touch
  it), so starting a draft locally and finishing it on another device works.
- **Known gap**: `ProjectManager`'s live preview reuses the portfolio's
  `ProjectCard`, which links to `/projects/:slug` — a route that lives in
  the portfolio repo, not here. Clicking that preview inside admin will
  404 within this app's own router. Cosmetic only; doesn't block editing.

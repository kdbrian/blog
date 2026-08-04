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
src/pages/                BlogList, PostDetail, Projects, ProjectDetail (full case studies — screenshots,
                          write-up, commit history), Activity, Playground, admin/StudioApp
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

This repo owns every long-form reading experience: blog posts *and* full
project case studies (`/projects`, `/projects/:slug` — screenshots,
write-up, commit history). The portfolio repo only shows overview cards for
both (a projects grid, a "recent articles" strip) and links out here for
anything more than a summary.

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

## Docker

This repo's `Dockerfile`/`nginx.conf` build and serve the static SPA on
their own — no dependency on the portfolio repo or anything outside this
directory. Because the Vite build uses `base: "/blog/"` (see
`vite.config.ts`), the nginx config serves the built app under that same
`/blog/` subpath, redirecting `/` to it, so it behaves the same locally as
it does on GitHub Pages:

```bash
docker build -t kdbrian-blog \
  --build-arg VITE_SUPABASE_URL=https://<ref>.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=<anon-key> .
docker run -p 8081:80 kdbrian-blog   # → http://localhost:8081/blog/
```

If you're also running the portfolio locally and want both up against the
same Supabase project at once, there's a `docker-compose.yml` one level up
(in the parent directory that holds both repo checkouts, not inside either
repo — each service still owns its standalone Dockerfile and
`.env.example` here, so this repo keeps building correctly entirely on its
own, e.g. in CI). It builds both from a single shared `.env`. That compose
file is local tooling only and isn't tracked by this repo.

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
   npx supabase functions deploy github-auth publish-blog delete-blog publish-project delete-project \
     upload-media publish-milestone delete-milestone publish-skill publish-social-link \
     delete-social-link publish-profile publish-history-entry delete-history-entry \
     drafts-list drafts-save drafts-delete
   ```
   No local Supabase install or Docker needed — this only talks to your cloud
   project (`supabase start`/local dev emulation is unrelated and unused).
3. **GitHub OAuth App** (Studio sign-in — GitHub is the only login method,
   there's no password): create one at
   [github.com/settings/developers](https://github.com/settings/developers)
   → "New OAuth App":
   - **Homepage URL**: `https://kdbrian.github.io/blog`
   - **Authorization callback URL**: `https://kdbrian.github.io/blog/admin/studio`
     (exact match required — this is hardcoded in `src/lib/github-oauth.ts`)

   Copy the generated Client ID and Client Secret; you'll need both below.
4. Set the secrets below, then visit `https://kdbrian.github.io/blog/admin/studio`.

## Secrets checklist

**Supabase Edge Function secrets** — set with `npx supabase secrets set
NAME=value`. Write-only: there's no way to read a value back once set, so
save whatever you generate somewhere safe first.

| Secret | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | Client ID from the GitHub OAuth App above (also needed client-side, see `VITE_GITHUB_CLIENT_ID` below). |
| `GITHUB_CLIENT_SECRET` | Client Secret from the same OAuth App. Never exposed to the client — only this edge function sees it. |
| `ADMIN_GITHUB_LOGIN` | The one GitHub username allowed to sign in (case-insensitive). Defaults to `kdbrian` if unset. |
| `JWT_SECRET` | Signs the session token. Generate: `openssl rand -base64 32`. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the platform — nothing to set for those.

**GitHub Actions repo secrets** (Settings → Secrets and variables → Actions —
public-safe values the client bundle needs at build time):

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` — same value used in the portfolio repo |
| `VITE_SUPABASE_ANON_KEY` | Your project's anon/public key — same value used in the portfolio repo |
| `VITE_GITHUB_CLIENT_ID` | Client ID from the GitHub OAuth App above. Not secret, but kept alongside the others for consistency. |

`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are **required** — if either is
missing, the build still succeeds, but the client silently builds with an
empty API base URL, so Studio requests go to your own domain instead of
Supabase and fail with a `405`. `VITE_GITHUB_CLIENT_ID` missing just breaks
the "Sign in with GitHub" button.

**Client `.env.local`** (local dev only, gitignored) — same three `VITE_`
values, see `.env.example`.

## Troubleshooting

- **Page loads blank, console shows a MIME-type error on `main.tsx`**: Pages
  source is set to "Deploy from a branch" instead of "GitHub Actions". Fix
  the setting, then push a commit (an empty one is fine) to trigger a fresh
  deploy — the setting change alone doesn't retroactively republish.
- **Studio login (or any write) fails with `405` on a request to your own
  domain instead of Supabase**: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  Actions secrets aren't set.
- **"Sign in with GitHub" redirects back with an error, or with no
  `code`/`state` at all**: the OAuth App's Authorization callback URL
  doesn't exactly match `https://kdbrian.github.io/blog/admin/studio`, or
  `VITE_GITHUB_CLIENT_ID` wasn't set at build time.
- **GitHub sign-in succeeds but Studio still says unauthorized (403)**: the
  signed-in GitHub username doesn't match `ADMIN_GITHUB_LOGIN` (defaults to
  `kdbrian`).
- **Studio login fails with 401 after a successful GitHub sign-in**: edge
  functions default to Supabase's own gateway-level JWT verification, which
  this app's custom auth doesn't satisfy. Every function needs
  `verify_jwt = false` in `supabase/config.toml` (already configured here)
  — if you add a new function, add its entry too, then redeploy.
- **GitHub sign-in works locally against `docker compose`**: it won't — the
  OAuth callback URL is hardcoded to the production Studio URL. Everything
  else (reading posts/projects) works fine locally; sign-in only completes
  against the deployed site.
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

const STATE_KEY = "studio.oauthState";

// GitHub OAuth Apps only accept one exact, pre-registered callback URL, so
// this is intentionally the fixed production Studio URL rather than
// something derived from window.location — register exactly this in the
// OAuth App's "Authorization callback URL" field.
export const GITHUB_REDIRECT_URI = "https://kdbrian.github.io/blog/admin/studio";

export function startGithubLogin() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");

  window.location.assign(url.toString());
}

/** Reads `?code=&state=` off the current URL, verifying state against what we stashed before redirecting. */
export function consumeGithubCallback(): { code: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!code || !state || !expectedState || state !== expectedState) return null;
  return { code };
}

/** Strips ?code=&state= from the URL bar without a reload, once the exchange is done (or failed). */
export function clearGithubCallbackParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());
}

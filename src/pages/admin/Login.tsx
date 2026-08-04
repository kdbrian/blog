import { useEffect, useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import {
  GITHUB_REDIRECT_URI,
  clearGithubCallbackParams,
  consumeGithubCallback,
  startGithubLogin,
} from "@/lib/github-oauth";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    const callback = consumeGithubCallback();
    if (!callback) return;

    setExchanging(true);
    api
      .loginWithGithub(callback.code, GITHUB_REDIRECT_URI)
      .then(({ token }) => {
        saveSession(token);
        onSuccess();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => {
        setExchanging(false);
        clearGithubCallbackParams();
      });
    // Only ever run once, against whatever code/state landed in the URL on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto mb-6 flex w-fit items-center gap-2">
          <div className="rounded-xl bg-accent-soft p-2 text-accent">
            <Github size={18} />
          </div>
          <h1 className="font-display text-lg font-semibold">Studio access</h1>
        </div>

        <p className="text-sm text-ink/60">Sign in with the authorized GitHub account to continue.</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={startGithubLogin}
          disabled={exchanging}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-40"
        >
          {exchanging ? <Loader2 size={14} className="animate-spin" /> : <Github size={16} />}
          {exchanging ? "Signing in…" : "Sign in with GitHub"}
        </button>
      </div>
    </div>
  );
}

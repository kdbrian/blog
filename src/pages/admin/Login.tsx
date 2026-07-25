import { useState, type FormEvent } from "react";
import { Lock, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.login(password);
      saveSession(token);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-xl bg-accent-soft p-2 text-accent">
            <Lock size={18} />
          </div>
          <h1 className="font-display text-lg font-semibold">Studio access</h1>
        </div>

        <label className="block text-sm font-medium text-ink/70" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-40"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Enter
        </button>
      </form>
    </div>
  );
}

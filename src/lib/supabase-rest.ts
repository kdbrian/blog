const REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function headers() {
  return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
}

/** Public, anonymous read against a PostgREST table/view — RLS enforces what's visible. */
export async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${REST_URL}/${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status}) for ${path}`);
  return res.json();
}

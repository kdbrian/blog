const TOKEN_KEY = "studio.jwt";
const LAST_ACTIVE_KEY = "studio.lastActive";
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function saveSession(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  touchSession();
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LAST_ACTIVE_KEY);
}

export function touchSession() {
  sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

/** Returns the token, or null if missing / expired / idle-timed-out. */
export function getValidToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const lastActive = Number(sessionStorage.getItem(LAST_ACTIVE_KEY) || 0);
  if (!token) return null;

  if (Date.now() - lastActive > IDLE_TIMEOUT_MS) {
    clearSession();
    return null;
  }

  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      clearSession();
      return null;
    }
  } catch {
    clearSession();
    return null;
  }

  return token;
}

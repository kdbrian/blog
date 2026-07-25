import { verifyJwt } from "./jwt.ts";

export async function requireAuth(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) return { ok: false, status: 500, error: "Server is missing JWT_SECRET." };

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Missing session token." };

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload || payload.role !== "admin") {
    return { ok: false, status: 401, error: "Session expired — please log in again." };
  }

  return { ok: true };
}

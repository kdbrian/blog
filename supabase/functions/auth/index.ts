import { corsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { signJwt, timingSafeEqual } from "../_shared/jwt.ts";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour hard cap; idle timeout on the client logs out sooner

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { password } = await req.json();
    const adminSecret = Deno.env.get("ADMIN_SECRET");
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!adminSecret || !jwtSecret) {
      return jsonResponse({ error: "Server is missing ADMIN_SECRET or JWT_SECRET." }, 500);
    }
    if (typeof password !== "string" || !timingSafeEqual(password, adminSecret)) {
      // Deliberately generic message + small delay to blunt brute-force probing.
      await new Promise((r) => setTimeout(r, 400));
      return jsonResponse({ error: "Incorrect password." }, 401);
    }

    const token = await signJwt({ role: "admin" }, jwtSecret, TOKEN_TTL_SECONDS);
    return jsonResponse({ token });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400);
  }
});

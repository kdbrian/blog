import { corsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { signJwt } from "../_shared/jwt.ts";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour hard cap; idle timeout on the client logs out sooner

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { code, redirectUri } = await req.json();
    const clientId = Deno.env.get("GITHUB_CLIENT_ID");
    const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
    const jwtSecret = Deno.env.get("JWT_SECRET");
    const adminLogin = (Deno.env.get("ADMIN_GITHUB_LOGIN") || "kdbrian").toLowerCase();

    if (!clientId || !clientSecret || !jwtSecret) {
      return jsonResponse(
        { error: "Server is missing GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, or JWT_SECRET." },
        500
      );
    }
    if (typeof code !== "string" || !code) {
      return jsonResponse({ error: "Missing GitHub authorization code." }, 400);
    }

    // Exchange the one-time code for a GitHub access token. This step needs
    // the client secret, so it can only happen server-side.
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return jsonResponse({ error: "GitHub sign-in failed — the code may have expired. Try again." }, 401);
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "kdbrian-blog-studio",
      },
    });
    if (!userRes.ok) {
      return jsonResponse({ error: "Couldn't verify your GitHub identity." }, 401);
    }
    const ghUser = await userRes.json();
    const login = String(ghUser.login || "").toLowerCase();

    if (login !== adminLogin) {
      // Deliberately generic message + small delay, same posture the old
      // password check used to blunt probing.
      await new Promise((r) => setTimeout(r, 400));
      return jsonResponse({ error: "This GitHub account isn't authorized for Studio access." }, 403);
    }

    const token = await signJwt({ role: "admin", sub: login }, jwtSecret, TOKEN_TTL_SECONDS);
    return jsonResponse({ token });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400);
  }
});

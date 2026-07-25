import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { serviceClient } from "../_shared/supabase.ts";

const SLUG_RE = /^[a-z0-9-]+$/;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-]/g, "-").replace(/-+/g, "-");
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { filename, base64, folder, slug } = await req.json();

    if (!filename || !base64 || !folder || !slug) {
      return jsonResponse({ error: "filename, base64, folder, and slug are all required." }, 400);
    }
    if (!SLUG_RE.test(slug)) {
      return jsonResponse({ error: "Invalid slug." }, 400);
    }
    if (folder !== "blog-images" && folder !== "projects" && folder !== "profile") {
      return jsonResponse({ error: "folder must be 'blog-images', 'projects', or 'profile'." }, 400);
    }
    if (base64.length * 0.75 > MAX_BYTES) {
      return jsonResponse({ error: "File too large (15MB limit)." }, 400);
    }

    const clean = sanitizeFilename(filename);
    const ext = clean.split(".").pop() || "";
    const path = `${folder}/${slug}/${Date.now()}-${clean}`;
    const bytes = base64ToBytes(base64);

    const supabase = serviceClient();
    const { error } = await supabase.storage.from("media").upload(path, bytes, {
      contentType: MIME_TYPES[ext] || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return jsonResponse({ path, url: data.publicUrl });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

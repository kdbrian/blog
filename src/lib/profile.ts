import type { Profile } from "@/types/content";
import { restGet } from "@/lib/supabase-rest";

type ProfileRow = {
  headline: string;
  tagline: string;
  bio: string;
  location: string;
  image_url: string | null;
  shape_seed: number;
  shape_points: number;
  shape_irregularity: number;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    headline: row.headline,
    tagline: row.tagline,
    bio: row.bio,
    location: row.location,
    imageUrl: row.image_url ?? undefined,
    shape: { seed: row.shape_seed, points: row.shape_points, irregularity: row.shape_irregularity },
  };
}

export async function fetchProfile(): Promise<Profile | null> {
  const rows = await restGet<ProfileRow[]>("profile?select=*&id=eq.main&limit=1");
  return rows[0] ? mapProfile(rows[0]) : null;
}

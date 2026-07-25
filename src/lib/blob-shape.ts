import type { BlobShape } from "@/types/content";

/** Small, deterministic PRNG so a given seed always reproduces the same blob. */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A smooth, closed, organic blob path in objectBoundingBox space (0..1),
 * suitable for an SVG clipPath with clipPathUnits="objectBoundingBox" —
 * meaning it scales to fit whatever box it's applied to, at any size.
 * Points sit on a jittered circle and are connected with a Catmull-Rom
 * spline (converted to cubic beziers) for a squishy, rounded silhouette
 * rather than a faceted polygon.
 */
export function generateBlobPath({ seed, points, irregularity }: BlobShape): string {
  const rand = mulberry32(seed);
  const n = Math.max(4, Math.round(points));
  const jitter = Math.min(0.9, Math.max(0, irregularity));
  const center = 0.5;
  const baseRadius = 0.5;
  const angleStep = (Math.PI * 2) / n;

  const coords: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep;
    const r = baseRadius * (1 - jitter + jitter * rand());
    coords.push([center + Math.cos(angle) * r, center + Math.sin(angle) * r]);
  }

  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = coords[(i - 1 + n) % n];
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const p3 = coords[(i + 2) % n];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    if (i === 0) parts.push(`M ${p1[0].toFixed(4)} ${p1[1].toFixed(4)}`);
    parts.push(
      `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)} ${cp2x.toFixed(4)} ${cp2y.toFixed(4)} ${p2[0].toFixed(4)} ${p2[1].toFixed(4)}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}

export const BLOB_PRESETS: { name: string; shape: BlobShape }[] = [
  { name: "Splash", shape: { seed: 7, points: 7, irregularity: 0.45 } },
  { name: "Pebble", shape: { seed: 22, points: 6, irregularity: 0.2 } },
  { name: "Wave", shape: { seed: 3, points: 9, irregularity: 0.35 } },
  { name: "Puddle", shape: { seed: 41, points: 5, irregularity: 0.55 } },
];

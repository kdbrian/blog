import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

const PREVIEW_MAX = 480;
const CORNERS = ["nw", "ne", "sw", "se"] as const;
type Corner = (typeof CORNERS)[number];
type DragMode = "move" | Corner;

type Rect = { x: number; y: number; w: number; h: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ImageCropModal({
  src,
  uploadFn,
  onCancel,
  onApply,
  aspect,
}: {
  src: string;
  uploadFn: (file: File) => Promise<string>;
  onCancel: () => void;
  onApply: (url: string) => void;
  /** Optional width/height ratio (e.g. 1 for square) to lock the crop rect to. Free-form when omitted. */
  aspect?: number;
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 10, y: 10, w: 80, h: 80 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; rect: Rect } | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const scale = Math.min(1, PREVIEW_MAX / img.naturalWidth);
      setDisplaySize({ w: img.naturalWidth * scale, h: img.naturalHeight * scale });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!displaySize || !aspect) return;
    const k = (aspect * displaySize.h) / displaySize.w; // desired pct-width / pct-height
    let h = 80;
    let w = k * h;
    if (w > 90) {
      w = 90;
      h = w / k;
    }
    setRect({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
  }, [displaySize, aspect]);

  function startDrag(mode: DragMode) {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, rect };
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !displaySize) return;
    const { mode, startX, startY, rect: r0 } = dragRef.current;
    const dxPct = ((e.clientX - startX) / displaySize.w) * 100;
    const dyPct = ((e.clientY - startY) / displaySize.h) * 100;
    const next: Rect = { ...r0 };

    if (mode === "move") {
      next.x = clamp(r0.x + dxPct, 0, 100 - r0.w);
      next.y = clamp(r0.y + dyPct, 0, 100 - r0.h);
    } else {
      if (mode.includes("e")) next.w = clamp(r0.w + dxPct, 5, 100 - r0.x);
      if (mode.includes("s")) next.h = clamp(r0.h + dyPct, 5, 100 - r0.y);
      if (mode.includes("w")) {
        const newX = clamp(r0.x + dxPct, 0, r0.x + r0.w - 5);
        next.w = r0.w + (r0.x - newX);
        next.x = newX;
      }
      if (mode.includes("n")) {
        const newY = clamp(r0.y + dyPct, 0, r0.y + r0.h - 5);
        next.h = r0.h + (r0.y - newY);
        next.y = newY;
      }

      if (aspect) {
        const k = (aspect * displaySize.h) / displaySize.w;
        const anchorX = mode.includes("w") ? r0.x + r0.w : r0.x;
        const anchorY = mode.includes("n") ? r0.y + r0.h : r0.y;
        let h = clamp(next.h, 5, 100);
        let w = k * h;
        let x = mode.includes("w") ? anchorX - w : anchorX;
        let y = mode.includes("n") ? anchorY - h : anchorY;
        if (x < 0) {
          w += x;
          x = 0;
          h = w / k;
        }
        if (x + w > 100) {
          w = 100 - x;
          h = w / k;
        }
        if (y < 0) {
          h += y;
          y = 0;
          w = k * h;
        }
        if (y + h > 100) {
          h = 100 - y;
          w = k * h;
        }
        next.x = x;
        next.y = y;
        next.w = w;
        next.h = h;
      }
    }
    setRect(next);
  }

  function stopDrag() {
    dragRef.current = null;
  }

  async function applyCrop() {
    if (!natural) return;
    setSaving(true);
    setError(null);
    try {
      const sx = (rect.x / 100) * natural.w;
      const sy = (rect.y / 100) * natural.h;
      const sw = (rect.w / 100) * natural.w;
      const sh = (rect.h / 100) * natural.h;

      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Couldn't load image for cropping."));
        img.src = src;
      });

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed."))), "image/png")
      );
      const file = new File([blob], "cropped.png", { type: "image/png" });
      const url = await uploadFn(file);
      onApply(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-6" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">Crop image</p>
          <button onClick={onCancel} className="text-ink/40 hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {!displaySize && <p className="py-10 text-center text-sm text-ink/40">Loading…</p>}

        {displaySize && (
          <div
            className="relative mx-auto select-none overflow-hidden rounded-lg bg-ink/5"
            style={{ width: displaySize.w, height: displaySize.h }}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
          >
            <img src={src} alt="" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />

            {/* Dark mask outside the crop rect, as four bars */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-ink/50" style={{ height: `${rect.y}%` }} />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/50"
              style={{ height: `${100 - rect.y - rect.h}%` }}
            />
            <div
              className="pointer-events-none absolute bg-ink/50"
              style={{ left: 0, top: `${rect.y}%`, width: `${rect.x}%`, height: `${rect.h}%` }}
            />
            <div
              className="pointer-events-none absolute bg-ink/50"
              style={{
                left: `${rect.x + rect.w}%`,
                top: `${rect.y}%`,
                width: `${100 - rect.x - rect.w}%`,
                height: `${rect.h}%`,
              }}
            />

            <div
              onPointerDown={startDrag("move")}
              className="absolute cursor-move border-2 border-white"
              style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` }}
            >
              {CORNERS.map((corner) => (
                <span
                  key={corner}
                  onPointerDown={startDrag(corner)}
                  className={`absolute h-3 w-3 rounded-full border-2 border-accent bg-white ${
                    corner.includes("n") ? "-top-1.5" : "-bottom-1.5"
                  } ${corner.includes("w") ? "-left-1.5" : "-right-1.5"} ${
                    corner === "nw" || corner === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-line px-3.5 py-1.5 text-sm">
            Cancel
          </button>
          <button
            onClick={applyCrop}
            disabled={saving || !displaySize}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-1.5 text-sm text-paper disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}

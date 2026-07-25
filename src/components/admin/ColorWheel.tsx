import { useEffect, useRef, useState } from "react";

const SIZE = 104;
const RADIUS = SIZE / 2;

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s: s * 100, l: l * 100 };
}

export default function ColorWheel({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const parsed = (value && hexToHsl(value)) || { h: 0, s: 0, l: 50 };
  const [hue, setHue] = useState(parsed.h);
  const [saturation, setSaturation] = useState(parsed.s);
  const [lightness, setLightness] = useState(value ? parsed.l : 50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let angle = 0; angle < 360; angle++) {
      const start = ((angle - 1) * Math.PI) / 180;
      const end = ((angle + 1) * Math.PI) / 180;
      const gradient = ctx.createRadialGradient(RADIUS, RADIUS, 0, RADIUS, RADIUS, RADIUS);
      gradient.addColorStop(0, "#fff");
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      ctx.beginPath();
      ctx.moveTo(RADIUS, RADIUS);
      ctx.arc(RADIUS, RADIUS, RADIUS, start, end);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, []);

  function pick(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - rect.left - RADIUS;
    const dy = clientY - rect.top - RADIUS;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const h = (angle + 360) % 360;
    const s = Math.min(100, (distance / RADIUS) * 100);
    setHue(h);
    setSaturation(s);
    onChange(hslToHex(h, s, lightness));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    pick(e.clientX, e.clientY);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging.current) return;
    pick(e.clientX, e.clientY);
  }
  function handlePointerUp() {
    dragging.current = false;
  }

  const indicatorAngle = (hue * Math.PI) / 180;
  const indicatorDist = (saturation / 100) * RADIUS;
  const indicatorX = RADIUS + indicatorDist * Math.cos(indicatorAngle);
  const indicatorY = RADIUS + indicatorDist * Math.sin(indicatorAngle);

  return (
    <div className="flex flex-col items-center gap-2 p-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="cursor-crosshair rounded-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: indicatorX, top: indicatorY, backgroundColor: hslToHex(hue, saturation, lightness) }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={lightness}
        onChange={(e) => {
          const l = Number(e.target.value);
          setLightness(l);
          onChange(hslToHex(hue, saturation, l));
        }}
        className="h-1.5 w-full cursor-pointer accent-ink"
        aria-label="Lightness"
      />
    </div>
  );
}

import type { CSSProperties } from "react";
import type { Theme } from "@/types/content";

function luminance(hex: string): number | null {
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(m)) return null;
  const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const r = chan(parseInt(m.slice(0, 2), 16) / 255);
  const g = chan(parseInt(m.slice(2, 4), 16) / 255);
  const b = chan(parseInt(m.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function themeBackgroundStyle(theme?: Theme | null): CSSProperties {
  if (!theme || !theme.value) return {};
  if (theme.type === "color") return { backgroundColor: theme.value };
  if (theme.type === "gradient") return { backgroundImage: theme.value };
  if (theme.type === "image") {
    return {
      backgroundImage: `url("${theme.value}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {};
}

/** Solid colors get a real contrast check; gradients/images can't be introspected cheaply, so they always get a scrim + light text (the safe default for arbitrary backgrounds). */
export function themeNeedsLightText(theme?: Theme | null): boolean {
  if (!theme || !theme.value) return false;
  if (theme.type === "color") {
    const l = luminance(theme.value);
    return l === null ? true : l < 0.5;
  }
  return true;
}

export function themeNeedsScrim(theme?: Theme | null): boolean {
  return !!theme?.value && theme.type !== "color";
}

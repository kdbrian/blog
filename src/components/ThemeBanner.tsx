import type { ReactNode } from "react";
import type { Theme } from "@/types/content";
import { themeBackgroundStyle, themeNeedsLightText, themeNeedsScrim } from "@/lib/theme";

/**
 * Wraps content in an optional themed background (color/gradient/image) with
 * an automatic contrast pass: solid colors get a real luminance check,
 * gradients/images (which can't be cheaply introspected) always get a dark
 * scrim + light text. With no theme set, this is a transparent no-op wrapper
 * — callers never need to branch on whether a theme exists.
 */
export default function ThemeBanner({
  theme,
  className = "",
  children,
}: {
  theme?: Theme | null;
  className?: string;
  children: ReactNode;
}) {
  const light = themeNeedsLightText(theme);
  const scrim = themeNeedsScrim(theme);

  return (
    <div className={`relative overflow-hidden ${className}`} style={themeBackgroundStyle(theme)}>
      {scrim && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}
      <div className={`relative ${light ? "text-white" : ""}`}>{children}</div>
    </div>
  );
}

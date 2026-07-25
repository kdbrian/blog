import type { Theme } from "@/types/content";
import { themeBackgroundStyle, themeNeedsLightText, themeNeedsScrim } from "@/lib/theme";

const PRESET_GRADIENTS = [
  "linear-gradient(135deg, #EA580C, #0F766E)",
  "linear-gradient(135deg, #1C1917, #EA580C)",
  "linear-gradient(135deg, #0F766E, #1C1917)",
  "linear-gradient(135deg, #EA580C, #FACC15)",
];

export default function ThemePicker({
  value,
  onChange,
}: {
  value: Theme | null;
  onChange: (theme: Theme | null) => void;
}) {
  const type = value?.type;

  function setType(t: Theme["type"]) {
    if (t === "color") onChange({ type: "color", value: value?.type === "color" ? value.value : "#EA580C" });
    else if (t === "gradient")
      onChange({ type: "gradient", value: value?.type === "gradient" ? value.value : PRESET_GRADIENTS[0] });
    else onChange({ type: "image", value: value?.type === "image" ? value.value : "" });
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/40">Theme background</p>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-lg border px-2.5 py-1 text-xs ${
            !value ? "border-ink bg-ink text-paper" : "border-line text-ink/60 hover:text-ink"
          }`}
        >
          None
        </button>
        {(["color", "gradient", "image"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg border px-2.5 py-1 text-xs capitalize ${
              type === t ? "border-ink bg-ink text-paper" : "border-line text-ink/60 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {type === "color" && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value!.value) ? value!.value : "#EA580C"}
            onChange={(e) => onChange({ type: "color", value: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-line"
          />
          <input
            value={value!.value}
            onChange={(e) => onChange({ type: "color", value: e.target.value })}
            placeholder="#EA580C"
            className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      )}

      {type === "gradient" && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1.5">
            {PRESET_GRADIENTS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ type: "gradient", value: g })}
                style={{ backgroundImage: g }}
                className={`h-7 w-10 rounded-lg border ${
                  value!.value === g ? "border-ink ring-2 ring-ink/30" : "border-line"
                }`}
              />
            ))}
          </div>
          <input
            value={value!.value}
            onChange={(e) => onChange({ type: "gradient", value: e.target.value })}
            placeholder="linear-gradient(135deg, #EA580C, #0F766E)"
            className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      )}

      {type === "image" && (
        <input
          value={value!.value}
          onChange={(e) => onChange({ type: "image", value: e.target.value })}
          placeholder="Image URL — upload media above, then paste its URL here"
          className="mt-2 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-accent"
        />
      )}

      {value?.value && (
        <div className="relative mt-2 h-14 overflow-hidden rounded-lg" style={themeBackgroundStyle(value)}>
          {themeNeedsScrim(value) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          )}
          <p
            className={`relative flex h-full items-end p-2 text-xs font-medium ${
              themeNeedsLightText(value) ? "text-white" : "text-ink"
            }`}
          >
            Preview
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmDialog({
  itemName,
  extraOption,
  onCancel,
  onConfirm,
}: {
  itemName: string;
  extraOption?: string; // e.g. "Also delete its media"
  onCancel: () => void;
  onConfirm: (extraChecked: boolean) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [extraChecked, setExtraChecked] = useState(true);
  const canConfirm = confirmText.trim() === itemName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-red-50 p-2 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <button onClick={onCancel} className="text-ink/30 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <h2 className="mt-4 font-display font-semibold">Delete "{itemName}"?</h2>
        <p className="mt-1 text-sm text-ink/60">
          This can't be undone. Type <span className="font-mono font-medium text-ink">{itemName}</span> to confirm.
        </p>

        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-4 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red-400"
          placeholder={itemName}
        />

        {extraOption && (
          <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={extraChecked}
              onChange={(e) => setExtraChecked(e.target.checked)}
              className="rounded border-line"
            />
            {extraOption}
          </label>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-ink/5"
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => onConfirm(extraChecked)}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

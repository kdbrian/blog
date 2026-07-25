import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaUploader({
  folder,
  slug,
  onUploaded,
}: {
  folder: "blog-images" | "projects";
  slug: string;
  onUploaded: (url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!slug) {
      setError("Add a title first so media has somewhere to live.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const { url } = await api.uploadMedia(file.name, base64, folder, slug);
        onUploaded(url);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
        dragging ? "border-accent bg-accent-soft" : "border-line hover:border-ink/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <Loader2 size={20} className="animate-spin text-ink/40" />
      ) : (
        <UploadCloud size={20} className="text-ink/40" />
      )}
      <p className="text-sm text-ink/60">
        {uploading ? "Uploading…" : "Drag & drop images/video, or click to browse"}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

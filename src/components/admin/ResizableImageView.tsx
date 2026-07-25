import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Crop } from "lucide-react";
import ImageCropModal from "@/components/admin/ImageCropModal";
import type { ResizableImageOptions } from "@/lib/tiptap-resizable-image";

export default function ResizableImageView({ node, updateAttributes, selected, extension }: NodeViewProps) {
  const [cropping, setCropping] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  function startResize(e: React.PointerEvent<HTMLSpanElement>) {
    e.preventDefault();
    e.stopPropagation();
    const img = e.currentTarget.parentElement?.querySelector("img");
    const startWidth = img?.getBoundingClientRect().width ?? 300;
    dragRef.current = { startX: e.clientX, startWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent<HTMLSpanElement>) {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    const newWidth = Math.max(60, Math.round(dragRef.current.startWidth + delta));
    updateAttributes({ width: `${newWidth}px` });
  }
  function stopResize() {
    dragRef.current = null;
  }

  const uploadFn = (extension.options as ResizableImageOptions).uploadFn;

  return (
    <NodeViewWrapper as="span" className="relative inline-block leading-none">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        style={{ width: node.attrs.width || undefined }}
        className={`rounded-lg align-bottom ${selected ? "ring-2 ring-accent ring-offset-2" : ""}`}
        draggable={false}
      />
      {selected && (
        <>
          {uploadFn && (
            <button
              type="button"
              onClick={() => setCropping(true)}
              className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-ink/80 px-1.5 py-1 text-xs text-paper hover:bg-ink"
            >
              <Crop size={12} /> Crop
            </button>
          )}
          <span
            onPointerDown={startResize}
            onPointerMove={onResizeMove}
            onPointerUp={stopResize}
            className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-nwse-resize rounded-tl-md bg-accent"
          />
        </>
      )}
      {cropping && uploadFn && (
        <ImageCropModal
          src={node.attrs.src}
          uploadFn={uploadFn}
          onCancel={() => setCropping(false)}
          onApply={(url) => {
            updateAttributes({ src: url, width: null });
            setCropping(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

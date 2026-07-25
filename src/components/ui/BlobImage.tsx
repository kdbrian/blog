import { useId, useMemo } from "react";
import type { BlobShape } from "@/types/content";
import { generateBlobPath } from "@/lib/blob-shape";

export default function BlobImage({
  src,
  alt,
  shape,
  className = "",
}: {
  src: string;
  alt: string;
  shape: BlobShape;
  className?: string;
}) {
  const clipId = `blob-${useId().replace(/:/g, "")}`;
  const path = useMemo(() => generateBlobPath(shape), [shape]);

  return (
    <div className={`relative ${className}`}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={path} />
          </clipPath>
        </defs>
      </svg>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ clipPath: `url(#${clipId})` }}
      />
    </div>
  );
}

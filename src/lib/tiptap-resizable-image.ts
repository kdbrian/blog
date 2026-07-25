import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "@/components/admin/ResizableImageView";

export interface ResizableImageOptions {
  uploadFn?: (file: File) => Promise<string>;
}

const ResizableImage = Image.extend<ResizableImageOptions>({
  atom: true,
  selectable: true,
  addOptions() {
    return {
      ...this.parent?.(),
      uploadFn: undefined,
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.style.width || null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;

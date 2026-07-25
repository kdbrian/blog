import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension, InputRule } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold, Italic, Strikethrough, Link as LinkIcon, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Image as ImageIcon, Film, Smile,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Palette,
} from "lucide-react";
import MediaUploader from "@/components/admin/MediaUploader";
import ColorWheel from "@/components/admin/ColorWheel";
import ResizableImage from "@/lib/tiptap-resizable-image";
import { api } from "@/lib/api";

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Orange", value: "#EA580C" },
  { label: "Teal", value: "#0F766E" },
  { label: "Red", value: "#DC2626" },
  { label: "Blue", value: "#2563EB" },
  { label: "Purple", value: "#7C3AED" },
  { label: "Gray", value: "#78716C" },
];

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(\d+)/;

const EMOJI_MAP: Record<string, string> = {
  smile: "😄", laughing: "😆", wink: "😉", heart: "❤️", thumbsup: "👍", thumbsdown: "👎",
  fire: "🔥", rocket: "🚀", tada: "🎉", eyes: "👀", thinking: "🤔", clap: "👏",
  100: "💯", check: "✅", x: "❌", warning: "⚠️", bug: "🐛", sparkles: "✨",
  wave: "👋", pray: "🙏", muscle: "💪", star: "⭐", bulb: "💡", coffee: "☕",
};
const EMOJI_PICKS = Object.values(EMOJI_MAP);

const EmojiShortcodes = Extension.create({
  name: "emojiShortcodes",
  addInputRules() {
    return [
      new InputRule({
        find: /:([a-z0-9_+-]+):$/,
        handler: ({ state, range, match }) => {
          const emoji = EMOJI_MAP[match[1]];
          if (!emoji) return;
          state.tr.insertText(emoji, range.from, range.to);
        },
      }),
    ];
  },
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RichTextEditor({
  content,
  slug,
  folder = "blog-images",
  onChange,
}: {
  content: string;
  slug: string;
  folder?: "blog-images" | "projects";
  onChange: (html: string) => void;
}) {
  const [showMedia, setShowMedia] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColors) return;
    function onPointerDown(e: PointerEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showColors]);

  const uploadFnRef = useRef<(file: File) => Promise<string>>();
  uploadFnRef.current = async (file: File) => {
    const base64 = await fileToBase64(file);
    const { url } = await api.uploadMedia(file.name, base64, folder, slug);
    return url;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ uploadFn: (file) => uploadFnRef.current!(file) }),
      Youtube.configure({ nocookie: true }),
      Placeholder.configure({ placeholder: "Start writing… (try typing :fire:)" }),
      EmojiShortcodes,
      Subscript,
      Superscript,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep editor in sync when switching between drafts — but skip the very
  // first run (the editor already initialized with this exact `content`,
  // so re-setting it here just to normalize "" vs "<p></p>" would reset
  // the cursor before the user gets a chance to type) and skip while the
  // editor is focused, so an onChange echo mid-keystroke can't stomp on it.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (editor && !editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  function insertEmbed() {
    if (!embedUrl.trim()) return;
    const yt = embedUrl.match(YOUTUBE_RE);
    const vimeo = embedUrl.match(VIMEO_RE);

    if (yt) {
      editor!.chain().focus().setYoutubeVideo({ src: embedUrl }).run();
    } else if (vimeo) {
      editor!
        .chain()
        .focus()
        .insertContent(
          `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
        )
        .run();
    } else if (embedUrl.trim().startsWith("<iframe")) {
      editor!.chain().focus().insertContent(embedUrl).run();
    } else {
      editor!
        .chain()
        .focus()
        .insertContent(`<iframe src="${embedUrl}" allowfullscreen></iframe>`)
        .run();
    }
    setEmbedUrl("");
    setShowEmbed(false);
  }

  const btn = (active: boolean) =>
    `rounded-lg p-1.5 transition ${active ? "bg-ink text-paper" : "text-ink/60 hover:bg-ink/10"}`;

  return (
    <div className="rounded-xl border border-line bg-white text-ink">
      {/* Toolbar — every formatting control lives here (not in a hover-only
          bubble menu) so it's reachable via keyboard/screen reader without
          first having to make a mouse text selection. */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line p-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} aria-label="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} aria-label="Italic">
          <Italic size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} aria-label="Strikethrough">
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={btn(editor.isActive("subscript"))}
          aria-label="Subscript"
        >
          <SubscriptIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={btn(editor.isActive("superscript"))}
          aria-label="Superscript"
        >
          <SuperscriptIcon size={16} />
        </button>
        <div className="mx-1 h-5 w-px bg-line" />
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} aria-label="Heading 2">
          <Heading2 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} aria-label="Heading 3">
          <Heading3 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} aria-label="Bulleted list">
          <List size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} aria-label="Numbered list">
          <ListOrdered size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} aria-label="Blockquote">
          <Quote size={16} />
        </button>
        <div className="mx-1 h-5 w-px bg-line" />
        <button
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={btn(editor.isActive("link"))}
          aria-label="Link"
        >
          <LinkIcon size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive("code"))} aria-label="Inline code">
          <Code size={16} />
        </button>
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => setShowColors((v) => !v)}
            className={btn(showColors || !!editor.getAttributes("textStyle").color)}
            aria-label="Text color"
          >
            <Palette size={16} />
          </button>
          {showColors && (
            <div className="absolute left-0 top-full z-10 mt-1.5 w-max rounded-lg border border-line bg-white p-2 shadow-lg">
              <ColorWheel
                value={editor.getAttributes("textStyle").color}
                onChange={(hex) => editor.chain().focus().setColor(hex).run()}
              />
              <div className="mt-1.5 flex justify-center gap-1 border-t border-line pt-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.label}
                    title={c.label}
                    onClick={() => {
                      if (c.value) editor.chain().focus().setColor(c.value).run();
                      else editor.chain().focus().unsetColor().run();
                      setShowColors(false);
                    }}
                    className="h-5 w-5 rounded-full ring-1 ring-inset ring-line"
                    style={{ backgroundColor: c.value || "#FAFAF9" }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mx-1 h-5 w-px bg-line" />
        <button onClick={() => setShowMedia((v) => !v)} className={btn(showMedia)} aria-label="Insert image">
          <ImageIcon size={16} />
        </button>
        <button onClick={() => setShowEmbed((v) => !v)} className={btn(showEmbed)} aria-label="Embed video">
          <Film size={16} />
        </button>
        <button onClick={() => setShowEmoji((v) => !v)} className={btn(showEmoji)} aria-label="Insert emoji">
          <Smile size={16} />
        </button>
      </div>

      {showEmoji && (
        <div className="grid grid-cols-8 gap-1 border-b border-line p-3">
          {EMOJI_PICKS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                editor.chain().focus().insertContent(emoji).run();
                setShowEmoji(false);
              }}
              className="rounded-lg p-1.5 text-lg hover:bg-ink/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {showMedia && (
        <div className="border-b border-line p-3">
          <MediaUploader
            folder={folder}
            slug={slug}
            onUploaded={(url) => {
              editor.chain().focus().setImage({ src: url }).run();
              setShowMedia(false);
            }}
          />
        </div>
      )}

      {showEmbed && (
        <div className="flex gap-2 border-b border-line p-3">
          <input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="YouTube / Vimeo link, any https:// URL, or an <iframe> tag"
            className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
            onKeyDown={(e) => e.key === "Enter" && insertEmbed()}
          />
          <button onClick={insertEmbed} className="rounded-lg bg-ink px-3 py-1.5 text-sm text-paper">
            Embed
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="prose-post min-h-[320px] px-4 py-3 outline-none [&_.ProseMirror]:outline-none" />
    </div>
  );
}

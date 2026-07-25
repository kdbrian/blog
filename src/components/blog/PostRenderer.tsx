import { useMemo } from "react";
import { marked } from "marked";
import type { Post } from "@/types/content";
import { sanitizeContentHtml } from "@/lib/sanitize-html";

export default function PostRenderer({ post }: { post: Post }) {
  const html = useMemo(() => {
    const raw = post.format === "markdown" ? (marked.parse(post.body) as string) : post.body;
    return sanitizeContentHtml(raw);
  }, [post.body, post.format]);

  return <div className="prose-post" dangerouslySetInnerHTML={{ __html: html }} />;
}

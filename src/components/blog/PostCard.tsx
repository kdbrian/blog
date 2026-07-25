import { useMemo } from "react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import type { Post } from "@/types/content";
import ThemeBanner from "@/components/ThemeBanner";
import { sanitizeContentHtml } from "@/lib/sanitize-html";

export default function PostCard({ post }: { post: Post }) {
  const excerptHtml = useMemo(
    () => (post.excerpt ? sanitizeContentHtml(marked.parseInline(post.excerpt) as string) : ""),
    [post.excerpt]
  );

  return (
    <Link to={`/${post.slug}`} className="card group block overflow-hidden hover:border-ink/20">
      {post.cover && (
        <div className="aspect-[16/9] overflow-hidden bg-ink/5">
          <img
            src={post.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <ThemeBanner theme={post.theme} className="p-5">
        <p className="text-xs opacity-60">
          {new Date(post.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <h3 className="mt-1 font-display font-semibold group-hover:text-accent">{post.title}</h3>
        {excerptHtml && (
          <p className="mt-1.5 text-sm opacity-70" dangerouslySetInnerHTML={{ __html: excerptHtml }} />
        )}
        {!!post.tags?.length && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                {tag}
              </span>
            ))}
          </div>
        )}
      </ThemeBanner>
    </Link>
  );
}

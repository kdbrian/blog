import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Post } from "@/types/content";
import { fetchPostBySlug } from "@/lib/posts";
import PostRenderer from "@/components/blog/PostRenderer";
import ThemeBanner from "@/components/ThemeBanner";

export default function PostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    setPost(undefined);
    fetchPostBySlug(slug)
      .then((p) => setPost(p ?? null))
      .catch(() => setPost(null));
  }, [slug]);

  if (post === undefined) {
    return (
      <p className="flex items-center gap-2 py-14 text-sm text-ink/40">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </p>
    );
  }

  if (!post) {
    return (
      <section className="py-14">
        <p className="text-ink/60">Post not found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-accent">
          <ArrowLeft size={14} /> Back to blog
        </Link>
      </section>
    );
  }

  return (
    <article className="animate-fade-up py-14">
      <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft size={14} /> Back to blog
      </Link>

      {post.cover && <img src={post.cover} alt="" className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover" />}

      <ThemeBanner theme={post.theme} className="-mx-6 rounded-2xl px-6 py-6 sm:mx-0">
        <p className="text-sm opacity-60">
          {new Date(post.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{post.title}</h1>

        {!!post.tags?.length && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                {tag}
              </span>
            ))}
          </div>
        )}
        {!!post.skills?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.skills.map((skill) => (
              <span key={skill.id} className="rounded-full bg-teal-soft px-2 py-0.5 text-xs text-teal">
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </ThemeBanner>

      <div className="mt-8">
        <PostRenderer post={post} />
      </div>
    </article>
  );
}

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Post } from "@/types/content";
import { fetchPosts } from "@/lib/posts";
import PostCard from "@/components/blog/PostCard";

export default function BlogListPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPosts().then(setPosts).catch(() => setError(true));
  }, []);

  return (
    <section className="animate-fade-up py-14">
      <h1 className="text-3xl font-semibold">Blog</h1>
      <p className="mt-2 max-w-xl text-ink/60">Notes on Android dev, AI, and whatever I'm building.</p>

      {error && <p className="mt-10 text-sm text-red-600">Couldn't load posts right now.</p>}
      {!error && !posts && (
        <p className="mt-10 flex items-center gap-2 text-sm text-ink/40">
          <Loader2 size={14} className="animate-spin" /> Loading posts…
        </p>
      )}
      {posts && posts.length === 0 && <p className="mt-10 text-ink/50">No posts published yet.</p>}
      {posts && posts.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

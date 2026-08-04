import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, Link2, Loader2, Smartphone } from "lucide-react";
import type { Project } from "@/types/content";
import { fetchProjectBySlug } from "@/lib/projects";
import { sanitizeContentHtml } from "@/lib/sanitize-html";
import ThemeBanner from "@/components/ThemeBanner";
import CommitHistory from "@/components/CommitHistory";

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    setProject(undefined);
    fetchProjectBySlug(slug)
      .then((p) => setProject(p ?? null))
      .catch(() => setProject(null));
  }, [slug]);

  const notesHtml = useMemo(
    () => (project?.notes ? sanitizeContentHtml(project.notes) : ""),
    [project?.notes],
  );

  if (project === undefined) {
    return (
      <p className="flex items-center gap-2 py-14 text-sm text-ink/40">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </p>
    );
  }

  if (!project) {
    return (
      <section className="py-14">
        <p className="text-ink/60">Project not found.</p>
        <Link to="/projects" className="mt-4 inline-flex items-center gap-1.5 text-accent">
          <ArrowLeft size={14} /> Back to projects
        </Link>
      </section>
    );
  }

  return (
    <article className="animate-fade-up py-14">
      <Link to="/projects" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft size={14} /> Back to projects
      </Link>

      {!!project.images?.length && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {project.images.map((img, i) => (
            <img
              key={img}
              src={img}
              alt={`${project.title} screenshot ${i + 1}`}
              className={`aspect-[4/3] w-full rounded-2xl object-cover ${
                i === 0 && project.images.length > 1 ? "sm:col-span-2 sm:aspect-[16/9]" : ""
              }`}
            />
          ))}
        </div>
      )}

      <ThemeBanner theme={project.theme} className="-mx-6 rounded-2xl px-6 py-6 sm:mx-0">
        <h1 className="text-3xl font-semibold sm:text-4xl">{project.title}</h1>
        {(project.summary || project.description) && (
          <p className="mt-2 max-w-2xl text-lg opacity-70">{project.summary || project.description}</p>
        )}

        {!!project.tags?.length && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-teal-soft px-2 py-0.5 text-xs text-teal">
                {tag}
              </span>
            ))}
          </div>
        )}
        {!!project.skills?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.skills.map((skill) => (
              <span key={skill.id} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                {skill.name}
              </span>
            ))}
          </div>
        )}

        {(project.repoUrl || project.playStoreUrl || !!project.links?.length) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                <Github size={14} /> Source
              </a>
            )}
            {project.playStoreUrl && (
              <a
                href={project.playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                <Smartphone size={14} /> Play Store <ExternalLink size={12} />
              </a>
            )}
            {project.links?.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                <Link2 size={14} /> {link.label}
              </a>
            ))}
          </div>
        )}
      </ThemeBanner>

      {project.description && project.summary && (
        <p className="mt-8 max-w-2xl text-ink/70">{project.description}</p>
      )}

      {notesHtml && (
        <div className="prose-post mt-8" dangerouslySetInnerHTML={{ __html: notesHtml }} />
      )}

      {project.repoUrl && (
        <div className="mt-8">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/40">Commit history</p>
          <CommitHistory repoUrl={project.repoUrl} />
        </div>
      )}
    </article>
  );
}

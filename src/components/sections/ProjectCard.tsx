import { Link } from "react-router-dom";
import { ExternalLink, Github, Link2, Smartphone } from "lucide-react";
import type { Project } from "@/types/content";
import ThemeBanner from "@/components/ThemeBanner";

const MAX_TAGS = 4;
const MAX_SKILLS = 4;

export default function ProjectCard({ project }: { project: Project }) {
  const tags = project.tags || [];
  const visibleTags = tags.slice(0, MAX_TAGS);
  const hiddenTagCount = tags.length - visibleTags.length;

  const skills = project.skills || [];
  const visibleSkills = skills.slice(0, MAX_SKILLS);
  const hiddenSkillCount = skills.length - visibleSkills.length;

  return (
    <div className="card group overflow-hidden transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <Link to={`/projects/${project.slug}`}>
        {project.images?.[0] && (
          <div className="aspect-[4/3] overflow-hidden bg-ink/5">
            <img
              src={project.images[0]}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <ThemeBanner theme={project.theme} className="p-4">
          <h3 className="font-display font-semibold">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm opacity-70">{project.summary || project.description}</p>
        </ThemeBanner>
      </Link>

      <div className="px-4 pb-4">
        {!!tags.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span key={tag} className="rounded-full bg-teal-soft px-2 py-0.5 text-xs text-teal">
                {tag}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">+{hiddenTagCount} more</span>
            )}
          </div>
        )}

        {!!skills.length && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span key={skill.id} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                {skill.name}
              </span>
            ))}
            {hiddenSkillCount > 0 && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">+{hiddenSkillCount} more</span>
            )}
          </div>
        )}

        {(project.repoUrl || project.playStoreUrl || !!project.links?.length) && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
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
      </div>
    </div>
  );
}

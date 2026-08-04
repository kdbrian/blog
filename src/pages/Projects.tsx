import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Project } from "@/types/content";
import { fetchProjects } from "@/lib/projects";
import ProjectCard from "@/components/sections/ProjectCard";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setError(true));
  }, []);

  return (
    <section className="animate-fade-up py-14">
      <h1 className="text-3xl font-semibold">Projects</h1>
      <p className="mt-2 max-w-xl text-ink/60">
        The full case studies — screenshots, write-ups, and commit history behind each build.
      </p>

      {error && <p className="mt-10 text-sm text-red-600">Couldn't load projects right now.</p>}
      {!error && !projects && (
        <p className="mt-10 flex items-center gap-2 text-sm text-ink/40">
          <Loader2 size={14} className="animate-spin" /> Loading projects…
        </p>
      )}
      {projects && projects.length === 0 && <p className="mt-10 text-ink/50">No projects published yet.</p>}
      {projects && projects.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}

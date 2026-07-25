import { useEffect, useState } from "react";
import { Github, Linkedin, Twitter, Instagram, Youtube, Mail, Coffee, Link as LinkIcon } from "lucide-react";
import { fetchSocialLinks } from "@/lib/social";
import type { SocialLink } from "@/types/content";

function iconFor(url: string) {
  if (url.startsWith("mailto:")) return Mail;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("github.com")) return Github;
    if (host.includes("linkedin.com")) return Linkedin;
    if (host.includes("twitter.com") || host.includes("x.com")) return Twitter;
    if (host.includes("instagram.com")) return Instagram;
    if (host.includes("youtube.com")) return Youtube;
    if (host.includes("buymeacoffee.com")) return Coffee;
  } catch {
    /* fall through to generic icon */
  }
  return LinkIcon;
}

export default function SocialIcons({
  size = 18,
  className = "flex gap-3",
}: {
  size?: number;
  className?: string;
}) {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetchSocialLinks().then(setLinks).catch(() => {});
  }, []);

  if (links.length === 0) return null;

  return (
    <div className={`${className} text-ink/50`}>
      {links.map((link) => {
        const Icon = iconFor(link.url);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label || link.url}
            className="hover:text-ink"
          >
            <Icon size={size} />
          </a>
        );
      })}
    </div>
  );
}

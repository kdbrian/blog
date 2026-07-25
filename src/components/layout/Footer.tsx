import SocialIcons from "@/components/layout/SocialIcons";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-content px-6 py-10 text-sm text-ink/30">
      <SocialIcons className="mb-4 flex gap-4" />
      © {new Date().getFullYear()} Brian Kidiga
    </footer>
  );
}

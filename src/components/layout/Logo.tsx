export default function Logo({
  text = "Brian",
  className = "text-lg",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <a href={import.meta.env.BASE_URL} className={`font-display font-semibold tracking-tight ${className}`}>
      {text}
      <span className="text-accent">.</span>
    </a>
  );
}

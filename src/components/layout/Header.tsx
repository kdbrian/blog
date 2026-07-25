import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/layout/Logo";

const LINKS = [
  { to: "/", label: "Blog", end: true },
  { to: "/activity", label: "Activity", end: false },
  { to: "/playground", label: "Playground", end: false },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-4 sm:px-6">
        <Logo text="Blog" />

        <nav className="hidden items-center gap-1 rounded-full border border-line bg-white/60 px-1.5 py-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <a
          href="https://kdbrian.github.io"
          className="hidden text-sm font-medium text-ink/60 hover:text-ink md:block"
        >
          Portfolio ↗
        </a>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex items-center justify-center rounded-lg p-1.5 text-ink/70 hover:bg-ink/5 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-ink/5 text-ink" : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href="https://kdbrian.github.io"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5 hover:text-ink"
            >
              Portfolio ↗
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

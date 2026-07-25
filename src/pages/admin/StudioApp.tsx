import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import Login from "@/pages/admin/Login";
import PostEditor from "@/components/admin/PostEditor";
import ProjectManager from "@/components/admin/ProjectManager";
import MilestonesManager from "@/components/admin/MilestonesManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import ProfileManager from "@/components/admin/ProfileManager";
import HistoryManager from "@/components/admin/HistoryManager";
import Logo from "@/components/layout/Logo";
import { clearSession, getValidToken, touchSession, IDLE_TIMEOUT_MS } from "@/lib/auth";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "click"] as const;
const TABS = ["posts", "projects", "milestones", "links", "profile", "education", "experience"] as const;

export default function StudioApp() {
  const [authed, setAuthed] = useState(() => !!getValidToken());
  const [tab, setTab] = useState<(typeof TABS)[number]>("posts");

  // Idle timeout: reset the clock on real user activity, and poll for expiry.
  useEffect(() => {
    if (!authed) return;

    const onActivity = () => touchSession();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity));

    const interval = setInterval(() => {
      if (!getValidToken()) {
        setAuthed(false);
      }
    }, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearInterval(interval);
    };
  }, [authed]);

  function handleLogout() {
    clearSession();
    setAuthed(false);
  }

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <Logo text="Studio" />
            <nav className="flex gap-1 rounded-full border border-line bg-paper p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3.5 py-1 text-sm capitalize transition ${
                    tab === t ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-xs text-ink/40 lg:block">
              Auto-signed-out after {Math.round(IDLE_TIMEOUT_MS / 60000)}m idle
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "posts" && <PostEditor />}
        {tab === "projects" && <ProjectManager />}
        {tab === "milestones" && <MilestonesManager />}
        {tab === "links" && <SocialLinksManager />}
        {tab === "profile" && <ProfileManager />}
        {tab === "education" && <HistoryManager kind="education" label="Education" orgLabel="School" />}
        {tab === "experience" && <HistoryManager kind="experience" label="Experience" orgLabel="Company" />}
      </main>
    </div>
  );
}

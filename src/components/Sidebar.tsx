import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  BarChart3,
  Bot,
  ClipboardList,
  FileInput,
  GraduationCap,
  LayoutDashboard,
  Library,
  Mic,
  Route,
  Settings as SettingsIcon,
  ShoppingBag,
  Trophy,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const groups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
      { to: "/study", label: "Lernen", icon: <GraduationCap size={18} /> },
    ],
  },
  {
    label: "KI",
    items: [
      { to: "/tutor", label: "KI-Tutor", icon: <Bot size={18} /> },
      { to: "/material", label: "Material → Karten", icon: <FileInput size={18} /> },
      { to: "/paths", label: "Lernpfade", icon: <Route size={18} /> },
      { to: "/oral", label: "Mündl. Prüfung", icon: <Mic size={18} /> },
    ],
  },
  {
    label: "Inhalte",
    items: [
      { to: "/decks", label: "Decks", icon: <Library size={18} /> },
      { to: "/exams", label: "Tests", icon: <ClipboardList size={18} /> },
    ],
  },
  {
    label: "Fortschritt",
    items: [
      { to: "/stats", label: "Statistiken", icon: <BarChart3 size={18} /> },
      { to: "/achievements", label: "Achievements", icon: <Trophy size={18} /> },
      { to: "/shop", label: "Shop", icon: <ShoppingBag size={18} /> },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
    isActive
      ? "bg-primary/15 text-text font-medium"
      : "text-muted hover:text-text hover:bg-surface-2/60"
  );

export function Sidebar() {
  return (
    <aside className="glass flex h-full w-60 shrink-0 flex-col rounded-none border-r border-border/50">
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, rgb(110 100 255), rgb(20 200 160))" }}
        >
          OL
        </div>
        <div>
          <div className="font-semibold leading-tight">OpenLearn</div>
          <div className="text-[11px] leading-tight text-muted">Learning by doing</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && (
              <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                {g.label}
              </div>
            )}
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} className={linkClass}>
                  {it.icon}
                  <span>{it.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <NavLink to="/settings" className={linkClass}>
          <SettingsIcon size={18} />
          <span>Einstellungen</span>
        </NavLink>
      </div>
    </aside>
  );
}

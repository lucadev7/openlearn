import type { ReactNode } from "react";
import { CalendarClock, Coins, Flame } from "lucide-react";

import { useStore } from "@/store/useStore";
import { ProgressRing } from "./ui";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Späte Stunde — bleib dran 🌙";
  if (h < 11) return "Guten Morgen ☀️";
  if (h < 17) return "Auf geht's 💪";
  if (h < 22) return "Guten Abend 🌆";
  return "Noch eine Runde? 🌙";
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted">{icon}</span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tabular-nums">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

export function TopBar() {
  const profile = useStore((s) => s.profile);
  const progress =
    profile && profile.xpForNextLevel > 0
      ? profile.xpIntoLevel / profile.xpForNextLevel
      : 1;

  return (
    <header className="glass flex h-16 shrink-0 items-center justify-between gap-4 rounded-none border-b border-border/50 px-6">
      <div className="text-sm text-muted">{greeting()}</div>
      <div className="flex items-center gap-5">
        {profile ? (
          <>
            <Metric icon={<CalendarClock size={16} />} label="fällig" value={profile.dueToday} />
            <Metric
              icon={<Flame size={16} className="text-warn" />}
              label="Streak"
              value={profile.streakCurrent}
            />
            <Metric
              icon={<Coins size={16} className="text-warn" />}
              label="Coins"
              value={profile.coins}
            />
            <div className="flex items-center gap-2.5">
              <ProgressRing value={progress} size={42}>
                {profile.level}
              </ProgressRing>
              <div className="leading-tight">
                <div className="text-sm font-semibold">{profile.levelTitle}</div>
                <div className="text-[11px] text-muted tabular-nums">
                  {profile.xpIntoLevel}/{profile.xpForNextLevel} XP
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-2/60" />
        )}
      </div>
    </header>
  );
}

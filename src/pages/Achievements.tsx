import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarHeart,
  Check,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Layers,
  Library,
  Lock,
  Rocket,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { Achievement } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { GlassCard, Skeleton } from "@/components/ui";

const ICONS: Record<string, LucideIcon> = {
  Footprints,
  Dumbbell,
  Flame,
  Rocket,
  CalendarClock,
  CalendarCheck,
  CalendarHeart,
  Target,
  TrendingUp,
  Crown,
  Library,
  Layers,
  Brain,
  Zap,
  CalendarDays,
};

const TIER_COLOR: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#f5c542",
};

export default function Achievements() {
  const toast = useStore((s) => s.toast);
  const [items, setItems] = useState<Achievement[] | null>(null);

  useEffect(() => {
    api
      .listAchievements()
      .then(setItems)
      .catch((e) => toast(errMsg(e), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.progress / b.target - a.progress / a.target;
    });
  }, [items]);

  if (!items) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const unlocked = items.filter((a) => a.unlocked).length;
  const total = items.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <span className="chip border-primary/40 text-primary">
          <Trophy size={13} /> {unlocked} / {total} freigeschaltet
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${total > 0 ? (unlocked / total) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((a, i) => {
          const Icon = ICONS[a.icon] ?? Trophy;
          const color = TIER_COLOR[a.tier] ?? "#c0c0c0";
          const ratio = a.target > 0 ? Math.min(1, a.progress / a.target) : 0;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <GlassCard className={`h-full ${a.unlocked ? "" : "opacity-80"}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: a.unlocked ? `${color}22` : "rgb(var(--ol-surface-2) / 0.8)",
                      color: a.unlocked ? color : "rgb(var(--ol-muted))",
                    }}
                  >
                    <Icon size={22} />
                    {!a.unlocked && (
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-muted">
                        <Lock size={11} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-tight">{a.title}</h3>
                      {a.unlocked && <Check size={15} className="shrink-0 text-success" />}
                    </div>
                    <p className="mt-1 text-sm text-muted">{a.description}</p>
                  </div>
                </div>

                {!a.unlocked && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2/70">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio * 100}%`, background: color }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs tabular-nums text-muted">
                      {a.progress} / {a.target}
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

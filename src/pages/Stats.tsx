import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, Brain, CalendarDays, Target, TrendingUp, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, errMsg } from "@/lib/api";
import type { DayStat, Stats } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { EmptyState, GlassCard, Skeleton } from "@/components/ui";

const PRIMARY = "rgb(var(--ol-primary))";

const pct = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

export default function StatsPage() {
  const toast = useStore((s) => s.toast);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((e) => toast(errMsg(e), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Statistiken</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const accuracy = pct(stats.totalCorrect, stats.totalReviews);
  const recent = stats.daily.slice(-30).map((d) => ({
    day: d.day.slice(5),
    reviews: d.reviews,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistiken</h1>

      {stats.totalReviews === 0 ? (
        <EmptyState
          icon={<Activity size={40} />}
          title="Noch keine Lern-Daten"
          desc="Sobald du Karten wiederholst, erscheinen hier dein Verlauf, deine Trefferquote und eine Heatmap deiner Aktivität."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Tile icon={<Activity size={18} />} label="Wiederholungen" value={stats.totalReviews} />
            <Tile icon={<Target size={18} />} label="Trefferquote" value={`${accuracy}%`} />
            <Tile icon={<CalendarDays size={18} />} label="Aktive Tage" value={stats.activeDays} />
            <Tile icon={<Brain size={18} />} label="Gereifte Karten" value={stats.matureCards} />
            <Tile icon={<TrendingUp size={18} />} label="XP gesamt" value={stats.xpTotal} />
          </div>

          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Wiederholungen (letzte 30 Tage)</h2>
              <span className="chip">
                <Zap size={12} /> {stats.reviewsToday} heute
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recent} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(var(--ol-border) / 0.4)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "rgb(var(--ol-muted))" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "rgb(var(--ol-muted))" }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(var(--ol-surface))",
                      border: "1px solid rgb(var(--ol-border))",
                      borderRadius: 12,
                      color: "rgb(var(--ol-text))",
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "rgb(var(--ol-muted))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reviews"
                    name="Wiederholungen"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard>
              <h2 className="mb-4 font-semibold">Aktivität</h2>
              <Heatmap days={stats.daily} />
            </GlassCard>

            <GlassCard>
              <h2 className="mb-4 font-semibold">Karten-Reife</h2>
              <Maturity stats={stats} />
              <h3 className="mb-2 mt-6 font-semibold">Bewertungen</h3>
              <Ratings stats={stats} />
            </GlassCard>
          </div>

          {stats.byDeck.length > 0 && (
            <GlassCard>
              <h2 className="mb-4 font-semibold">Trefferquote je Deck</h2>
              <ul className="space-y-3">
                {stats.byDeck.map((d) => {
                  const acc = pct(d.correct, d.reviews);
                  return (
                    <li key={d.deckId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate pr-3 font-medium">{d.name}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {acc}% · {d.reviews}×
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${acc}%`,
                            background:
                              acc >= 80
                                ? "rgb(var(--ol-success))"
                                : acc >= 50
                                  ? "rgb(var(--ol-primary))"
                                  : "rgb(var(--ol-warn))",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <GlassCard className="p-4">
      <div className="mb-1 flex items-center gap-1.5 text-primary">{icon}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </GlassCard>
  );
}

function Heatmap({ days }: { days: DayStat[] }) {
  const { weeks, max } = useMemo(() => {
    const weeks: (DayStat | null)[][] = [];
    let col: (DayStat | null)[] = new Array(7).fill(null);
    let max = 0;
    for (const d of days) {
      max = Math.max(max, d.reviews);
      const wd = new Date(`${d.day}T00:00:00`).getDay();
      if (wd === 0 && col.some(Boolean)) {
        weeks.push(col);
        col = new Array(7).fill(null);
      }
      col[wd] = d;
    }
    if (col.some(Boolean)) weeks.push(col);
    return { weeks, max };
  }, [days]);

  const tone = (reviews: number) => {
    if (reviews <= 0) return "rgb(var(--ol-surface-2) / 0.7)";
    const ratio = max > 0 ? reviews / max : 0;
    const op = 0.25 + Math.min(1, ratio) * 0.75;
    return `rgb(var(--ol-primary) / ${op.toFixed(2)})`;
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1">
        {weeks.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((d, ri) => (
              <div
                key={ri}
                className="h-3 w-3 rounded-sm"
                style={{ background: d ? tone(d.reviews) : "transparent" }}
                title={d ? `${d.day}: ${d.reviews} Wdh.` : ""}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span>weniger</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <span
            key={r}
            className="h-3 w-3 rounded-sm"
            style={{
              background:
                r === 0 ? "rgb(var(--ol-surface-2) / 0.7)" : `rgb(var(--ol-primary) / ${0.25 + r * 0.75})`,
            }}
          />
        ))}
        <span>mehr</span>
      </div>
    </div>
  );
}

function Maturity({ stats }: { stats: Stats }) {
  const rows = [
    { label: "Neu", value: stats.newCards, color: "rgb(var(--ol-accent))" },
    { label: "Jung", value: stats.youngCards, color: "rgb(var(--ol-primary))" },
    { label: "Gereift", value: stats.matureCards, color: "rgb(var(--ol-success))" },
    { label: "Ausgesetzt", value: stats.suspendedCards, color: "rgb(var(--ol-muted))" },
  ];
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2/70">
        {rows.map((r) => (
          <div key={r.label} style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
            <span className="text-muted">{r.label}</span>
            <span className="ml-auto tabular-nums font-medium">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ratings({ stats }: { stats: Stats }) {
  const rows = [
    { label: "Nochmal", value: stats.ratings.again, color: "rgb(var(--ol-danger))" },
    { label: "Schwer", value: stats.ratings.hard, color: "rgb(var(--ol-warn))" },
    { label: "Gut", value: stats.ratings.good, color: "rgb(var(--ol-success))" },
    { label: "Leicht", value: stats.ratings.easy, color: "rgb(var(--ol-primary))" },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-sm text-muted">{r.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2/70">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

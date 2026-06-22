import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bot, GraduationCap, Library, Plus, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import type { AiStatus, DeckWithCounts } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Button, GlassCard, ProgressRing, Skeleton } from "@/components/ui";

export default function Dashboard() {
  const profile = useStore((s) => s.profile);
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckWithCounts[]>([]);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDecks()
      .then(setDecks)
      .catch(() => {})
      .finally(() => setLoading(false));
    api.aiStatus().then(setAi).catch(() => {});
  }, []);

  const goalPct =
    profile && profile.dailyGoal > 0 ? profile.reviewsToday / profile.dailyGoal : 0;
  const totalActionable = decks.reduce((acc, d) => acc + d.due + d.newCount, 0);
  const topDecks = [...decks]
    .sort((a, b) => b.due + b.newCount - (a.due + a.newCount))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden p-7"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-2xl"
          style={{ background: "radial-gradient(circle, rgb(var(--ol-primary)), transparent 70%)" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">
              {totalActionable > 0 ? "Bereit zu lernen?" : "Alles im grünen Bereich ✨"}
            </h1>
            <p className="mt-1.5 max-w-md text-muted">
              {totalActionable > 0
                ? `${totalActionable} ${totalActionable === 1 ? "Karte wartet" : "Karten warten"} auf dich. Kleine Sessions, großer Effekt.`
                : "Keine fälligen Karten. Lerne neue Inhalte oder lege eigene an."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/study")}>
                <GraduationCap size={18} /> Lernen starten
              </Button>
              <Button variant="subtle" onClick={() => navigate("/decks")}>
                <Library size={18} /> Decks verwalten
              </Button>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-4">
              <ProgressRing value={goalPct} size={96} stroke={8}>
                <div className="text-center">
                  <div className="text-base font-bold tabular-nums">
                    {profile.reviewsToday}
                    <span className="text-muted">/{profile.dailyGoal}</span>
                  </div>
                  <div className="text-[10px] text-muted">Tagesziel</div>
                </div>
              </ProgressRing>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Fällig heute" value={profile?.dueToday ?? 0} />
        <StatTile label="Streak (Tage)" value={profile?.streakCurrent ?? 0} />
        <StatTile label="Level" value={profile?.level ?? 1} sub={profile?.levelTitle} />
        <StatTile label="XP gesamt" value={profile?.xp ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Decks quick list */}
        <GlassCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Deine Decks</h2>
            <Link to="/decks" className="text-sm text-primary hover:underline">
              Alle ansehen
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : topDecks.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-muted">Noch keine Decks vorhanden.</p>
              <Button className="mt-4" variant="subtle" onClick={() => navigate("/decks")}>
                <Plus size={16} /> Erstes Deck anlegen
              </Button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {topDecks.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/decks/${d.id}`}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-surface-2/60"
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="flex items-center gap-2 text-sm">
                      {d.due > 0 && (
                        <span className="chip border-primary/40 text-primary">{d.due} fällig</span>
                      )}
                      {d.newCount > 0 && (
                        <span className="chip border-accent/40 text-accent">{d.newCount} neu</span>
                      )}
                      <span className="text-muted">{d.total}</span>
                      <ArrowRight
                        size={16}
                        className="text-muted opacity-0 transition group-hover:opacity-100"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* AI nudge */}
        <GlassCard>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <h2 className="font-semibold text-text">KI-Funktionen</h2>
          </div>
          {ai?.anyConfigured ? (
            <>
              <p className="text-sm text-muted">
                KI ist eingerichtet. Lass dir Konzepte vom Tutor erklären oder generiere neue
                Karten aus eigenem Material.
              </p>
              <Button className="mt-4 w-full" variant="subtle" onClick={() => navigate("/tutor")}>
                <Bot size={16} /> Zum KI-Tutor
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Trage einen eigenen API-Key ein (z. B. Gemini Free Tier oder lokal via Ollama), um
                Tutor, Bewertung, Material-Import und Lernpfade freizuschalten. Der Lern-Kern
                funktioniert auch ohne.
              </p>
              <Button
                className="mt-4 w-full"
                variant="subtle"
                onClick={() => navigate("/settings")}
              >
                <Sparkles size={16} /> KI einrichten
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-sm text-muted">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-primary">{sub}</div>}
    </GlassCard>
  );
}

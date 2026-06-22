import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, RotateCcw, X } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { Card, DeckWithCounts } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Button, GlassCard, ProgressRing, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

type Phase = "setup" | "loading" | "running" | "done";

const norm = (s: string) => (s || "").trim().toLowerCase();
const SECONDS_PER_CARD = 30;

export default function Exams() {
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [decks, setDecks] = useState<DeckWithCounts[]>([]);
  const [deckId, setDeckId] = useState("");
  const [count, setCount] = useState(10);
  const [timed, setTimed] = useState(true);

  const [phase, setPhase] = useState<Phase>("setup");
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<{ card: Card; correct: boolean }[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [single, setSingle] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [tf, setTf] = useState<boolean | null>(null);
  const [numInput, setNumInput] = useState("");
  const [cloze, setCloze] = useState<string[]>([]);

  useEffect(() => {
    api.listDecks().then(setDecks).catch(() => {});
  }, []);

  const current = cards[idx];

  const resetInputs = (c?: Card) => {
    setSingle(null);
    setMulti([]);
    setTf(null);
    setNumInput("");
    const n = c && c.type === "cloze" ? ((c.payload as { answers?: string[] }).answers?.length ?? 1) : 0;
    setCloze(Array(n).fill(""));
  };

  const start = async () => {
    setPhase("loading");
    try {
      const cs = await api.examCards(deckId || null, count);
      if (!cs.length) {
        toast("Keine automatisch bewertbaren Karten gefunden.", "info");
        setPhase("setup");
        return;
      }
      setCards(cs);
      setIdx(0);
      setResults([]);
      resetInputs(cs[0]);
      setSecondsLeft(timed ? cs.length * SECONDS_PER_CARD : 0);
      setPhase("running");
    } catch (e) {
      toast(errMsg(e), "error");
      setPhase("setup");
    }
  };

  useEffect(() => {
    if (phase !== "running" || !timed) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, timed]);

  const grade = (c: Card): boolean => {
    const p = c.payload as Record<string, unknown>;
    switch (c.type) {
      case "single":
        return single !== null && single === (p.correct as number);
      case "multi": {
        const s = [...multi].sort();
        const cor = [...((p.correct as number[]) ?? [])].sort();
        return s.length === cor.length && s.every((v, i) => v === cor[i]);
      }
      case "truefalse":
        return tf !== null && tf === (p.answer as boolean);
      case "numeric": {
        const v = Number(numInput.replace(",", "."));
        return !Number.isNaN(v) && Math.abs(v - (p.value as number)) <= ((p.tolerance as number) ?? 0);
      }
      case "cloze": {
        const a = (p.answers as string[]) ?? [];
        return a.length === cloze.length && a.every((x, i) => norm(cloze[i]) === norm(x));
      }
      default:
        return false;
    }
  };

  const canSubmit = (() => {
    if (!current) return false;
    switch (current.type) {
      case "single":
        return single !== null;
      case "multi":
        return multi.length > 0;
      case "truefalse":
        return tf !== null;
      case "numeric":
        return numInput.trim() !== "";
      case "cloze":
        return cloze.some((x) => x.trim() !== "");
      default:
        return false;
    }
  })();

  const submit = () => {
    if (!current) return;
    const next = [...results, { card: current, correct: grade(current) }];
    setResults(next);
    if (idx + 1 >= cards.length) {
      setPhase("done");
    } else {
      resetInputs(cards[idx + 1]);
      setIdx(idx + 1);
    }
  };

  // ── Setup ────────────────────────────────────────────────────────────
  if (phase === "setup" || phase === "loading") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tests & Prüfungen</h1>
          <p className="mt-1 text-muted">
            Zeitgesteuerte Test-Simulation aus deinem Fragenpool — ohne Einfluss auf deine
            Wiederholungsplanung.
          </p>
        </div>
        <GlassCard className="space-y-5">
          <div>
            <label className="label">Thema</label>
            <select className="input" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
              <option value="">Alle Decks</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Anzahl Fragen: {count}</label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[rgb(var(--ol-primary))]"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <div className="font-medium">Zeitlimit</div>
              <div className="text-sm text-muted">{SECONDS_PER_CARD}s pro Frage</div>
            </div>
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-5 w-5 accent-[rgb(var(--ol-primary))]"
            />
          </label>
          <Button className="w-full" size="lg" onClick={start} disabled={phase === "loading"}>
            {phase === "loading" ? <Spinner className="h-5 w-5" /> : <>Test starten</>}
          </Button>
          <p className="text-xs text-muted/80">
            Es werden nur automatisch bewertbare Fragetypen einbezogen (Single/Multiple Choice,
            Wahr/Falsch, Lückentext, numerisch).
          </p>
        </GlassCard>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────
  if (phase === "done") {
    const correctCount = results.filter((r) => r.correct).length;
    const total = cards.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const wrong = results.filter((r) => !r.correct);
    const unanswered = total - results.length;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard className="flex flex-col items-center gap-4 py-8 text-center">
            <ProgressRing value={pct / 100} size={120} stroke={10}>
              <span className="text-xl font-bold">{pct}%</span>
            </ProgressRing>
            <div>
              <h1 className="text-2xl font-bold">
                {correctCount} / {total} richtig
              </h1>
              <p className="mt-1 text-muted">
                {pct >= 80
                  ? "Stark! Das sitzt."
                  : pct >= 50
                    ? "Solide — da geht noch was."
                    : "Dranbleiben — Wiederholung hilft."}
                {unanswered > 0 && ` (${unanswered} nicht beantwortet)`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setPhase("setup")}>
                <RotateCcw size={16} /> Neuer Test
              </Button>
              <Button variant="subtle" onClick={() => navigate("/")}>
                Zum Dashboard
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {wrong.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">Falsch beantwortet</h2>
            {wrong.map((r, i) => (
              <GlassCard key={i} className="p-4">
                <p className="text-sm font-medium">
                  {r.card.promptMd.replace(/\{\{(.*?)\}\}/g, "[$1]")}
                </p>
                <p className="mt-1.5 text-sm text-success">Richtig: {correctText(r.card)}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Running ──────────────────────────────────────────────────────────
  if (!current) return null;
  const p = current.payload as Record<string, unknown>;
  const mm = Math.floor(secondsLeft / 60);
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase("setup")} className="text-muted hover:text-text">
          <X size={20} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2/70">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(idx / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {idx + 1}/{cards.length}
        </span>
        {timed && (
          <span
            className={`flex items-center gap-1 text-sm tabular-nums ${
              secondsLeft <= 15 ? "text-danger" : "text-muted"
            }`}
          >
            <Clock size={14} /> {mm}:{ss}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          <GlassCard className="min-h-[200px]">
            {current.type === "cloze" ? (
              <p className="text-lg leading-relaxed">
                {current.promptMd.replace(/\{\{.*?\}\}/g, "  ____  ")}
              </p>
            ) : (
              <Markdown className="text-lg">{current.promptMd}</Markdown>
            )}

            <div className="mt-5">
              {(current.type === "single" || current.type === "multi") && (
                <div className="space-y-2">
                  {((p.options as string[]) ?? []).map((opt, i) => {
                    const selected = current.type === "multi" ? multi.includes(i) : single === i;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          current.type === "multi"
                            ? setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))
                            : setSingle(i)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-primary/60 bg-primary/10"
                            : "border-border/60 hover:border-primary/40"
                        }`}
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/60 text-xs text-muted">
                          {i + 1}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === "truefalse" && (
                <div className="flex gap-3">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setTf(v)}
                      className={`flex-1 rounded-xl border px-4 py-3 transition ${
                        tf === v
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      {v ? "Wahr" : "Falsch"}
                    </button>
                  ))}
                </div>
              )}

              {current.type === "numeric" && (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    className="input max-w-[200px]"
                    value={numInput}
                    onChange={(e) => setNumInput(e.target.value)}
                    placeholder="Antwort"
                  />
                  {(p.unit as string) && <span className="text-muted">{p.unit as string}</span>}
                </div>
              )}

              {current.type === "cloze" && (
                <div className="space-y-2">
                  {cloze.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-muted">Lücke {i + 1}</span>
                      <input
                        className="input max-w-xs"
                        value={val}
                        onChange={(e) =>
                          setCloze((c) => c.map((x, j) => (j === i ? e.target.value : x)))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <Button className="w-full" size="lg" disabled={!canSubmit} onClick={submit}>
        {idx + 1 >= cards.length ? "Abschließen" : "Weiter"}
      </Button>
    </div>
  );
}

function correctText(card: Card): string {
  const p = card.payload as Record<string, unknown>;
  switch (card.type) {
    case "single": {
      const opts = (p.options as string[]) ?? [];
      return opts[p.correct as number] ?? "";
    }
    case "multi": {
      const opts = (p.options as string[]) ?? [];
      return ((p.correct as number[]) ?? []).map((i) => opts[i]).join(", ");
    }
    case "truefalse":
      return (p.answer as boolean) ? "Wahr" : "Falsch";
    case "numeric":
      return `${p.value as number}${p.unit ? ` ${p.unit as string}` : ""}`;
    case "cloze":
      return ((p.answers as string[]) ?? []).join(", ");
    default:
      return "";
  }
}

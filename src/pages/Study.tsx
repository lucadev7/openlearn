import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PartyPopper, Sparkles, X } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { GradeResult, Rating, StudyCard } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Button, EmptyState, GlassCard, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

type Phase = "loading" | "answering" | "revealed" | "done" | "empty";

const RATINGS: { key: Rating; label: string; hint: string; cls: string }[] = [
  { key: "again", label: "Nochmal", hint: "1", cls: "border-danger/50 hover:bg-danger/10 text-danger" },
  { key: "hard", label: "Schwer", hint: "2", cls: "border-warn/50 hover:bg-warn/10 text-warn" },
  { key: "good", label: "Gut", hint: "3", cls: "border-success/50 hover:bg-success/10 text-success" },
  { key: "easy", label: "Leicht", hint: "4", cls: "border-primary/50 hover:bg-primary/10 text-primary" },
];

const norm = (s: string) => (s || "").trim().toLowerCase();

export default function Study() {
  const [params] = useSearchParams();
  const deck = params.get("deck");
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);
  const setProfile = useStore((s) => s.setProfile);

  const [queue, setQueue] = useState<StudyCard[]>([]);
  const [pos, setPos] = useState(0);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");

  const [single, setSingle] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [tf, setTf] = useState<boolean | null>(null);
  const [numInput, setNumInput] = useState("");
  const [cloze, setCloze] = useState<string[]>([]);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [shortAns, setShortAns] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  const current = queue[pos];

  const resetInputs = (c: StudyCard | undefined) => {
    setSingle(null);
    setMulti([]);
    setTf(null);
    setNumInput("");
    setCorrect(null);
    setShortAns("");
    setGradeResult(null);
    setGrading(false);
    if (c && c.card.type === "cloze") {
      const n = ((c.card.payload as { answers?: string[] }).answers?.length) ?? 1;
      setCloze(Array(n).fill(""));
    } else {
      setCloze([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const q = await api.getQueue(deck, null);
        setQueue(q);
        setTotal(q.length);
        resetInputs(q[0]);
        setPhase(q.length ? "answering" : "empty");
      } catch (e) {
        toast(errMsg(e), "error");
        setPhase("empty");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  const grade = (): boolean | null => {
    if (!current) return null;
    const p = current.card.payload as Record<string, unknown>;
    switch (current.card.type) {
      case "single":
        return single !== null && single === (p.correct as number);
      case "multi": {
        const sel = [...multi].sort();
        const cor = [...((p.correct as number[]) ?? [])].sort();
        return sel.length === cor.length && sel.every((v, i) => v === cor[i]);
      }
      case "truefalse":
        return tf !== null && tf === (p.answer as boolean);
      case "numeric": {
        const v = Number(numInput.replace(",", "."));
        if (Number.isNaN(v)) return false;
        return Math.abs(v - (p.value as number)) <= ((p.tolerance as number) ?? 0);
      }
      case "cloze": {
        const ans = (p.answers as string[]) ?? [];
        return ans.length === cloze.length && ans.every((a, i) => norm(cloze[i]) === norm(a));
      }
      default:
        return null;
    }
  };

  const canCheck = (() => {
    if (!current) return false;
    switch (current.card.type) {
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
      case "short_text":
        return shortAns.trim() !== "";
      default:
        return true;
    }
  })();

  const reveal = async () => {
    if (phase !== "answering" || !current) return;
    if (current.card.type === "short_text") {
      const p = current.card.payload as Record<string, unknown>;
      setGrading(true);
      try {
        const g = await api.aiGradeAnswer(
          current.card.promptMd,
          (p.expected as string) || current.card.explanationMd || null,
          shortAns
        );
        setGradeResult(g);
        setCorrect(g.correct);
        setPhase("revealed");
      } catch (e) {
        toast(errMsg(e), "error");
      } finally {
        setGrading(false);
      }
      return;
    }
    setCorrect(grade());
    setPhase("revealed");
  };

  const rate = async (r: Rating) => {
    if (phase !== "revealed" || !current) return;
    try {
      const out = await api.submitReview(current.card.id, r);
      setProfile(out.profile);
      if (out.leveledUp) toast(`🎉 Level ${out.profile.level} — ${out.profile.levelTitle}!`, "success");
      if (pos + 1 >= queue.length) {
        setPhase("done");
      } else {
        resetInputs(queue[pos + 1]);
        setPos(pos + 1);
        setPhase("answering");
      }
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "answering" && current) {
        const t = current.card.type;
        if (t === "single" || t === "multi") {
          const opts = (current.card.payload as { options?: string[] }).options ?? [];
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= opts.length) {
            e.preventDefault();
            if (t === "multi") {
              setMulti((m) => (m.includes(n - 1) ? m.filter((x) => x !== n - 1) : [...m, n - 1]));
            } else {
              setSingle(n - 1);
            }
          }
        }
        if (t === "truefalse") {
          if (e.key.toLowerCase() === "w") setTf(true);
          if (e.key.toLowerCase() === "f") setTf(false);
        }
        if ((e.key === " " || e.key === "Enter") && canCheck) {
          e.preventDefault();
          reveal();
        }
      } else if (phase === "revealed") {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0) {
          e.preventDefault();
          rate(RATINGS[idx].key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pos, queue, single, multi, tf, numInput, cloze, canCheck]);

  if (phase === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <EmptyState
        icon={<Sparkles size={40} />}
        title="Nichts zu lernen — stark!"
        desc="Aktuell sind keine Karten fällig. Lege neue Karten an oder schau später wieder vorbei."
        action={<Button onClick={() => navigate("/decks")}>Zu den Decks</Button>}
      />
    );
  }

  if (phase === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <EmptyState
          icon={<PartyPopper size={44} />}
          title="Session geschafft! 🎉"
          desc={`Du hast ${total} ${total === 1 ? "Karte" : "Karten"} wiederholt. Konsequenz schlägt Intensität — bis morgen!`}
          action={
            <div className="flex gap-3">
              <Button onClick={() => navigate("/")}>Zum Dashboard</Button>
              <Button variant="subtle" onClick={() => window.location.reload()}>
                Weiter lernen
              </Button>
            </div>
          }
        />
      </motion.div>
    );
  }

  if (!current) return null;
  const p = current.card.payload as Record<string, unknown>;
  const revealed = phase === "revealed";
  const progress = total > 0 ? pos / total : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted hover:text-text">
          <X size={20} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2/70">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {pos + 1}/{total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pos}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
        >
          <GlassCard className="min-h-[220px]">
            {current.isNew && (
              <span className="chip mb-3 border-accent/40 text-accent">neu</span>
            )}

            {/* Prompt */}
            {current.card.type === "cloze" ? (
              <p className="text-lg leading-relaxed">
                {current.card.promptMd.replace(/\{\{.*?\}\}/g, "  ____  ")}
              </p>
            ) : (
              <Markdown className="text-lg">{current.card.promptMd}</Markdown>
            )}

            {/* Answer area */}
            <div className="mt-5">
              {(current.card.type === "single" || current.card.type === "multi") && (
                <div className="space-y-2">
                  {((p.options as string[]) ?? []).map((opt, i) => {
                    const selected =
                      current.card.type === "multi" ? multi.includes(i) : single === i;
                    const isCorrectOpt =
                      current.card.type === "multi"
                        ? ((p.correct as number[]) ?? []).includes(i)
                        : (p.correct as number) === i;
                    const tone = revealed
                      ? isCorrectOpt
                        ? "border-success/60 bg-success/10"
                        : selected
                          ? "border-danger/60 bg-danger/10"
                          : "border-border/50"
                      : selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 hover:border-primary/40";
                    return (
                      <button
                        key={i}
                        disabled={revealed}
                        onClick={() =>
                          current.card.type === "multi"
                            ? setMulti((m) =>
                                m.includes(i) ? m.filter((x) => x !== i) : [...m, i]
                              )
                            : setSingle(i)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${tone}`}
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/60 text-xs text-muted">
                          {i + 1}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && isCorrectOpt && <Check size={18} className="text-success" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.card.type === "truefalse" && (
                <div className="flex gap-3">
                  {[true, false].map((v) => {
                    const selected = tf === v;
                    const isCorrectOpt = (p.answer as boolean) === v;
                    const tone = revealed
                      ? isCorrectOpt
                        ? "border-success/60 bg-success/10"
                        : selected
                          ? "border-danger/60 bg-danger/10"
                          : "border-border/50"
                      : selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 hover:border-primary/40";
                    return (
                      <button
                        key={String(v)}
                        disabled={revealed}
                        onClick={() => setTf(v)}
                        className={`flex-1 rounded-xl border px-4 py-3 transition ${tone}`}
                      >
                        {v ? "Wahr" : "Falsch"}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.card.type === "numeric" && (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    disabled={revealed}
                    className="input max-w-[200px]"
                    value={numInput}
                    onChange={(e) => setNumInput(e.target.value)}
                    placeholder="Antwort"
                  />
                  {(p.unit as string) && <span className="text-muted">{p.unit as string}</span>}
                </div>
              )}

              {current.card.type === "cloze" && (
                <div className="space-y-2">
                  {cloze.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-muted">Lücke {i + 1}</span>
                      <input
                        disabled={revealed}
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

              {current.card.type === "short_text" && (
                <div>
                  <textarea
                    autoFocus
                    disabled={revealed}
                    className="input min-h-[120px] resize-y"
                    value={shortAns}
                    onChange={(e) => setShortAns(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Deine Antwort in eigenen Worten…"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Wird beim Aufdecken von der KI bewertet.
                  </p>
                </div>
              )}

              {grade() === null &&
                !["single", "multi", "truefalse", "numeric", "cloze", "short_text"].includes(
                  current.card.type
                ) && (
                  <p className="text-sm text-muted">
                    Selbstkontrolle: Überlege deine Antwort und decke dann auf.
                  </p>
                )}
            </div>

            {/* Reveal feedback */}
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 border-t border-border/40 pt-4"
              >
                {correct !== null && (
                  <div
                    className={`mb-3 flex items-center gap-2 font-medium ${
                      correct ? "text-success" : "text-danger"
                    }`}
                  >
                    {correct ? <Check size={18} /> : <X size={18} />}
                    {correct ? "Richtig!" : "Noch nicht ganz."}
                  </div>
                )}
                {current.card.type === "short_text" && gradeResult && (
                  <div className="mb-3 rounded-xl border border-border/50 bg-surface-2/40 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">KI-Bewertung</span>
                      <span className="chip">{gradeResult.score}/100</span>
                    </div>
                    <Markdown>{gradeResult.feedback}</Markdown>
                  </div>
                )}
                {current.card.type === "cloze" && (
                  <div className="mb-3 text-sm">
                    <span className="text-muted">Lösung: </span>
                    <span className="font-medium">
                      {((p.answers as string[]) ?? []).join(", ")}
                    </span>
                  </div>
                )}
                {current.card.explanationMd && (
                  <div className="rounded-xl border border-border/50 bg-surface-2/40 p-3">
                    <Markdown>{current.card.explanationMd}</Markdown>
                  </div>
                )}
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Action bar */}
      {!revealed ? (
        <Button className="w-full" size="lg" disabled={!canCheck || grading} onClick={reveal}>
          {grading ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <>
              Aufdecken
              {current.card.type !== "short_text" && (
                <span className="ml-1 text-xs opacity-70">(Leertaste)</span>
              )}
            </>
          )}
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.key}
              onClick={() => rate(r.key)}
              className={`flex flex-col items-center gap-0.5 rounded-xl border bg-surface-2/40 py-3 font-medium transition ${r.cls}`}
            >
              <span>{r.label}</span>
              <span className="text-[11px] opacity-60">{r.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

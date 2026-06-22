import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, Route, Sparkles, Wand2 } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Button, EmptyState, GlassCard, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

const SYSTEM =
  "Du bist ein erfahrener Lerncoach. Erstelle einen konkreten, realistischen und motivierenden " +
  "Lernplan in klarem Markdown (Überschriften, Wochen-/Tagesabschnitte, kurze Stichpunkte, " +
  "Meilensteine). Berücksichtige Spaced Repetition und plane Wiederholungen ein. Antworte auf Deutsch.";

export default function Paths() {
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState("");
  const [focus, setFocus] = useState("");
  const [hours, setHours] = useState("5");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    api
      .aiStatus()
      .then((s) => setConfigured(s.anyConfigured))
      .catch(() => setConfigured(false));
  }, []);

  const generate = async () => {
    if (!goal.trim()) {
      toast("Bitte beschreibe dein Lernziel.", "info");
      return;
    }
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const user =
        `Heutiges Datum: ${today}.\n` +
        `Lernziel: ${goal.trim()}.\n` +
        (date ? `Prüfungs-/Zieldatum: ${date}.\n` : "") +
        (focus.trim() ? `Schwerpunkte/Schwächen: ${focus.trim()}.\n` : "") +
        `Verfügbare Zeit: etwa ${hours || "5"} Stunden pro Woche.\n\n` +
        "Erstelle daraus einen Lernplan.";
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ];
      const reply = await api.aiChat(messages);
      setPlan(reply.content);
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (configured === false) {
    return (
      <EmptyState
        icon={<Sparkles size={40} />}
        title="KI ist noch nicht eingerichtet"
        desc="Lernpfade werden von der KI aus deinem Ziel erstellt. Hinterlege dafür einen eigenen API-Key."
        action={<Button onClick={() => navigate("/settings")}>KI einrichten</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KI-Lernpfade</h1>
        <p className="mt-1 text-muted">
          Beschreibe dein Ziel — die KI erstellt einen adaptiven Lernplan mit Meilensteinen und
          eingeplanten Wiederholungen.
        </p>
      </div>

      <GlassCard className="space-y-4">
        <div>
          <label className="label">Lernziel</label>
          <input
            className="input"
            placeholder="z. B. AP1-Prüfung Fachinformatiker bestehen"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Zieldatum (optional)</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Stunden / Woche</label>
            <input
              type="number"
              min={1}
              className="input"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Schwerpunkte / Schwächen (optional)</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="z. B. Subnetting, SQL-Joins, Normalisierung"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>
        <Button onClick={generate} disabled={busy || !goal.trim()}>
          {busy ? <Spinner className="h-4 w-4" /> : <Wand2 size={18} />}
          {busy ? "Erstelle Plan…" : plan ? "Neu erstellen" : "Lernplan erstellen"}
        </Button>
      </GlassCard>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Route size={18} />
              <h2 className="font-semibold text-text">Dein Lernplan</h2>
              <button
                className="ml-auto text-muted hover:text-text"
                title="Neu erstellen"
                onClick={generate}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <Markdown>{plan}</Markdown>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

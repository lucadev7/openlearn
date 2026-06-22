import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileInput, Sparkles, Wand2 } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { DeckWithCounts, GeneratedCard } from "@/lib/types";
import { typeLabel } from "@/lib/cardTypes";
import { Button, EmptyState, GlassCard, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

export default function Material() {
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [decks, setDecks] = useState<DeckWithCounts[]>([]);
  const [deckId, setDeckId] = useState("");
  const [newDeck, setNewDeck] = useState("");
  const [source, setSource] = useState("");
  const [count, setCount] = useState(8);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[] | null>(null);
  const [include, setInclude] = useState<boolean[]>([]);

  useEffect(() => {
    api
      .aiStatus()
      .then((s) => setConfigured(s.anyConfigured))
      .catch(() => setConfigured(false));
    api
      .listDecks()
      .then((d) => {
        setDecks(d);
        if (d.length) setDeckId(d[0].id);
      })
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!source.trim()) {
      toast("Bitte füge zuerst Material ein.", "info");
      return;
    }
    setGenerating(true);
    setCards(null);
    try {
      const result = await api.aiGenerateCards(source, count);
      setCards(result);
      setInclude(result.map(() => true));
      if (result.length === 0) toast("Keine Karten erzeugt — versuch es erneut.", "info");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!cards) return;
    const chosen = cards.filter((_, i) => include[i]);
    if (chosen.length === 0) {
      toast("Keine Karten ausgewählt.", "info");
      return;
    }
    setSaving(true);
    try {
      let targetDeck = deckId;
      if (newDeck.trim()) {
        const created = await api.createDeck(newDeck.trim());
        targetDeck = created.id;
      }
      if (!targetDeck) {
        toast("Bitte ein Ziel-Deck wählen oder anlegen.", "info");
        setSaving(false);
        return;
      }
      for (const c of chosen) {
        await api.upsertCard({
          deckId: targetDeck,
          type: c.type,
          promptMd: c.promptMd,
          explanationMd: c.explanationMd,
          payload: c.payload,
          difficulty: c.difficulty,
        });
      }
      toast(`${chosen.length} ${chosen.length === 1 ? "Karte" : "Karten"} gespeichert.`, "success");
      navigate(`/decks/${targetDeck}`);
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setSaving(false);
    }
  };

  if (configured === false) {
    return (
      <EmptyState
        icon={<Sparkles size={40} />}
        title="KI ist noch nicht eingerichtet"
        desc="Für die automatische Karten-Erzeugung brauchst du einen eigenen API-Key (z. B. Gemini Free Tier oder lokal via Ollama)."
        action={<Button onClick={() => navigate("/settings")}>KI einrichten</Button>}
      />
    );
  }

  const selectedCount = include.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Material → Karten</h1>
        <p className="mt-1 text-muted">
          Füge Notizen, ein Skript oder einen Text ein — die KI schlägt Lernkarten vor. Du
          entscheidest, welche gespeichert werden.
        </p>
      </div>

      <GlassCard className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Ziel-Deck</label>
            {decks.length > 0 ? (
              <select
                className="input"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                disabled={!!newDeck.trim()}
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted">Noch kein Deck — lege unten eines an.</p>
            )}
          </div>
          <div>
            <label className="label">Anzahl Karten</label>
            <input
              type="number"
              min={1}
              max={20}
              className="input"
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        <div>
          <label className="label">Neues Deck anlegen (optional)</label>
          <input
            className="input"
            placeholder="Leer lassen, um das gewählte Deck zu nutzen"
            value={newDeck}
            onChange={(e) => setNewDeck(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Material</label>
          <textarea
            className="input min-h-[180px] resize-y"
            placeholder="Text, Notizen oder Stichpunkte hier einfügen…"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <Button onClick={generate} disabled={generating || !source.trim()}>
          {generating ? <Spinner className="h-4 w-4" /> : <Wand2 size={18} />}
          {generating ? "Erzeuge Karten…" : "Karten erzeugen"}
        </Button>
      </GlassCard>

      {cards && cards.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Vorschläge <span className="text-muted">({selectedCount} ausgewählt)</span>
            </h2>
            <Button onClick={save} disabled={saving || selectedCount === 0}>
              {saving ? <Spinner className="h-4 w-4" /> : <Check size={18} />}
              {selectedCount} speichern
            </Button>
          </div>

          <ul className="space-y-2">
            {cards.map((c, i) => (
              <li key={i}>
                <GlassCard
                  className={`cursor-pointer p-4 transition ${
                    include[i] ? "border-primary/40" : "opacity-55"
                  }`}
                  onClick={() => setInclude((arr) => arr.map((v, j) => (j === i ? !v : v)))}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        include[i]
                          ? "border-primary bg-primary text-white"
                          : "border-border/70 text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="chip shrink-0">{typeLabel(c.type)}</span>
                        <span className="text-xs text-muted">D{c.difficulty}</span>
                      </div>
                      <p className="text-sm font-medium text-text/90">
                        {c.promptMd.replace(/\{\{(.*?)\}\}/g, "[$1]")}
                      </p>
                      <CardAnswer card={c} />
                    </div>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {cards && cards.length === 0 && (
        <EmptyState
          icon={<FileInput size={36} />}
          title="Keine Karten erzeugt"
          desc="Versuch es mit mehr oder klarerem Material noch einmal."
        />
      )}
    </div>
  );
}

function CardAnswer({ card }: { card: GeneratedCard }) {
  const p = card.payload as Record<string, unknown>;
  let answer = "";
  switch (card.type) {
    case "single":
    case "multi": {
      const opts = (p.options as string[]) ?? [];
      const correct = card.type === "multi" ? (p.correct as number[]) ?? [] : [p.correct as number];
      answer = opts
        .map((o, i) => (correct.includes(i) ? `✓ ${o}` : o))
        .join(" · ");
      break;
    }
    case "truefalse":
      answer = (p.answer as boolean) ? "Wahr" : "Falsch";
      break;
    case "cloze":
      answer = `Lösung: ${((p.answers as string[]) ?? []).join(", ")}`;
      break;
    case "numeric":
      answer = `= ${p.value as number}${p.unit ? ` ${p.unit as string}` : ""}`;
      break;
  }
  if (!answer) return null;
  return <p className="mt-1.5 text-xs text-muted">{answer}</p>;
}

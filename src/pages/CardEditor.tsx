import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, Plus, Save, Trash2 } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { CardInput, CardPayload } from "@/lib/types";
import { CARD_TYPES } from "@/lib/cardTypes";
import { Markdown } from "@/components/Markdown";
import { Button, GlassCard, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

const DIFFICULTIES = ["sehr leicht", "leicht", "mittel", "schwer", "sehr schwer"];

export default function CardEditor() {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);

  const editId = params.id ?? null;
  const isEdit = !!editId;

  const [loading, setLoading] = useState(isEdit);
  const [deckId, setDeckId] = useState(params.deckId ?? "");
  const [type, setType] = useState("single");
  const [promptMd, setPromptMd] = useState("");
  const [explanationMd, setExplanationMd] = useState("");
  const [difficulty, setDifficulty] = useState(2);

  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctSingle, setCorrectSingle] = useState(0);
  const [correctMulti, setCorrectMulti] = useState<number[]>([]);
  const [tfAnswer, setTfAnswer] = useState(true);
  const [clozeAnswers, setClozeAnswers] = useState("");
  const [numValue, setNumValue] = useState("");
  const [numTolerance, setNumTolerance] = useState("0");
  const [numUnit, setNumUnit] = useState("");

  useEffect(() => {
    if (!editId) return;
    api
      .getCard(editId)
      .then((c) => {
        setDeckId(c.deckId);
        setType(c.type);
        setPromptMd(c.promptMd);
        setExplanationMd(c.explanationMd ?? "");
        setDifficulty(c.difficulty);
        const p = c.payload as Record<string, unknown>;
        if (c.type === "single") {
          setOptions((p.options as string[]) ?? ["", ""]);
          setCorrectSingle((p.correct as number) ?? 0);
        } else if (c.type === "multi") {
          setOptions((p.options as string[]) ?? ["", ""]);
          setCorrectMulti((p.correct as number[]) ?? []);
        } else if (c.type === "truefalse") {
          setTfAnswer((p.answer as boolean) ?? true);
        } else if (c.type === "cloze") {
          setClozeAnswers(((p.answers as string[]) ?? []).join("\n"));
        } else if (c.type === "numeric") {
          setNumValue(String(p.value ?? ""));
          setNumTolerance(String(p.tolerance ?? "0"));
          setNumUnit((p.unit as string) ?? "");
        }
      })
      .catch((e) => toast(errMsg(e), "error"))
      .finally(() => setLoading(false));
  }, [editId, toast]);

  const buildPayload = (): CardPayload | null => {
    const opts = options.map((o) => o.trim());
    switch (type) {
      case "single":
        if (opts.filter(Boolean).length < 2) return fail("Mindestens zwei Optionen angeben.");
        return { options: opts, correct: correctSingle };
      case "multi":
        if (opts.filter(Boolean).length < 2) return fail("Mindestens zwei Optionen angeben.");
        if (correctMulti.length < 1) return fail("Mindestens eine richtige Option markieren.");
        return { options: opts, correct: correctMulti };
      case "truefalse":
        return { answer: tfAnswer };
      case "cloze": {
        const answers = clozeAnswers
          .split("\n")
          .map((a) => a.trim())
          .filter(Boolean);
        if (answers.length < 1) return fail("Mindestens eine Lückenlösung angeben.");
        return { answers };
      }
      case "numeric": {
        const value = Number(numValue.replace(",", "."));
        if (Number.isNaN(value)) return fail("Bitte einen gültigen Zahlenwert angeben.");
        const tolerance = Number(numTolerance.replace(",", ".")) || 0;
        return { value, tolerance, unit: numUnit.trim() || undefined };
      }
      default:
        return {};
    }
  };

  const fail = (msg: string): null => {
    toast(msg, "error");
    return null;
  };

  const save = async () => {
    if (!promptMd.trim()) return toast("Der Fragetext darf nicht leer sein.", "error");
    if (!deckId) return toast("Kein Deck gewählt.", "error");
    const payload = buildPayload();
    if (payload === null) return;
    const input: CardInput = {
      id: editId,
      deckId,
      type,
      promptMd,
      explanationMd: explanationMd.trim() || null,
      payload,
      difficulty,
    };
    try {
      await api.upsertCard(input);
      toast(isEdit ? "Karte gespeichert." : "Karte erstellt.", "success");
      navigate(`/decks/${deckId}`);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const supported = useMemo(
    () => CARD_TYPES.filter((t) => t.phase1).map((t) => t.value),
    []
  );
  const typeDef = CARD_TYPES.find((t) => t.value === type);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        onClick={() => navigate(deckId ? `/decks/${deckId}` : "/decks")}
      >
        <ArrowLeft size={15} /> Zurück
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Karte bearbeiten" : "Neue Karte"}</h1>
        <Button onClick={save}>
          <Save size={18} /> Speichern
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">
          <GlassCard className="space-y-4">
            <div>
              <label className="label">Fragetyp</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isEdit}
              >
                {CARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value} disabled={!t.phase1}>
                    {t.label}
                    {t.phase1 ? "" : " — folgt"}
                  </option>
                ))}
              </select>
              {typeDef?.hint && <p className="mt-1.5 text-xs text-muted">{typeDef.hint}</p>}
              {!supported.includes(type) && (
                <p className="mt-1.5 text-xs text-warn">
                  Dieser Typ erhält seinen Editor in einer späteren Phase.
                </p>
              )}
            </div>

            <div>
              <label className="label">Frage (Markdown)</label>
              <textarea
                className="input min-h-[120px] font-mono text-sm"
                value={promptMd}
                onChange={(e) => setPromptMd(e.target.value)}
                placeholder={
                  type === "cloze"
                    ? "Die Hauptstadt von {{Frankreich}} ist Paris."
                    : "Stelle hier deine Frage …"
                }
              />
            </div>

            <PayloadEditor
              type={type}
              options={options}
              setOptions={setOptions}
              correctSingle={correctSingle}
              setCorrectSingle={setCorrectSingle}
              correctMulti={correctMulti}
              setCorrectMulti={setCorrectMulti}
              tfAnswer={tfAnswer}
              setTfAnswer={setTfAnswer}
              clozeAnswers={clozeAnswers}
              setClozeAnswers={setClozeAnswers}
              numValue={numValue}
              setNumValue={setNumValue}
              numTolerance={numTolerance}
              setNumTolerance={setNumTolerance}
              numUnit={numUnit}
              setNumUnit={setNumUnit}
            />
          </GlassCard>

          <GlassCard className="space-y-4">
            <div>
              <label className="label">Erklärung (optional, Markdown)</label>
              <textarea
                className="input min-h-[80px] font-mono text-sm"
                value={explanationMd}
                onChange={(e) => setExplanationMd(e.target.value)}
                placeholder="Warum ist das so? Diese Erklärung erscheint nach dem Antworten."
              />
            </div>
            <div>
              <label className="label">Schwierigkeit</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setDifficulty(i)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition ${
                      difficulty === i
                        ? "border-primary/60 bg-primary/15 text-text"
                        : "border-border/60 text-muted hover:text-text"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Eye size={15} /> Vorschau
          </div>
          <GlassCard>
            {promptMd.trim() ? (
              <Markdown>{promptMd}</Markdown>
            ) : (
              <p className="text-muted">Die Frage erscheint hier …</p>
            )}
            <PreviewAnswers
              type={type}
              options={options}
              correctSingle={correctSingle}
              correctMulti={correctMulti}
              tfAnswer={tfAnswer}
            />
            {explanationMd.trim() && (
              <div className="mt-4 rounded-xl border border-border/50 bg-surface-2/50 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Erklärung
                </div>
                <Markdown>{explanationMd}</Markdown>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

interface PayloadEditorProps {
  type: string;
  options: string[];
  setOptions: (v: string[]) => void;
  correctSingle: number;
  setCorrectSingle: (v: number) => void;
  correctMulti: number[];
  setCorrectMulti: (v: number[]) => void;
  tfAnswer: boolean;
  setTfAnswer: (v: boolean) => void;
  clozeAnswers: string;
  setClozeAnswers: (v: string) => void;
  numValue: string;
  setNumValue: (v: string) => void;
  numTolerance: string;
  setNumTolerance: (v: string) => void;
  numUnit: string;
  setNumUnit: (v: string) => void;
}

function PayloadEditor(p: PayloadEditorProps) {
  if (p.type === "single" || p.type === "multi") {
    const multi = p.type === "multi";
    const toggle = (i: number) => {
      if (multi) {
        p.setCorrectMulti(
          p.correctMulti.includes(i)
            ? p.correctMulti.filter((x) => x !== i)
            : [...p.correctMulti, i]
        );
      } else {
        p.setCorrectSingle(i);
      }
    };
    const isCorrect = (i: number) => (multi ? p.correctMulti.includes(i) : p.correctSingle === i);
    return (
      <div>
        <label className="label">Antwortoptionen — die richtige(n) markieren</label>
        <div className="space-y-2">
          {p.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggle(i)}
                title="Als richtig markieren"
                className={`grid h-6 w-6 shrink-0 place-items-center border transition ${
                  multi ? "rounded-md" : "rounded-full"
                } ${
                  isCorrect(i)
                    ? "border-success bg-success/20 text-success"
                    : "border-border/70 text-transparent"
                }`}
              >
                <Check size={14} />
              </button>
              <input
                className="input"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const next = [...p.options];
                  next[i] = e.target.value;
                  p.setOptions(next);
                }}
              />
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted hover:text-danger"
                onClick={() => {
                  const next = p.options.filter((_, x) => x !== i);
                  p.setOptions(next.length ? next : [""]);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => p.setOptions([...p.options, ""])}
        >
          <Plus size={15} /> Option
        </Button>
      </div>
    );
  }

  if (p.type === "truefalse") {
    return (
      <div>
        <label className="label">Korrekte Aussage</label>
        <div className="flex gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => p.setTfAnswer(v)}
              className={`flex-1 rounded-xl border px-3 py-2.5 transition ${
                p.tfAnswer === v
                  ? "border-primary/60 bg-primary/15"
                  : "border-border/60 text-muted hover:text-text"
              }`}
            >
              {v ? "Wahr" : "Falsch"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (p.type === "cloze") {
    return (
      <div>
        <label className="label">Lückenlösungen (eine pro Zeile, in Reihenfolge der {"{{…}}"})</label>
        <textarea
          className="input min-h-[80px] font-mono text-sm"
          value={p.clozeAnswers}
          onChange={(e) => p.setClozeAnswers(e.target.value)}
          placeholder={"Frankreich"}
        />
      </div>
    );
  }

  if (p.type === "numeric") {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Wert</label>
          <input className="input" value={p.numValue} onChange={(e) => p.setNumValue(e.target.value)} />
        </div>
        <div>
          <label className="label">± Toleranz</label>
          <input
            className="input"
            value={p.numTolerance}
            onChange={(e) => p.setNumTolerance(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Einheit</label>
          <input
            className="input"
            value={p.numUnit}
            placeholder="z. B. €, %, Mon."
            onChange={(e) => p.setNumUnit(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return null;
}

function PreviewAnswers({
  type,
  options,
  correctSingle,
  correctMulti,
  tfAnswer,
}: {
  type: string;
  options: string[];
  correctSingle: number;
  correctMulti: number[];
  tfAnswer: boolean;
}) {
  if (type === "single" || type === "multi") {
    const isCorrect = (i: number) =>
      type === "multi" ? correctMulti.includes(i) : correctSingle === i;
    return (
      <div className="mt-4 space-y-2">
        {options
          .filter((o) => o.trim())
          .map((o, i) => (
            <div
              key={i}
              className={`rounded-xl border px-3 py-2 text-sm ${
                isCorrect(i) ? "border-success/50 bg-success/10" : "border-border/50"
              }`}
            >
              {o}
            </div>
          ))}
      </div>
    );
  }
  if (type === "truefalse") {
    return (
      <div className="mt-4 text-sm text-muted">
        Richtige Antwort: <span className="font-semibold text-text">{tfAnswer ? "Wahr" : "Falsch"}</span>
      </div>
    );
  }
  return null;
}

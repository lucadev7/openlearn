export interface CardTypeDef {
  value: string;
  label: string;
  phase1: boolean;
  hint?: string;
}

export const CARD_TYPES: CardTypeDef[] = [
  { value: "single", label: "Single Choice", phase1: true, hint: "Genau eine richtige Antwort." },
  { value: "multi", label: "Multiple Choice", phase1: true, hint: "Mehrere richtige Antworten möglich." },
  { value: "truefalse", label: "Wahr / Falsch", phase1: true },
  { value: "cloze", label: "Lückentext", phase1: true, hint: "Markiere Lücken im Text mit {{...}}." },
  { value: "numeric", label: "Numerisch", phase1: true, hint: "Zahl mit Toleranz." },
  { value: "short_text", label: "Kurzantwort (KI)", phase1: false },
  { value: "essay", label: "Freitext / Essay (KI)", phase1: false },
  { value: "sql_write", label: "SQL schreiben (KI)", phase1: false },
  { value: "code_trace", label: "Code-Trace", phase1: false },
  { value: "matching", label: "Zuordnung", phase1: false },
  { value: "ordering", label: "Reihenfolge", phase1: false },
];

export const typeLabel = (t: string): string =>
  CARD_TYPES.find((c) => c.value === t)?.label ?? t;

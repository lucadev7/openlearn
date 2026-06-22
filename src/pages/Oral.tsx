import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, GraduationCap, Mic, Send, Sparkles, User } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

const examinerSystem = (topic: string): string =>
  `Du bist ein wohlwollender, aber gründlicher mündlicher Prüfer. Prüfe den Lernenden zum Thema: ${topic}. ` +
  `Stelle immer nur EINE Frage auf einmal und warte auf die Antwort. Gehe auf die Antwort ein, hake bei ` +
  `Lücken nach und steigere langsam die Schwierigkeit. Nach etwa 5–6 Fragen oder wenn der Lernende um ` +
  `Abschluss bittet, beende die Prüfung mit einer kurzen Bewertung: Stärken, Schwächen, eine Note von 1 ` +
  `(sehr gut) bis 6 (ungenügend) und 2–3 konkrete Lerntipps. Antworte auf Deutsch und halte dich kurz.`;

export default function Oral() {
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .aiStatus()
      .then((s) => setConfigured(s.anyConfigured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Visible transcript = everything except the hidden system prompt.
  const visible = messages.filter((m) => m.role !== "system");

  const advance = async (history: ChatMessage[]) => {
    setBusy(true);
    try {
      const reply = await api.aiChat(history);
      setMessages([...history, { role: "assistant", content: reply.content }]);
    } catch (e) {
      toast(errMsg(e), "error");
      setMessages(history.filter((m) => m.role !== "system" || history.indexOf(m) === 0));
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!topic.trim()) {
      toast("Bitte gib ein Thema an.", "info");
      return;
    }
    setStarted(true);
    await advance([
      { role: "system", content: examinerSystem(topic.trim()) },
      { role: "user", content: "Starte die Prüfung mit deiner ersten Frage." },
    ]);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    await advance([...messages, { role: "user", content }]);
  };

  const finish = async () => {
    if (busy) return;
    await advance([
      ...messages,
      { role: "user", content: "Bitte beende die Prüfung jetzt und gib mir die Bewertung." },
    ]);
  };

  if (configured === false) {
    return (
      <EmptyState
        icon={<Sparkles size={40} />}
        title="KI ist noch nicht eingerichtet"
        desc="Die mündliche Prüfung nutzt einen KI-Prüfer. Hinterlege dafür einen eigenen API-Key."
        action={<Button onClick={() => navigate("/settings")}>KI einrichten</Button>}
      />
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mündliche Prüfung</h1>
          <p className="mt-1 text-muted">
            Übe wie in einer echten Prüfung: Ein KI-Prüfer stellt Fragen zu deinem Thema, hakt nach
            und gibt am Ende eine Bewertung.
          </p>
        </div>
        <div className="card space-y-4 p-5">
          <div>
            <label className="label">Prüfungsthema</label>
            <input
              autoFocus
              className="input"
              placeholder="z. B. Normalisierung in relationalen Datenbanken"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start()}
            />
          </div>
          <Button className="w-full" size="lg" onClick={start} disabled={!topic.trim()}>
            <Mic size={18} /> Prüfung starten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-semibold leading-tight">Mündliche Prüfung</h1>
            <p className="text-xs text-muted">{topic}</p>
          </div>
        </div>
        <Button variant="subtle" size="sm" onClick={finish} disabled={busy}>
          Beenden & bewerten
        </Button>
      </div>

      <div ref={scrollRef} className="card flex-1 space-y-4 overflow-y-auto p-5">
        {visible.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                m.role === "user" ? "bg-surface-2 text-muted" : "bg-primary/15 text-primary"
              }`}
            >
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-primary text-white"
                  : "border border-border/50 bg-surface-2/40 text-text/90"
              }`}
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <Markdown>{m.content}</Markdown>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-muted">
            <Spinner className="h-4 w-4" />
            <span className="text-sm">Prüfer überlegt…</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <textarea
          className="input max-h-40 min-h-[48px] flex-1 resize-none"
          rows={1}
          placeholder="Deine Antwort… (Enter sendet)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <Button onClick={() => send(input)} disabled={busy || !input.trim()} className="h-12">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}

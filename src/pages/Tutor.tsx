import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Eraser, Send, Sparkles, User } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { useStore } from "@/store/useStore";

const SUGGESTIONS = [
  "Erkläre mir Spaced Repetition in einfachen Worten.",
  "Gib mir eine Lernstrategie für eine Prüfung in 2 Wochen.",
  "Frag mich 3 Fragen zu einem Thema meiner Wahl ab.",
];

export default function Tutor() {
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [configured, setConfigured] = useState<boolean | null>(null);
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

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await api.aiChat(next);
      setMessages([...next, { role: "assistant", content: reply.content }]);
    } catch (e) {
      setMessages(messages);
      setInput(content);
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
        desc="Hinterlege einen eigenen API-Key (z. B. Gemini Free Tier oder lokal via Ollama), um den Tutor zu nutzen. Der Lern-Kern funktioniert auch ohne."
        action={<Button onClick={() => navigate("/settings")}>KI einrichten</Button>}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="font-semibold leading-tight">KI-Tutor</h1>
            <p className="text-xs text-muted">Erklärt, fragt nach und hilft beim Lernen.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
            <Eraser size={15} /> Leeren
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="card flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles size={26} />
            </div>
            <h2 className="text-lg font-semibold">Womit kann ich helfen?</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              Stell eine Frage oder wähle einen Vorschlag. Antworten kommen direkt von deinem
              gewählten Anbieter.
            </p>
            <div className="mt-5 flex w-full max-w-md flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-border/60 bg-surface-2/40 px-4 py-2.5 text-left text-sm transition hover:border-primary/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} message={m} />)
        )}
        {busy && (
          <div className="flex items-center gap-2 text-muted">
            <Spinner className="h-4 w-4" />
            <span className="text-sm">Tutor denkt nach…</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <textarea
          className="input max-h-40 min-h-[48px] flex-1 resize-none"
          rows={1}
          placeholder="Frage stellen… (Enter sendet, Shift+Enter = neue Zeile)"
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

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          isUser ? "bg-surface-2 text-muted" : "bg-primary/15 text-primary"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-white"
            : "border border-border/50 bg-surface-2/40 text-text/90"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown>{message.content}</Markdown>
        )}
      </div>
    </div>
  );
}

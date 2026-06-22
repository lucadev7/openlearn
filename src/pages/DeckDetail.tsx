import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { save } from "@tauri-apps/plugin-dialog";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { Card, Deck } from "@/lib/types";
import { typeLabel } from "@/lib/cardTypes";
import { useStore } from "@/store/useStore";
import { Button, EmptyState, GlassCard, Spinner } from "@/components/ui";

export default function DeckDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [d, c] = await Promise.all([api.getDeck(id), api.listCards(id)]);
      setDeck(d);
      setName(d.name);
      setCards(c);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rename = async () => {
    if (!id || !name.trim()) return;
    try {
      const d = await api.renameDeck(id, name.trim());
      setDeck(d);
      setEditingName(false);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const removeDeck = async () => {
    if (!id || !deck) return;
    if (!confirm(`Deck „${deck.name}“ und alle Karten endgültig löschen?`)) return;
    try {
      await api.deleteDeck(id);
      toast("Deck gelöscht.", "success");
      navigate("/decks");
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const exportDeck = async () => {
    if (!deck) return;
    try {
      const path = await save({
        title: "Deck exportieren",
        defaultPath: `${deck.name}.json`,
        filters: [{ name: "OpenLearn-Pack", extensions: ["json"] }],
      });
      if (!path) return;
      await api.exportPack([deck.id], path);
      toast("Deck exportiert.", "success");
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const toggleSuspend = async (card: Card) => {
    try {
      await api.setSuspended(card.id, !card.suspended);
      load();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const removeCard = async (card: Card) => {
    if (!confirm("Diese Karte löschen?")) return;
    try {
      await api.deleteCard(card.id);
      toast("Karte gelöscht.", "success");
      load();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  if (!deck || cards === null) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/decks" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} /> Alle Decks
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rename()}
              />
              <Button size="sm" onClick={rename}>
                <Check size={16} />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{deck.name}</h1>
              <button
                className="text-muted hover:text-text"
                onClick={() => setEditingName(true)}
                title="Umbenennen"
              >
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => navigate(`/study?deck=${deck.id}`)}>
            <GraduationCap size={18} /> Lernen
          </Button>
          <Button variant="subtle" onClick={() => navigate(`/decks/${deck.id}/cards/new`)}>
            <Plus size={18} /> Karte
          </Button>
          <Button variant="ghost" onClick={exportDeck} title="Deck exportieren">
            <Download size={18} />
          </Button>
          <Button variant="ghost" className="text-danger" onClick={removeDeck} title="Deck löschen">
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="Dieses Deck ist noch leer"
          desc="Füge deine erste Karte hinzu. Du kannst Single/Multiple Choice, Wahr/Falsch, Lückentext und numerische Fragen anlegen."
          action={
            <Button onClick={() => navigate(`/decks/${deck.id}/cards/new`)}>
              <Plus size={18} /> Erste Karte
            </Button>
          }
        />
      ) : (
        <GlassCard className="p-0">
          <ul className="divide-y divide-border/40">
            {cards.map((c) => (
              <li
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 ${c.suspended ? "opacity-50" : ""}`}
              >
                <span className="chip shrink-0">{typeLabel(c.type)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-text/90">
                  {c.promptMd.replace(/[#*`>_]/g, "").trim() || "(ohne Text)"}
                </span>
                <span className="hidden shrink-0 text-xs text-muted sm:block" title="Schwierigkeit">
                  D{c.difficulty}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="rounded-lg p-1.5 text-muted hover:bg-surface-2/70 hover:text-text"
                    title={c.suspended ? "Aktivieren" : "Aussetzen"}
                    onClick={() => toggleSuspend(c)}
                  >
                    {c.suspended ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-muted hover:bg-surface-2/70 hover:text-text"
                    title="Bearbeiten"
                    onClick={() => navigate(`/cards/${c.id}/edit`)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-muted hover:bg-surface-2/70 hover:text-danger"
                    title="Löschen"
                    onClick={() => removeCard(c)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

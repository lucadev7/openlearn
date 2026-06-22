import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Library, Plus, X } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { DeckWithCounts } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Button, EmptyState, GlassCard, Spinner } from "@/components/ui";

export default function Decks() {
  const [decks, setDecks] = useState<DeckWithCounts[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const toast = useStore((s) => s.toast);

  const load = () =>
    api
      .listDecks()
      .then(setDecks)
      .catch((e) => {
        toast(errMsg(e), "error");
        setDecks([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      await api.createDeck(name.trim());
      setName("");
      setCreating(false);
      toast("Deck erstellt.", "success");
      load();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Decks</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? <X size={18} /> : <Plus size={18} />}
          {creating ? "Abbrechen" : "Neues Deck"}
        </Button>
      </div>

      {creating && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <GlassCard className="flex items-center gap-3">
            <input
              autoFocus
              className="input"
              placeholder="Deck-Name, z. B. „Spanisch — Grundwortschatz“"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <Button onClick={create}>Anlegen</Button>
          </GlassCard>
        </motion.div>
      )}

      {decks === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : decks.length === 0 ? (
        <EmptyState
          icon={<Library size={40} />}
          title="Noch keine Decks"
          desc="Lege dein erstes Deck an und fülle es mit Karten — oder importiere später einen Content-Pack."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={18} /> Deck anlegen
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Link to={`/decks/${d.id}`}>
                <GlassCard className="h-full transition hover:border-primary/50">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-semibold leading-snug">{d.name}</h3>
                    <span className="text-xs text-muted">{d.total} Karten</span>
                  </div>
                  <div className="flex gap-2">
                    {d.due > 0 && (
                      <span className="chip border-primary/40 text-primary">{d.due} fällig</span>
                    )}
                    {d.newCount > 0 && (
                      <span className="chip border-accent/40 text-accent">{d.newCount} neu</span>
                    )}
                    {d.due === 0 && d.newCount === 0 && (
                      <span className="chip">nichts fällig</span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

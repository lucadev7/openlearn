import { useEffect, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Check, Database, Download, Eye, EyeOff, Palette, Sparkles, Trash2, Upload } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { AiStatus } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Button, GlassCard, Spinner } from "@/components/ui";

type Tab = "appearance" | "ai" | "data";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Darstellung", icon: Palette },
  { id: "ai", label: "KI", icon: Sparkles },
  { id: "data", label: "Daten & Über", icon: Database },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-surface-2"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>("appearance");
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);

  if (!settings) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <div className="flex gap-1 rounded-xl bg-surface-2/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              tab === t.id ? "bg-primary/15 text-text" : "text-muted hover:text-text"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "appearance" && (
        <GlassCard className="space-y-6">
          <div>
            <label className="label">Theme</label>
            <div className="flex gap-3">
              {[
                { id: "aurora", label: "Aurora (dunkel)" },
                { id: "paper", label: "Papier (hell)" },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => saveSettings({ theme: th.id })}
                  className={`flex-1 rounded-xl border px-4 py-3 transition ${
                    settings.theme === th.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/60 text-muted hover:text-text"
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Animationen reduzieren</div>
              <div className="text-sm text-muted">
                Schaltet Bewegungseffekte ab (zusätzlich zur System-Einstellung).
              </div>
            </div>
            <Toggle
              on={settings.reducedMotion}
              onChange={(v) => saveSettings({ reducedMotion: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tagesziel (Wiederholungen)</label>
              <input
                type="number"
                min={5}
                className="input"
                value={settings.dailyGoal}
                onChange={(e) => saveSettings({ dailyGoal: Math.max(1, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="label">Neue Karten pro Tag</label>
              <input
                type="number"
                min={0}
                className="input"
                value={settings.newCardsPerDay}
                onChange={(e) =>
                  saveSettings({ newCardsPerDay: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </div>
        </GlassCard>
      )}

      {tab === "ai" && <AiSettings />}

      {tab === "data" && <DataSettings />}
    </div>
  );
}

function DataSettings() {
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState<"backup" | "restore" | null>(null);

  const doBackup = async () => {
    try {
      const path = await save({
        title: "Backup speichern",
        defaultPath: "openlearn-backup.db",
        filters: [{ name: "OpenLearn-Backup", extensions: ["db"] }],
      });
      if (!path) return;
      setBusy("backup");
      await api.backup(path);
      toast("Backup gespeichert.", "success");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    const path = await open({
      multiple: false,
      title: "Backup wählen",
      filters: [{ name: "OpenLearn-Backup", extensions: ["db"] }],
    });
    if (!path || typeof path !== "string") return;
    if (!confirm("Die aktuellen Daten werden vollständig durch das Backup ersetzt. Fortfahren?")) {
      return;
    }
    try {
      setBusy("restore");
      await api.restore(path);
      toast("Backup wiederhergestellt — App wird neu geladen.", "success");
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      toast(errMsg(e), "error");
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-4">
        <div>
          <h2 className="font-semibold">Backup & Wiederherstellung</h2>
          <p className="mt-1 text-sm text-muted">
            Sichere deine gesamte lokale Datenbank (Decks, Karten, Fortschritt) in eine Datei –
            oder spiele ein früheres Backup wieder ein.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="subtle" onClick={doBackup} disabled={busy !== null}>
            {busy === "backup" ? <Spinner className="h-4 w-4" /> : <Download size={16} />} Backup
            erstellen
          </Button>
          <Button variant="subtle" onClick={doRestore} disabled={busy !== null}>
            {busy === "restore" ? <Spinner className="h-4 w-4" /> : <Upload size={16} />} Backup
            einspielen
          </Button>
        </div>
        <p className="text-xs text-muted/80">
          Beim Einspielen werden die aktuellen Daten überschrieben. Erstelle vorher bei Bedarf ein
          Backup.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Version</span>
          <span className="font-medium">OpenLearn 0.1.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Telemetrie</span>
          <span className="font-medium text-success">keine</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Lizenz</span>
          <span className="font-medium">MIT (Code)</span>
        </div>
        <p className="pt-2 text-muted">
          Alle Lern- und Fortschrittsdaten bleiben lokal auf deinem Gerät (SQLite). API-Keys liegen
          ausschließlich im Windows Credential Manager.
        </p>
        <p className="text-xs text-muted/80">
          Hinweis: Release-Builds sind aktuell nicht signiert — Windows SmartScreen kann beim ersten
          Start eine Warnung zeigen („Weitere Informationen → Trotzdem ausführen").
        </p>
      </GlassCard>
    </div>
  );
}

function AiSettings() {
  const toast = useStore((s) => s.toast);
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);

  const [status, setStatus] = useState<AiStatus | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});

  const load = () => api.aiStatus().then(setStatus).catch((e) => toast(errMsg(e), "error"));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveKey = async (provider: string) => {
    const key = (drafts[provider] ?? "").trim();
    if (!key) return;
    try {
      await api.secretSet(provider, key);
      setDrafts((d) => ({ ...d, [provider]: "" }));
      toast("API-Key gespeichert (im Keychain).", "success");
      load();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const deleteKey = async (provider: string) => {
    try {
      await api.secretDelete(provider);
      toast("API-Key entfernt.", "success");
      load();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const test = async (provider: string) => {
    try {
      await api.aiTestConnection(provider);
      toast("Verbindung ok.", "success");
    } catch (e) {
      toast(errMsg(e), "info");
    }
  };

  if (!status || !settings) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const configured = status.providers.filter((p) => p.configured);

  return (
    <div className="space-y-4">
      <GlassCard>
        <p className="text-sm text-muted">
          OpenLearn nutzt <span className="font-medium text-text">deinen eigenen API-Key</span>{" "}
          (Bring-your-own-key). Empfohlen für den kostenlosen Einstieg: <b>Gemini Free Tier</b> oder
          vollständig lokal/offline via <b>Ollama</b> (OpenAI-kompatibel). Keys werden sicher im
          Windows Credential Manager gespeichert.
        </p>
      </GlassCard>

      {status.providers.map((prov) => (
        <GlassCard key={prov.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{prov.label}</span>
              {prov.configured && (
                <span className="chip border-success/40 text-success">
                  <Check size={12} /> eingerichtet
                </span>
              )}
            </div>
            {prov.configured && (
              <div className="flex gap-2">
                <Button size="sm" variant="subtle" onClick={() => test(prov.id)}>
                  Test
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => deleteKey(prov.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                className="input pr-10"
                type={shown[prov.id] ? "text" : "password"}
                placeholder={prov.configured ? "Neuen Key eingeben, um zu ersetzen" : "API-Key einfügen"}
                value={drafts[prov.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [prov.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveKey(prov.id)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                onClick={() => setShown((s) => ({ ...s, [prov.id]: !s[prov.id] }))}
                tabIndex={-1}
              >
                {shown[prov.id] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Button onClick={() => saveKey(prov.id)} disabled={!(drafts[prov.id] ?? "").trim()}>
              Speichern
            </Button>
          </div>
        </GlassCard>
      ))}

      <GlassCard className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Standard-Anbieter</label>
            <select
              className="input"
              value={settings.defaultProvider ?? ""}
              onChange={(e) => saveSettings({ defaultProvider: e.target.value || null })}
            >
              <option value="">— wählen —</option>
              {configured.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Standard-Modell</label>
            <input
              className="input"
              placeholder="z. B. gemini-2.0-flash"
              value={settings.defaultModel ?? ""}
              onChange={(e) => saveSettings({ defaultModel: e.target.value || null })}
            />
          </div>
        </div>
        <div>
          <label className="label">Basis-URL (nur für „OpenAI-kompatibel")</label>
          <input
            className="input"
            placeholder="z. B. http://localhost:11434/v1 (Ollama) oder https://openrouter.ai/api/v1"
            value={settings.openaiBaseUrl ?? ""}
            onChange={(e) => saveSettings({ openaiBaseUrl: e.target.value || null })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Kosten vor jedem KI-Lauf bestätigen</div>
            <div className="text-sm text-muted">Zeigt die geschätzten Token/Kosten vor bezahlten Anfragen.</div>
          </div>
          <Toggle on={settings.costConfirm} onChange={(v) => saveSettings({ costConfirm: v })} />
        </div>
        <p className="text-xs text-muted/80">
          Verbindungstest und KI-Funktionen (Tutor, Material → Karten, Antwort-Bewertung) sind aktiv.
          Anfragen gehen direkt an den gewählten Anbieter — niemals über einen OpenLearn-Server.
        </p>
      </GlassCard>
    </div>
  );
}

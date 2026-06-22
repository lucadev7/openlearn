import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { APP_VERSION, CHANGELOG } from "@/lib/changelog";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui";

const SEEN_KEY = "ol_seen_version";

export function hasUnseenChangelog(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== APP_VERSION;
  } catch {
    return false;
  }
}

export function WhatsNew() {
  const open = useStore((s) => s.showChangelog);
  const setOpen = useStore((s) => s.setShowChangelog);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, APP_VERSION);
    } catch {
      /* ignore storage errors */
    }
    setOpen(false);
  };

  const latest = CHANGELOG[0];
  const older = CHANGELOG.slice(1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="card w-full max-w-lg overflow-hidden"
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2 className="font-semibold leading-tight">Was ist neu</h2>
                  <p className="text-xs text-muted">
                    Version {latest.version} · {latest.title}
                  </p>
                </div>
              </div>
              <button onClick={close} className="text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5">
              <ul className="space-y-2">
                {latest.changes.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-text/90">{c}</span>
                  </li>
                ))}
              </ul>

              {older.length > 0 && (
                <div className="border-t border-border/40 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted/70">
                    Frühere Versionen
                  </div>
                  {older.map((e) => (
                    <div key={e.version} className="mb-3">
                      <div className="text-sm font-medium">
                        {e.version} — {e.title}
                      </div>
                      <ul className="mt-1 space-y-1">
                        {e.changes.map((c, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted/60" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border/50 p-4">
              <Button className="w-full" onClick={close}>
                Los geht's
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

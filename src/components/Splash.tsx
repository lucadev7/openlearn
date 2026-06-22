import { useState } from "react";
import { motion } from "framer-motion";

import { APP_VERSION } from "@/lib/changelog";

const TIPS = [
  "Kurze, tägliche Sessions schlagen Marathon-Lernen.",
  "Bewerte ehrlich — Nochmal bringt dich langfristig schneller voran.",
  "Erstelle eigene Decks oder importiere fertige Content-Packs.",
  "Mit eigenem API-Key schaltest du den KI-Tutor frei.",
  "Verdiene Coins beim Lernen und gib sie im Shop aus.",
];

export function Splash() {
  const [tip] = useState(() => TIPS[Math.floor(Date.now() / 1000) % TIPS.length]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-bg"
    >
      <div
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--ol-primary) / 0.5), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] text-3xl font-bold text-white shadow-glass-lg"
          style={{ background: "linear-gradient(135deg, rgb(110 100 255), rgb(20 200 160))" }}
        >
          OL
          <span
            className="absolute inset-0 animate-pulse-ring rounded-[1.75rem]"
            style={{ boxShadow: "0 0 0 2px rgb(110 100 255 / 0.5)" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center"
        >
          <div className="text-2xl font-bold tracking-tight">OpenLearn</div>
          <div className="text-sm text-muted">Lernen, das hängen bleibt</div>
        </motion.div>

        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xs px-6 text-center text-xs text-muted"
        >
          {tip}
        </motion.p>
      </div>

      <div className="absolute bottom-6 text-xs text-muted/70">v{APP_VERSION}</div>
    </motion.div>
  );
}

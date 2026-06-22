import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";

import { useStore } from "@/store/useStore";
import { ToastViewport } from "@/components/ui";
import { Splash } from "@/components/Splash";

// Minimum time the boot screen stays visible, so it reads as a real loading
// screen rather than a flash even when init is instant.
const MIN_BOOT_MS = 1600;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useStore((s) => s.settings);
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    init();
    const t = setTimeout(() => setBooted(true), MIN_BOOT_MS);
    return () => clearTimeout(t);
  }, [init]);

  useEffect(() => {
    const theme = settings?.theme ?? "aurora";
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme !== "paper");
  }, [settings?.theme]);

  return (
    <MotionConfig reducedMotion={settings?.reducedMotion ? "always" : "user"}>
      <AnimatePresence mode="wait">
        {ready && booted ? <div key="app">{children}</div> : <Splash />}
      </AnimatePresence>
      <ToastViewport />
    </MotionConfig>
  );
}

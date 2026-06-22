import { useEffect, type ReactNode } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";

import { useStore } from "@/store/useStore";
import { ToastViewport } from "@/components/ui";
import { Splash } from "@/components/Splash";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useStore((s) => s.settings);
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);

  useEffect(() => {
    init();
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
        {ready ? <div key="app">{children}</div> : <Splash />}
      </AnimatePresence>
      <ToastViewport />
    </MotionConfig>
  );
}

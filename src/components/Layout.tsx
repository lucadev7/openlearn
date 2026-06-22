import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useStore } from "@/store/useStore";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { WhatsNew, hasUnseenChangelog } from "./WhatsNew";

export function Layout() {
  const location = useLocation();
  const setShowChangelog = useStore((s) => s.setShowChangelog);

  useEffect(() => {
    if (hasUnseenChangelog()) setShowChangelog(true);
  }, [setShowChangelog]);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-5xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <WhatsNew />
    </div>
  );
}

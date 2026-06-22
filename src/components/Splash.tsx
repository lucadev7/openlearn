import { motion } from "framer-motion";

export function Splash() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 grid place-items-center bg-bg"
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative grid h-20 w-20 place-items-center rounded-3xl text-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, rgb(110 100 255), rgb(20 200 160))" }}
        >
          OL
          <span
            className="absolute inset-0 animate-pulse-ring rounded-3xl"
            style={{ boxShadow: "0 0 0 2px rgb(110 100 255 / 0.5)" }}
          />
        </motion.div>
        <div className="text-center">
          <div className="text-lg font-semibold">OpenLearn</div>
          <div className="text-sm text-muted">wird geladen …</div>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full w-1/3 rounded-full bg-primary"
            animate={{ x: ["-130%", "330%"] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";

export function ComingSoon({
  phase,
  title,
  desc,
}: {
  phase: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card mx-auto max-w-2xl p-8 text-center"
      >
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles size={26} />
        </div>
        <div className="chip mx-auto mb-3 w-fit">
          <Lock size={12} /> Phase {phase}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{desc}</p>
        <p className="mx-auto mt-6 max-w-md text-sm text-muted/80">
          Diese Funktion ist im Plan vorgesehen und folgt in einer späteren Ausbaustufe. Der
          Lern-Kern (Karten anlegen & wiederholen) ist bereits voll nutzbar.
        </p>
      </motion.div>
    </div>
  );
}

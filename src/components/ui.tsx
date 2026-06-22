import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { useStore } from "@/store/useStore";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "text-lg px-5 py-3",
  };
  const variants = {
    primary: "bg-primary text-white shadow-glow hover:brightness-110 active:brightness-95",
    ghost: "text-text hover:bg-surface-2/70",
    subtle: "bg-surface-2/70 text-text border border-border/60 hover:border-primary/50",
    danger: "bg-danger/90 text-white hover:bg-danger",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition select-none",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GlassCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-5 w-5 animate-spin rounded-full border-2 border-border/70 border-t-primary",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-surface-2/60", className)} />;
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ol-border) / 0.6)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--ol-primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute text-xs font-semibold">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      {icon && <div className="mb-4 text-primary/80">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {desc && <p className="mt-1.5 max-w-md text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            onClick={() => dismiss(t.id)}
            className="glass flex items-start gap-3 rounded-xl p-3.5 text-left"
          >
            <span
              className={clsx(
                "mt-0.5 shrink-0",
                t.kind === "error" ? "text-danger" : t.kind === "success" ? "text-success" : "text-primary"
              )}
            >
              {t.kind === "error" ? <AlertCircle size={18} /> : t.kind === "success" ? <CheckCircle2 size={18} /> : <Info size={18} />}
            </span>
            <p className="text-sm text-text/90">{t.msg}</p>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

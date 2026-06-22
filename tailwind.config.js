/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors are driven by CSS variables (see src/styles/global.css).
      // A theme = a different set of --ol-* variables. <alpha-value> keeps
      // Tailwind's opacity modifiers (e.g. bg-surface/60) working.
      colors: {
        bg: "rgb(var(--ol-bg) / <alpha-value>)",
        surface: "rgb(var(--ol-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--ol-surface-2) / <alpha-value>)",
        border: "rgb(var(--ol-border) / <alpha-value>)",
        text: "rgb(var(--ol-text) / <alpha-value>)",
        muted: "rgb(var(--ol-muted) / <alpha-value>)",
        primary: "rgb(var(--ol-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--ol-primary-soft) / <alpha-value>)",
        accent: "rgb(var(--ol-accent) / <alpha-value>)",
        success: "rgb(var(--ol-success) / <alpha-value>)",
        warn: "rgb(var(--ol-warn) / <alpha-value>)",
        danger: "rgb(var(--ol-danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["InterVariable", "Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass: "0 8px 32px -8px rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
        "glass-lg": "0 20px 60px -12px rgb(0 0 0 / 0.5), inset 0 1px 0 0 rgb(255 255 255 / 0.08)",
        glow: "0 0 0 1px rgb(var(--ol-primary) / 0.35), 0 8px 30px -6px rgb(var(--ol-primary) / 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

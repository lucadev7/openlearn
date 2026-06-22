// Visual metadata for shop cosmetics. The backend owns the canonical catalog
// (ids, prices, ownership); the frontend maps ids to their preview look.

export interface ThemePreview {
  bg: string;
  primary: string;
  accent: string;
}

export const THEME_PREVIEW: Record<string, ThemePreview> = {
  aurora: { bg: "#0d101c", primary: "#818cf8", accent: "#2dd4bf" },
  paper: { bg: "#f4f5fa", primary: "#4f46e5", accent: "#0d9488" },
  midnight: { bg: "#080b14", primary: "#6082ff", accent: "#38bdf8" },
  sunset: { bg: "#1a1012", primary: "#fb923c", accent: "#f472b6" },
  forest: { bg: "#0a140f", primary: "#34d399", accent: "#a3e635" },
  ocean: { bg: "#08121a", primary: "#22d3ee", accent: "#2dd4bf" },
  rose: { bg: "#180e14", primary: "#f472b6", accent: "#fb9282" },
  mono: { bg: "#0c0c0e", primary: "#9ca3af", accent: "#96969e" },
  neon: { bg: "#07070c", primary: "#d946ef", accent: "#22d3ee" },
};

export interface AvatarLook {
  emoji: string;
  gradient: string;
}

export const AVATAR: Record<string, AvatarLook> = {
  ol: { emoji: "OL", gradient: "linear-gradient(135deg, rgb(110 100 255), rgb(20 200 160))" },
  fox: { emoji: "🦊", gradient: "linear-gradient(135deg,#fb923c,#f59e0b)" },
  rocket: { emoji: "🚀", gradient: "linear-gradient(135deg,#6366f1,#22d3ee)" },
  brain: { emoji: "🧠", gradient: "linear-gradient(135deg,#ec4899,#a855f7)" },
  owl: { emoji: "🦉", gradient: "linear-gradient(135deg,#8b5cf6,#3b82f6)" },
  lightning: { emoji: "⚡", gradient: "linear-gradient(135deg,#f59e0b,#facc15)" },
  sakura: { emoji: "🌸", gradient: "linear-gradient(135deg,#f472b6,#fb7185)" },
  crown: { emoji: "👑", gradient: "linear-gradient(135deg,#f5c542,#fb923c)" },
};

export const themePreviewOf = (id: string): ThemePreview =>
  THEME_PREVIEW[id] ?? THEME_PREVIEW.aurora;

export const avatarOf = (id: string): AvatarLook => AVATAR[id] ?? AVATAR.ol;

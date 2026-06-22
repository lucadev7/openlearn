import { create } from "zustand";

import { api, errMsg } from "@/lib/api";
import type { ProfileView, Settings } from "@/lib/types";

export interface Toast {
  id: number;
  kind: "info" | "success" | "error";
  msg: string;
}

interface AppStore {
  profile: ProfileView | null;
  settings: Settings | null;
  ready: boolean;

  init: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (p: ProfileView) => void;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  patchSettings: (patch: Partial<Settings>) => void;

  toasts: Toast[];
  toast: (msg: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;

  celebrate: boolean;
  setCelebrate: (v: boolean) => void;

  showChangelog: boolean;
  setShowChangelog: (v: boolean) => void;
}

let nextToastId = 1;

export const useStore = create<AppStore>((set, get) => ({
  profile: null,
  settings: null,
  ready: false,

  init: async () => {
    try {
      const [settings, profile] = await Promise.all([api.getSettings(), api.getProfile()]);
      set({ settings, profile, ready: true });
    } catch (e) {
      set({ ready: true });
      get().toast(errMsg(e), "error");
    }
  },

  refreshProfile: async () => {
    try {
      set({ profile: await api.getProfile() });
    } catch {
      /* keep last known profile */
    }
  },

  setProfile: (p) => set({ profile: p }),

  saveSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const next = { ...current, ...patch };
    set({ settings: next });
    try {
      await api.setSettings(next);
    } catch (e) {
      get().toast(errMsg(e), "error");
    }
  },

  // Update local settings only (the backend already persisted the change).
  patchSettings: (patch) => {
    const current = get().settings;
    if (current) set({ settings: { ...current, ...patch } });
  },

  toasts: [],
  toast: (msg, kind = "info") => {
    const id = nextToastId++;
    set({ toasts: [...get().toasts, { id, kind, msg }] });
    setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  celebrate: false,
  setCelebrate: (v) => set({ celebrate: v }),

  showChangelog: false,
  setShowChangelog: (v) => set({ showChangelog: v }),
}));

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Lock, Palette, Smile } from "lucide-react";

import { api, errMsg } from "@/lib/api";
import type { ShopItem, ShopView } from "@/lib/types";
import { avatarOf, themePreviewOf } from "@/lib/cosmetics";
import { useStore } from "@/store/useStore";
import { Button, GlassCard, Spinner } from "@/components/ui";

export default function Shop() {
  const toast = useStore((s) => s.toast);
  const patchSettings = useStore((s) => s.patchSettings);
  const refreshProfile = useStore((s) => s.refreshProfile);

  const [view, setView] = useState<ShopView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => api.shopList().then(setView).catch((e) => toast(errMsg(e), "error"));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = async (item: ShopItem) => {
    setBusy(item.id);
    try {
      setView(await api.shopBuy(item.id));
      refreshProfile();
      toast(`„${item.name}" gekauft!`, "success");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const equip = async (item: ShopItem) => {
    setBusy(item.id);
    try {
      setView(await api.shopEquip(item.id));
      patchSettings(item.kind === "theme" ? { theme: item.id } : { avatar: item.id });
      toast(`„${item.name}" ausgerüstet.`, "success");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(null);
    }
  };

  if (!view) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const themes = view.items.filter((i) => i.kind === "theme");
  const avatars = view.items.filter((i) => i.kind === "avatar");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shop</h1>
          <p className="text-muted">
            Coins fürs Lernen ausgeben — rein kosmetisch, kein Pay-to-Win.
          </p>
        </div>
        <div className="chip border-warn/40 px-3 py-2 text-base text-warn">
          <Coins size={18} /> <span className="font-semibold tabular-nums">{view.coins}</span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Palette size={18} className="text-primary" /> Themes
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              coins={view.coins}
              busy={busy === item.id}
              onBuy={() => buy(item)}
              onEquip={() => equip(item)}
              preview={<ThemeSwatch id={item.id} />}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Smile size={18} className="text-primary" /> Avatare
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {avatars.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              coins={view.coins}
              busy={busy === item.id}
              onBuy={() => buy(item)}
              onEquip={() => equip(item)}
              preview={<AvatarSwatch id={item.id} />}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeSwatch({ id }: { id: string }) {
  const p = themePreviewOf(id);
  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border/60"
      style={{ background: p.bg }}
    >
      <div className="flex gap-1">
        <span className="h-4 w-4 rounded-full" style={{ background: p.primary }} />
        <span className="h-4 w-4 rounded-full" style={{ background: p.accent }} />
      </div>
    </div>
  );
}

function AvatarSwatch({ id }: { id: string }) {
  const a = avatarOf(id);
  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-2xl font-bold text-white"
      style={{ background: a.gradient }}
    >
      {a.emoji}
    </div>
  );
}

function ItemCard({
  item,
  coins,
  busy,
  onBuy,
  onEquip,
  preview,
}: {
  item: ShopItem;
  coins: number;
  busy: boolean;
  onBuy: () => void;
  onEquip: () => void;
  preview: ReactNode;
}) {
  const canAfford = coins >= item.price;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className={`h-full ${item.equipped ? "border-primary/50" : ""}`}>
        <div className="flex items-start gap-3">
          {preview}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight">{item.name}</h3>
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          </div>
        </div>
        <div className="mt-4">
          {item.equipped ? (
            <Button variant="subtle" className="w-full" disabled>
              <Check size={16} /> Ausgerüstet
            </Button>
          ) : item.owned ? (
            <Button variant="subtle" className="w-full" onClick={onEquip} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : "Anwenden"}
            </Button>
          ) : (
            <Button className="w-full" onClick={onBuy} disabled={busy || !canAfford}>
              {busy ? (
                <Spinner className="h-4 w-4" />
              ) : canAfford ? (
                <>
                  <Coins size={16} /> {item.price}
                </>
              ) : (
                <>
                  <Lock size={14} /> {item.price}
                </>
              )}
            </Button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

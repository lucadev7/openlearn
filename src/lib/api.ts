import { invoke } from "@tauri-apps/api/core";
import type {
  Achievement,
  AiStatus,
  Card,
  CardInput,
  ChatMessage,
  ChatReply,
  Deck,
  DeckWithCounts,
  GeneratedCard,
  GradeResult,
  ImportSummary,
  ProfileView,
  Rating,
  ReviewOutcome,
  Settings,
  ShopView,
  Stats,
  StudyCard,
} from "./types";

export const api = {
  listDecks: () => invoke<DeckWithCounts[]>("content_list_decks"),
  getDeck: (id: string) => invoke<Deck>("content_get_deck", { id }),
  createDeck: (name: string, parentId: string | null = null) =>
    invoke<Deck>("content_create_deck", { name, parentId }),
  renameDeck: (id: string, name: string) =>
    invoke<Deck>("content_rename_deck", { id, name }),
  deleteDeck: (id: string) => invoke<void>("content_delete_deck", { id }),
  listCards: (deckId: string) =>
    invoke<Card[]>("content_list_cards", { deckId }),
  getCard: (id: string) => invoke<Card>("content_get_card", { id }),
  upsertCard: (input: CardInput) => invoke<Card>("content_upsert_card", { input }),
  setSuspended: (id: string, suspended: boolean) =>
    invoke<void>("content_set_suspended", { id, suspended }),
  deleteCard: (id: string) => invoke<void>("content_delete_card", { id }),

  getQueue: (deckId: string | null = null, newLimit: number | null = null) =>
    invoke<StudyCard[]>("study_get_queue", { deckId, newLimit }),
  submitReview: (cardId: string, rating: Rating) =>
    invoke<ReviewOutcome>("study_submit_review", { cardId, rating }),

  getProfile: () => invoke<ProfileView>("gam_get_profile"),
  getStats: () => invoke<Stats>("stats_get"),
  listAchievements: () => invoke<Achievement[]>("achievements_list"),

  shopList: () => invoke<ShopView>("shop_list"),
  shopBuy: (itemId: string) => invoke<ShopView>("shop_buy", { itemId }),
  shopEquip: (itemId: string) => invoke<ShopView>("shop_equip", { itemId }),

  examCards: (deckId: string | null, count: number) =>
    invoke<Card[]>("content_exam_cards", { deckId, count }),

  exportPack: (deckIds: string[] | null, path: string) =>
    invoke<void>("content_export_pack", { deckIds, path }),
  importPack: (path: string) => invoke<ImportSummary>("content_import_pack", { path }),
  importExample: () => invoke<ImportSummary>("content_import_example"),

  getSettings: () => invoke<Settings>("settings_get"),
  setSettings: (settings: Settings) => invoke<void>("settings_set", { settings }),

  backup: (path: string) => invoke<void>("data_backup", { path }),
  restore: (path: string) => invoke<void>("data_restore", { path }),

  aiStatus: () => invoke<AiStatus>("ai_get_status"),
  aiTestConnection: (provider: string) =>
    invoke<void>("ai_test_connection", { provider }),
  aiChat: (messages: ChatMessage[], provider?: string | null, model?: string | null) =>
    invoke<ChatReply>("ai_chat", { messages, provider: provider ?? null, model: model ?? null }),
  aiGenerateCards: (
    source: string,
    count: number,
    provider?: string | null,
    model?: string | null
  ) =>
    invoke<GeneratedCard[]>("ai_generate_cards", {
      source,
      count,
      provider: provider ?? null,
      model: model ?? null,
    }),
  aiGradeAnswer: (
    question: string,
    expected: string | null,
    answer: string,
    provider?: string | null,
    model?: string | null
  ) =>
    invoke<GradeResult>("ai_grade_answer", {
      question,
      expected,
      answer,
      provider: provider ?? null,
      model: model ?? null,
    }),
  secretSet: (provider: string, key: string) =>
    invoke<void>("secret_set_api_key", { provider, key }),
  secretHas: (provider: string) => invoke<boolean>("secret_has_api_key", { provider }),
  secretDelete: (provider: string) =>
    invoke<void>("secret_delete_api_key", { provider }),
};

export function errMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return String(e);
}

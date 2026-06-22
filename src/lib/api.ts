import { invoke } from "@tauri-apps/api/core";
import type {
  AiStatus,
  Card,
  CardInput,
  Deck,
  DeckWithCounts,
  ProfileView,
  Rating,
  ReviewOutcome,
  Settings,
  StudyCard,
} from "./types";

export const api = {
  listDecks: () => invoke<DeckWithCounts[]>("content_list_decks"),
  getDeck: (id: string) => invoke<Deck>("content_get_deck", { id }),
  createDeck: (name: string, parentId: string | null = null) =>
    invoke<Deck>("content_create_deck", { name, parent_id: parentId }),
  renameDeck: (id: string, name: string) =>
    invoke<Deck>("content_rename_deck", { id, name }),
  deleteDeck: (id: string) => invoke<void>("content_delete_deck", { id }),
  listCards: (deckId: string) =>
    invoke<Card[]>("content_list_cards", { deck_id: deckId }),
  getCard: (id: string) => invoke<Card>("content_get_card", { id }),
  upsertCard: (input: CardInput) => invoke<Card>("content_upsert_card", { input }),
  setSuspended: (id: string, suspended: boolean) =>
    invoke<void>("content_set_suspended", { id, suspended }),
  deleteCard: (id: string) => invoke<void>("content_delete_card", { id }),

  getQueue: (deckId: string | null = null, newLimit: number | null = null) =>
    invoke<StudyCard[]>("study_get_queue", { deck_id: deckId, new_limit: newLimit }),
  submitReview: (cardId: string, rating: Rating) =>
    invoke<ReviewOutcome>("study_submit_review", { card_id: cardId, rating }),

  getProfile: () => invoke<ProfileView>("gam_get_profile"),

  getSettings: () => invoke<Settings>("settings_get"),
  setSettings: (settings: Settings) => invoke<void>("settings_set", { settings }),

  aiStatus: () => invoke<AiStatus>("ai_get_status"),
  aiTestConnection: (provider: string) =>
    invoke<void>("ai_test_connection", { provider }),
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

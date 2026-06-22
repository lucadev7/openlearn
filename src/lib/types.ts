export interface Deck {
  id: string;
  parentId: string | null;
  name: string;
  taxonomyCode: string | null;
  area: number | null;
  position: number;
  createdAt: number;
  updatedAt: number;
}

export interface DeckWithCounts {
  id: string;
  parentId: string | null;
  name: string;
  taxonomyCode: string | null;
  area: number | null;
  position: number;
  total: number;
  due: number;
  newCount: number;
}

export type CardType =
  | "single"
  | "multi"
  | "truefalse"
  | "cloze"
  | "numeric"
  | "matching"
  | "ordering"
  | "short_text"
  | "essay"
  | "code_trace"
  | "sql_write";

export interface SinglePayload {
  options: string[];
  correct: number;
}
export interface MultiPayload {
  options: string[];
  correct: number[];
}
export interface TrueFalsePayload {
  answer: boolean;
}
export interface ClozePayload {
  answers: string[];
}
export interface NumericPayload {
  value: number;
  tolerance: number;
  unit?: string;
}

export type CardPayload =
  | SinglePayload
  | MultiPayload
  | TrueFalsePayload
  | ClozePayload
  | NumericPayload
  | Record<string, unknown>;

export interface Card {
  id: string;
  deckId: string;
  type: CardType | string;
  promptMd: string;
  explanationMd: string | null;
  payload: CardPayload;
  difficulty: number;
  origin: string;
  suspended: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CardInput {
  id?: string | null;
  deckId: string;
  type: CardType | string;
  promptMd: string;
  explanationMd?: string | null;
  payload: CardPayload;
  difficulty?: number;
}

export interface Schedule {
  cardId: string;
  due: number;
  state: string;
  reps: number;
  lapses: number;
  ease: number;
  intervalDays: number;
  lastReview: number | null;
}

export interface StudyCard {
  card: Card;
  schedule: Schedule;
  isNew: boolean;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface ProfileView {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  coins: number;
  streakCurrent: number;
  streakLongest: number;
  reviewsToday: number;
  dailyGoal: number;
  dueToday: number;
}

export interface ReviewOutcome {
  schedule: Schedule;
  xpAwarded: number;
  leveledUp: boolean;
  profile: ProfileView;
}

export interface Settings {
  theme: string;
  reducedMotion: boolean;
  dailyGoal: number;
  newCardsPerDay: number;
  language: string;
  defaultProvider: string | null;
  defaultModel: string | null;
  costConfirm: boolean;
  onboarded: boolean;
}

export interface ProviderStatus {
  id: string;
  label: string;
  configured: boolean;
}

export interface AiStatus {
  providers: ProviderStatus[];
  anyConfigured: boolean;
}

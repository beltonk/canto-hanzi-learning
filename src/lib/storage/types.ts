export interface AppSettings {
  soundOn: boolean;
  soundCategories: { music: boolean; voice: boolean; effect: boolean };
  kidMode: boolean;
  language: 'zh-HK' | 'en';
  theme: 'light' | 'dark';
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  freezes: number;
  stickers: string[];
  garden: string[];
  quests: {
    today: Array<{ id: string; progress: number; target: number; done: boolean }>;
    lastRefreshDay: string;
  };
}

export interface CharacterMasteryRecord {
  state: 'unseen' | 'introduced' | 'practiced' | 'mastered';
  lastSeen: number; // timestamp ms
  wins: number;
  distinctDaysWon: number;
  lastWinDay: string;
  due: number; // timestamp ms for SRS
  intervalIndex: number; // index into SRS_INTERVALS
}

export interface ActivityLogEntry {
  type: 'trace' | 'flashcard' | 'game' | 'dictation' | 'decompose' | 'explore';
  char?: string;
  gameId?: string;
  items?: string[];
  stars?: number;
  durationMs?: number;
  at: number; // timestamp ms
}

export interface FavoriteEntry {
  /** The character or word that was saved */
  text: string;
  /** Kind of favorite — single character vs multi-character word */
  kind: 'char' | 'word';
  /** Optional context: where the user added it from (e.g. 'dictation', 'flashcard', 'game:radical-detective') */
  source?: string;
  /** Optional jyutping if known at save time */
  jyutping?: string;
  /** Optional reason — typically 'mistake' for items added after a wrong answer */
  reason?: 'mistake' | 'manual';
  /** Times the user has reviewed this favorite */
  reviewCount: number;
  /** Last review timestamp ms */
  lastReviewedAt?: number;
  /** Created timestamp ms */
  addedAt: number;
}

export interface ProgressState {
  characters: Record<string, CharacterMasteryRecord>;
  log: ActivityLogEntry[];
  /** User's "我的收藏" — favorites collection of characters / words */
  favorites: FavoriteEntry[];
}

export interface RootSchema {
  schemaVersion: number;
  settings: AppSettings;
  gamification: GamificationState;
  progress: ProgressState;
}

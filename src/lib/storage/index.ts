import type { RootSchema, AppSettings, GamificationState, ProgressState, ActivityLogEntry, CharacterMasteryRecord, FavoriteEntry } from './types';

const STORAGE_KEY = 'cantoHanzi.v1';

const DEFAULT_SETTINGS: AppSettings = {
  soundOn: true,
  soundCategories: { music: true, voice: true, effect: true },
  kidMode: true,
  language: 'zh-HK',
  theme: 'light',
};

const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDay: '',
  freezes: 0,
  stickers: [],
  garden: [],
  quests: { today: [], lastRefreshDay: '' },
};

const DEFAULT_PROGRESS: ProgressState = {
  characters: {},
  log: [],
  favorites: [],
};

const DEFAULT_ROOT: RootSchema = {
  schemaVersion: 2,
  settings: DEFAULT_SETTINGS,
  gamification: DEFAULT_GAMIFICATION,
  progress: DEFAULT_PROGRESS,
};

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
const migrations: Record<number, Migration> = {
  // 0 → 1: first version
  0: (data) => ({ ...data, schemaVersion: 1 }),
  // 1 → 2: add favorites collection to progress
  1: (data) => {
    const progress = (data.progress as Record<string, unknown> | undefined) ?? {};
    return {
      ...data,
      schemaVersion: 2,
      progress: { ...progress, favorites: progress.favorites ?? [] },
    };
  },
};

function applyMigrations(data: Record<string, unknown>): RootSchema {
  let version = (data.schemaVersion as number) ?? 0;
  while (version < 2) {
    const migration = migrations[version];
    if (!migration) break;
    data = migration(data);
    version = (data.schemaVersion as number) ?? version + 1;
  }
  return data as unknown as RootSchema;
}

export function loadRoot(): RootSchema {
  if (typeof window === 'undefined') return { ...DEFAULT_ROOT };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ROOT };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = applyMigrations(parsed);
    // Merge defaults to handle partial schemas
    return {
      schemaVersion: migrated.schemaVersion ?? 2,
      settings: { ...DEFAULT_SETTINGS, ...migrated.settings },
      gamification: { ...DEFAULT_GAMIFICATION, ...migrated.gamification },
      progress: { ...DEFAULT_PROGRESS, ...migrated.progress },
    };
  } catch {
    return { ...DEFAULT_ROOT };
  }
}

export function saveRoot(data: RootSchema): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage quota exceeded – silently ignore
  }
}

export function updateSettings(settings: Partial<AppSettings>): void {
  const root = loadRoot();
  saveRoot({ ...root, settings: { ...root.settings, ...settings } });
}

export function updateGamification(gamification: Partial<GamificationState>): void {
  const root = loadRoot();
  saveRoot({ ...root, gamification: { ...root.gamification, ...gamification } });
}

export function updateProgress(progress: Partial<ProgressState>): void {
  const root = loadRoot();
  saveRoot({ ...root, progress: { ...root.progress, ...progress } });
}

export type { AppSettings, GamificationState, ProgressState, RootSchema, ActivityLogEntry, CharacterMasteryRecord, FavoriteEntry };

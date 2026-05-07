import type { FullCharacterData, IndexEntry } from '@/types/fullCharacter';
import type React from 'react';

export type MascotId = 'panda' | 'rabbit' | 'monkey' | 'owl' | 'cat' | 'tiger';

export interface GameManifest {
  id: string;
  title: { 'zh-HK': string; en: string };
  description: { 'zh-HK': string; en: string };
  mascot: MascotId;
  color: string;
  colorVar: string;
  emoji?: string;
  musicId?: string;
  /** @deprecated unlock removed; all games available */
  minLevel?: number;
  recommendedItemCount: number;
}

export interface GameItem {
  character: string;
  jyutping: string;
  meaning?: string;
  radical?: string;
  /** Optional pool of multi-char words this character appears in */
  words?: string[];
}

export interface GameProps {
  items: GameItem[];
  onResult: (result: GameResult) => void;
  onPause?: () => void;
}

export interface GameResult {
  stars: 1 | 2 | 3;
  correctCount: number;
  totalCount: number;
  durationMs: number;
}

export interface GameModule {
  manifest: GameManifest;
  Component: React.ComponentType<GameProps>;
}

export function toGameItem(char: FullCharacterData): GameItem {
  const words = [
    ...(char.stage1Words ?? []).map(w => w.word),
    ...(char.stage2Words ?? []).map(w => w.word),
  ];
  return {
    character: char.character,
    jyutping: char.jyutping,
    meaning: words[0],
    radical: char.radical,
    words,
  };
}

export function indexToGameItem(entry: IndexEntry): GameItem {
  return {
    character: entry.character,
    jyutping: entry.jyutping,
    radical: entry.radical,
  };
}

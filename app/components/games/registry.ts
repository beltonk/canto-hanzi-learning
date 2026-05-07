import type { GameModule } from './types';
import dynamic from 'next/dynamic';

const COLORS = {
  coral:  '#ef4444',
  sky:    '#0ea5e9',
  mint:   '#10b981',
  golden: '#f59e0b',
  grape:  '#8b5cf6',
  bubble: '#ec4899',
  indigo: '#6366f1',
  teal:   '#14b8a6',
};

export const GAME_REGISTRY: GameModule[] = [
  {
    manifest: {
      id: 'match-up',
      title: { 'zh-HK': '配對王', en: 'Match-Up' },
      description: { 'zh-HK': '翻牌配對字與粵拼', en: 'Flip cards to match characters and jyutping' },
      mascot: 'panda',
      color: 'coral',
      colorVar: COLORS.coral,
      emoji: '🐼',
      recommendedItemCount: 12,
    },
    Component: dynamic(() => import('./MatchUp'), { ssr: false }),
  },
  {
    manifest: {
      id: 'whack-a-hanzi',
      title: { 'zh-HK': '打地鼠', en: 'Whack-a-Hanzi' },
      description: { 'zh-HK': '快速點擊正確的字！', en: 'Tap the correct character fast!' },
      mascot: 'monkey',
      color: 'golden',
      colorVar: COLORS.golden,
      emoji: '🐵',
      recommendedItemCount: 20,
    },
    Component: dynamic(() => import('./WhackAHanzi'), { ssr: false }),
  },
  {
    manifest: {
      id: 'character-rain',
      title: { 'zh-HK': '落字雨', en: 'Character Rain' },
      description: { 'zh-HK': '接住正確的字，不要讓它掉到地上！', en: 'Catch the correct falling characters!' },
      mascot: 'rabbit',
      color: 'sky',
      colorVar: COLORS.sky,
      emoji: '🐰',
      recommendedItemCount: 15,
    },
    Component: dynamic(() => import('./CharacterRain'), { ssr: false }),
  },
  {
    manifest: {
      id: 'word-builder',
      title: { 'zh-HK': '拼字工坊', en: 'Word Builder' },
      description: { 'zh-HK': '排列字元，組成詞語！', en: 'Arrange tiles to build words!' },
      mascot: 'owl',
      color: 'mint',
      colorVar: COLORS.mint,
      emoji: '🦉',
      recommendedItemCount: 10,
    },
    Component: dynamic(() => import('./WordBuilder'), { ssr: false }),
  },
  {
    manifest: {
      id: 'sentence-garden',
      title: { 'zh-HK': '造句樂園', en: 'Sentence Garden' },
      description: { 'zh-HK': '排出正確的句子，種出花園！', en: 'Arrange words to form sentences!' },
      mascot: 'rabbit',
      color: 'teal',
      colorVar: COLORS.teal,
      emoji: '🌸',
      recommendedItemCount: 10,
    },
    Component: dynamic(() => import('./SentenceGarden'), { ssr: false }),
  },
  {
    manifest: {
      id: 'tone-bingo',
      title: { 'zh-HK': '聲調賓果', en: 'Tone Bingo' },
      description: { 'zh-HK': '聽字找字，賓果！', en: 'Listen and mark – get BINGO!' },
      mascot: 'tiger',
      color: 'bubble',
      colorVar: COLORS.bubble,
      emoji: '🐯',
      recommendedItemCount: 30,
    },
    Component: dynamic(() => import('./ToneBingo'), { ssr: false }),
  },
  {
    manifest: {
      id: 'radical-detective',
      title: { 'zh-HK': '拆字偵探', en: 'Radical Detective' },
      description: { 'zh-HK': '找出所有含目標部首的字！', en: 'Find all characters with the target radical!' },
      mascot: 'owl',
      color: 'grape',
      colorVar: COLORS.grape,
      emoji: '🔍',
      recommendedItemCount: 25,
    },
    Component: dynamic(() => import('./RadicalDetective'), { ssr: false }),
  },
  {
    manifest: {
      id: 'stroke-racer',
      title: { 'zh-HK': '太空寫字', en: 'Stroke Racer' },
      description: { 'zh-HK': '與時間賽跑，盡快寫好筆順！', en: 'Race the clock with stroke order!' },
      mascot: 'cat',
      color: 'indigo',
      colorVar: COLORS.indigo,
      emoji: '🚀',
      recommendedItemCount: 8,
    },
    Component: dynamic(() => import('./StrokeRacer'), { ssr: false }),
  },
];

export function getGameById(id: string): GameModule | undefined {
  return GAME_REGISTRY.find(g => g.manifest.id === id);
}

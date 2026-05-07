import type { SoundCategory } from './AudioEngine';

export interface SoundEntry {
  src: string;
  category: SoundCategory;
}

export const SOUND_REGISTRY: Record<string, SoundEntry> = {
  'ui.tap':         { src: '/sounds/_initial/ui-tap.mp3',       category: 'ui' },
  'ui.error':       { src: '/sounds/_initial/ui-error.mp3',      category: 'ui' },
  'success.chime':  { src: '/sounds/_initial/success-chime.mp3', category: 'effect' },
  'failure.soft':   { src: '/sounds/_initial/failure-soft.mp3',  category: 'effect' },
  'levelup':        { src: '/sounds/_initial/levelup.mp3',       category: 'effect' },
  'confetti.burst': { src: '/sounds/_initial/confetti-burst.mp3',category: 'effect' },
  'brush.loop':     { src: '/sounds/_initial/brush-loop.mp3',    category: 'effect' },
  // Mascot voices (lazy-loaded per-activity)
  'voice.praise.three_stars': { src: '/sounds/voice/three-stars.mp3', category: 'voice' },
  'voice.praise.good':        { src: '/sounds/voice/good.mp3',        category: 'voice' },
  'voice.retry':              { src: '/sounds/voice/retry.mp3',       category: 'voice' },
  'voice.levelup':            { src: '/sounds/voice/levelup.mp3',     category: 'voice' },
};

# Audio System

## Overview

The audio system uses the Web Audio API wrapped in `AudioEngine` (`src/lib/audio/AudioEngine.ts`). All sound playback goes through this singleton, so the global mute and per-category volume controls work consistently across every activity.

## Architecture

### AudioEngine

Singleton accessed via `getAudioEngine()`. Key features:
- **Lazy `AudioContext`**: created on the first user gesture to comply with browser autoplay policies.
- **4 GainNode channels**: `ui`, `voice`, `music`, `effect` — each independently mutable.
- **Fallback**: if Web Audio API is unavailable, falls back to `<audio>` element per sound.
- **Music ducking**: when `voice()` or `speakTTS()` plays, the `music` gain is automatically reduced to `DUCK_RATIO (0.3)` and restored when the voice ends.

### `speakTTS(text, lang, rate)`

Routes text-to-speech through the `AudioEngine` so it respects:
- `settings.soundOn` (global mute)
- `settings.soundCategories.voice` (voice channel mute)
- Music ducking

Usage:
```ts
const audio = useAudio();
audio.speakTTS('你好');                  // defaults: zh-HK @ rate 0.5 (kid-friendly slow)
audio.speakTTS('你好', 'zh-HK', 0.5);
audio.speakTTS('hello', 'en-US', 0.9);
```

> **Default rate**: `0.5` — half of the `SpeechSynthesis` neutral of `1.0`,
> tuned for primary-school learners. Every callsite in this codebase passes
> `0.5` by policy. Override only with strong justification.

## Sound Registry

`src/lib/audio/registry.ts` maps sound IDs to `{ src, category }`.

### Initial Sounds (required at startup)

Located in `public/sounds/_initial/`. Must not exceed **500 KB** total (checked by `npm run check:assets`).

| ID | File | Category | Description |
|----|------|----------|-------------|
| `ui.tap` | `tap.mp3` | ui | Button tap feedback |
| `ui.error` | `error.mp3` | ui | Error feedback |
| `success.chime` | `chime.mp3` | effect | Correct answer |
| `failure.soft` | `failure.mp3` | effect | Incorrect answer |
| `levelup` | `levelup.mp3` | effect | Level up celebration |
| `confetti.burst` | `confetti.mp3` | effect | Confetti celebration |
| `brush.loop` | `brush.mp3` | effect | Stroke tracing loop sound |

### Voice Lines (loaded on demand)

Located in `public/sounds/voice/`. Not counted against the 500 KB budget since they are loaded lazily.

Format: `mascot-{id}-{pose}.mp3` (e.g., `mascot-panda-happy.mp3`)

## Adding New Sounds

1. Add the `.mp3` file to `public/sounds/_initial/` (for sounds needed at startup) or `public/sounds/voice/` (for voice lines loaded on demand).
2. Add an entry to `SOUND_REGISTRY` in `src/lib/audio/registry.ts`:
   ```ts
   'my.new.sound': { src: '/sounds/_initial/my-sound.mp3', category: 'effect' },
   ```
3. Call `audio.play('my.new.sound')` from any component.

## React Integration

Use `useAudio()` from `src/lib/audio/context.tsx` to access the engine:

```tsx
import { useAudio } from '@/lib/audio/context';

function MyComponent() {
  const audio = useAudio();
  
  return (
    <button onClick={() => audio.play('ui.tap')}>
      Tap me
    </button>
  );
}
```

The `AudioProvider` is mounted at the root in `app/layout.tsx` and syncs engine settings from localStorage on mount.

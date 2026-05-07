'use client';
import React from 'react';

export type MascotId = 'panda' | 'rabbit' | 'monkey' | 'owl' | 'cat' | 'tiger';
export type MascotPose = 'idle' | 'happy' | 'cheer' | 'oops';

interface IllustrationEntry {
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  darkSrc?: string;
}

// Mascot emojis used as SVG text fallbacks until real assets exist
const MASCOT_EMOJIS: Record<MascotId, string> = {
  panda: '🐼', rabbit: '🐰', monkey: '🐵', owl: '🦉', cat: '🐱', tiger: '🐯',
};

// Registry: ids → asset entries
// Real PNGs go in public/illustrations/; stub = empty src (renders emoji fallback)
const registry: Record<string, IllustrationEntry> = {};

// Populate mascot stubs
const MASCOTS: MascotId[] = ['panda', 'rabbit', 'monkey', 'owl', 'cat', 'tiger'];
const POSES: MascotPose[] = ['idle', 'happy', 'cheer', 'oops'];
for (const mascot of MASCOTS) {
  for (const pose of POSES) {
    const id = `${mascot}_${pose}`;
    registry[id] = {
      src: `/illustrations/mascots/${id}.png`,
      intrinsicWidth: 200,
      intrinsicHeight: 200,
    };
  }
}

// Garden plants
for (let i = 1; i <= 10; i++) {
  registry[`garden_plant_${i}`] = {
    src: `/illustrations/garden/plant_${i}.png`,
    intrinsicWidth: 80,
    intrinsicHeight: 120,
  };
}

// Stickers (20 stubs)
for (let i = 1; i <= 20; i++) {
  registry[`sticker_${i}`] = {
    src: `/illustrations/stickers/sticker_${i}.png`,
    intrinsicWidth: 80,
    intrinsicHeight: 80,
  };
}

export function getIllustration(id: string): IllustrationEntry | undefined {
  return registry[id];
}

interface IllustrationProps {
  id: string;
  pose?: MascotPose;
  size?: number;
  className?: string;
  alt?: string;
}

export function Illustration({ id, pose, size = 80, className, alt }: IllustrationProps) {
  const key = pose ? `${id}_${pose}` : id;
  const entry = registry[key] ?? registry[id];
  const mascotId = id as MascotId;
  const emoji = MASCOT_EMOJIS[mascotId];

  if (!entry || !entry.src) {
    // Fallback: emoji or grey box
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[var(--color-peach)] ${className ?? ''}`}
        style={{ width: size, height: size, fontSize: size * 0.65 }}
        role="img"
        aria-label={alt ?? key}
      >
        {emoji ?? '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.src}
      alt={alt ?? key}
      width={size}
      height={size}
      className={className}
      onError={(e) => {
        // On 404, show emoji fallback
        const target = e.currentTarget;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent && emoji) {
          parent.textContent = emoji;
          parent.style.fontSize = `${size * 0.65}px`;
        }
      }}
    />
  );
}

export default Illustration;

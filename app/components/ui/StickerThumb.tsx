'use client';
import React from 'react';

interface StickerThumbProps {
  id: string;
  unlocked: boolean;
  isNew?: boolean;
  size?: number;
}

const STICKER_EMOJIS = ['⭐', '🌟', '💫', '✨', '🎯', '🏆', '🥇', '🎪', '🎨', '🎭',
  '🦋', '🌈', '🎉', '🎊', '🎁', '🎀', '💎', '🔮', '🌙', '☀️'];

export default function StickerThumb({ id, unlocked, isNew, size = 60 }: StickerThumbProps) {
  const idx = parseInt(id.replace('sticker_', '')) - 1;
  const emoji = STICKER_EMOJIS[idx % STICKER_EMOJIS.length];

  return (
    <div className="relative">
      <div
        className={`rounded-2xl border-2 flex items-center justify-center transition-all ${
          unlocked
            ? 'bg-[var(--color-golden-light)] border-[var(--color-golden)] hover:scale-110'
            : 'bg-[var(--color-peach)] border-[var(--card-border)] opacity-40 grayscale'
        }`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {unlocked ? emoji : '🔒'}
      </div>
      {isNew && unlocked && (
        <span className="absolute -top-1 -right-1 bg-[var(--color-coral)] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      )}
    </div>
  );
}

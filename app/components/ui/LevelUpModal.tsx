'use client';
import React from 'react';
import Mascot from './Mascot';

interface LevelUpModalProps {
  newLevel: number;
  newStickers: string[];
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, newStickers, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-[var(--card-bg)] rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 animate-pop"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">🎉</div>
        <Mascot id="tiger" pose="cheer" size={80} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
          升到 Level {newLevel}！
        </h2>
        <p className="text-[var(--color-gray)] mb-4">恭喜！繼續加油！</p>
        {newStickers.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-[var(--color-gray)] mb-2">解鎖貼紙！</p>
            <div className="flex justify-center gap-2 text-3xl">
              {newStickers.map(s => <span key={s}>⭐</span>)}
            </div>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[var(--color-golden)] text-[var(--color-charcoal)] font-bold text-lg hover:bg-[var(--color-golden-dark)] transition-colors"
        >
          太棒了！繼續！
        </button>
      </div>
    </div>
  );
}

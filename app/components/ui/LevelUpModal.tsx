'use client';
import React, { useEffect } from 'react';
import Mascot from './Mascot';

interface LevelUpModalProps {
  newLevel: number;
  newStickers: string[];
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, newStickers, onClose }: LevelUpModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="升級通知"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      onClick={onClose}
    >
      <div
        /* xs: full-width sheet; sm+: centered card */
        className="bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl text-center
                   w-full sm:max-w-sm sm:mx-4 animate-pop"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-200 rounded mx-auto mb-4 sm:hidden" />
        <div className="text-6xl mb-4">🎉</div>
        <Mascot id="tiger" pose="cheer" size={80} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">升到 Level {newLevel}！</h2>
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
          autoFocus
          className="w-full py-3 rounded-2xl bg-[var(--color-golden)] text-[var(--color-charcoal)] font-bold text-lg
                     hover:bg-[var(--color-golden-dark)] active:scale-[0.98] transition-all
                     focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
        >
          太棒了！繼續！
        </button>
      </div>
    </div>
  );
}

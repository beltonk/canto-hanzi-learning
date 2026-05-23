'use client';

import React, { useEffect, useState, useRef } from 'react';
import Mascot from '@/app/components/ui/Mascot';
import ConfettiBurst from '@/app/components/ui/ConfettiBurst';
import { useAudio } from '@/src/lib/audio/context';
import type { GameResult, GameManifest } from './types';

interface ResultScreenProps {
  result: GameResult;
  manifest: GameManifest;
  onPlayAgain: () => void;
  onNextGame?: () => void;
  onExit: () => void;
}

const XP_FOR_STARS: Record<1 | 2 | 3, number> = { 1: 5, 2: 10, 3: 20 };
const CONFETTI_COUNT: Record<1 | 2 | 3, number> = { 1: 25, 2: 55, 3: 90 };

export default function ResultScreen({ result, manifest, onPlayAgain, onNextGame, onExit }: ResultScreenProps) {
  const audio = useAudio();
  const xpEarned = XP_FOR_STARS[result.stars];
  const starDisplay = ['⭐', '⭐⭐', '⭐⭐⭐'][result.stars - 1];
  const pose = result.stars === 3 ? 'cheer' : result.stars === 2 ? 'happy' : 'oops';
  const [showConfetti, setShowConfetti] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowConfetti(true);
    audio.playVictoryFanfare(result.stars);
    // Focus the primary action on mount
    primaryRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes; Tab cycles focus within the dialog (lightweight focus trap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onExit]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${manifest.title['zh-HK']} 完成`}
      /* Three-variant sizing:
         - Phone portrait: full-screen sheet (100dvh, edge-to-edge)
         - Phone landscape (≤md): bottom-sheet feel (max-h 90dvh, internal scroll)
         - iPad+ (md and up): centered card with comfortable max-width */
      className="relative flex flex-col items-center gap-5 sm:gap-6 px-5 py-6 sm:p-8 text-center
                 max-h-[100dvh] max-md:landscape:max-h-[90dvh] md:max-w-lg md:mx-auto md:rounded-3xl
                 overflow-y-auto"
      style={{ paddingBottom: 'max(24px, var(--safe-bottom))' }}
    >
      <ConfettiBurst show={showConfetti} count={CONFETTI_COUNT[result.stars]} />
      <Mascot id={manifest.mascot} pose={pose} size={100} />
      <div>
        <div className="text-5xl mb-3">{starDisplay}</div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {result.stars === 3 ? '完美！' : result.stars === 2 ? '很好！' : '繼續努力！'}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm md:max-w-md">
        <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3">
          <div className="text-xl font-bold text-amber-600">+{xpEarned}</div>
          <div className="text-xs text-slate-600 mt-0.5">經驗值</div>
        </div>
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3">
          <div className="text-xl font-bold text-emerald-600">{result.correctCount}/{result.totalCount}</div>
          <div className="text-xs text-slate-600 mt-0.5">正確</div>
        </div>
        <div className="bg-sky-100 border border-sky-300 rounded-2xl p-3">
          <div className="text-xl font-bold text-sky-600">{Math.round(result.durationMs / 1000)}秒</div>
          <div className="text-xs text-slate-600 mt-0.5">用時</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs md:max-w-sm">
        <button
          ref={primaryRef}
          onClick={onPlayAgain}
          className="py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white min-h-11"
        >
          再玩一次
        </button>
        {onNextGame && (
          <button
            onClick={onNextGame}
            className="py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white min-h-11"
          >
            下一個遊戲
          </button>
        )}
        <button
          onClick={onExit}
          className="py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 min-h-11"
        >
          返回樂園
        </button>
      </div>
    </div>
  );
}

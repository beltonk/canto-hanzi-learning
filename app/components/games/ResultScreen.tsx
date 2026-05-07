'use client';

import React, { useEffect, useState } from 'react';
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
// Particle counts scale with stars so a perfect run feels noticeably bigger.
const CONFETTI_COUNT: Record<1 | 2 | 3, number> = { 1: 25, 2: 55, 3: 90 };

export default function ResultScreen({ result, manifest, onPlayAgain, onNextGame, onExit }: ResultScreenProps) {
  const audio = useAudio();
  const xpEarned = XP_FOR_STARS[result.stars];
  const starDisplay = ['⭐', '⭐⭐', '⭐⭐⭐'][result.stars - 1];
  const pose = result.stars === 3 ? 'cheer' : result.stars === 2 ? 'happy' : 'oops';
  const [showConfetti, setShowConfetti] = useState(false);

  // Celebrate game completion: confetti rain + happy musical fanfare.
  // Intensity scales with star rating so a 1-star "you tried" still gets
  // a small, gentle celebration rather than nothing.
  useEffect(() => {
    setShowConfetti(true);
    audio.playVictoryFanfare(result.stars);
    // We only want this to fire once per result mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-6 p-8 text-center">
      <ConfettiBurst show={showConfetti} count={CONFETTI_COUNT[result.stars]} />
      <Mascot id={manifest.mascot} pose={pose} size={100} />
      <div>
        <div className="text-5xl mb-3">{starDisplay}</div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {result.stars === 3 ? '完美！' : result.stars === 2 ? '很好！' : '繼續努力！'}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
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
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={onPlayAgain}
          className="py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          再玩一次
        </button>
        {onNextGame && (
          <button
            onClick={onNextGame}
            className="py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all"
          >
            下一個遊戲
          </button>
        )}
        <button
          onClick={onExit}
          className="py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          返回樂園
        </button>
      </div>
    </div>
  );
}

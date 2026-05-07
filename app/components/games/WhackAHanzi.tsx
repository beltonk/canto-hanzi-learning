'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameProps } from './types';

const HOLES = 9;
const ROUND_COUNT = 20;
const BASE_POP_INTERVAL = 1800; // ms
const MIN_POP_INTERVAL = 700;

const HOLE_VISUALS = [
  { ground: 'from-amber-300 to-amber-500', emoji: '🌱' },
  { ground: 'from-emerald-300 to-emerald-500', emoji: '🌿' },
  { ground: 'from-lime-300 to-lime-500',     emoji: '🍃' },
  { ground: 'from-orange-300 to-orange-500', emoji: '🪨' },
];

export default function WhackAHanzi({ items, onResult }: GameProps) {
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [active, setActive] = useState<number[]>([]);
  const [holeChars, setHoleChars] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [pulse, setPulse] = useState<{ hole: number; type: 'hit' | 'miss' } | null>(null);
  const startRef = useRef(0);
  const roundRef = useRef(0);
  const doneRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const tappedThisRoundRef = useRef(false);

  const nextRound = useCallback(() => {
    if (doneRef.current) return;
    const r = roundRef.current + 1;
    roundRef.current = r;
    setRound(r);

    if (r > ROUND_COUNT) {
      doneRef.current = true;
      const stars: 1 | 2 | 3 = scoreRef.current >= ROUND_COUNT * 0.8 ? 3 : scoreRef.current >= ROUND_COUNT * 0.5 ? 2 : 1;
      onResult({
        stars,
        correctCount: scoreRef.current,
        totalCount: ROUND_COUNT,
        durationMs: Date.now() - startRef.current,
      });
      return;
    }

    // Penalize combo if last round wasn't tapped
    if (!tappedThisRoundRef.current && r > 1) {
      comboRef.current = 0;
      setCombo(0);
    }
    tappedThisRoundRef.current = false;

    const targetItem = items[Math.floor(Math.random() * items.length)];
    setCurrentTarget(targetItem.character);

    // Increase number of decoys as the game progresses
    const baseHoles = 3 + Math.floor(r / 5);
    const holeCount = Math.min(7, baseHoles + Math.floor(Math.random() * 2));

    const holes: number[] = [];
    holes.push(Math.floor(Math.random() * HOLES));
    while (holes.length < holeCount) {
      const h = Math.floor(Math.random() * HOLES);
      if (!holes.includes(h)) holes.push(h);
    }
    setActive(holes);

    const chars: Record<number, string> = {};
    const others = items.filter(i => i.character !== targetItem.character);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    holes.forEach((hole, idx) => {
      chars[hole] = idx === 0 ? targetItem.character : (shuffledOthers[idx - 1]?.character ?? targetItem.character);
    });
    setHoleChars(chars);
  }, [items, onResult]);

  // Re-schedule with shrinking interval as combo / round grows.
  // We separate the "first round" trigger from the "schedule next tick"
  // so React StrictMode can re-mount safely:
  //  - `initedRef` ensures `nextRound()` runs at most once on mount.
  //  - The recurring timer is always (re)scheduled by the effect, so the
  //    cleanup of the first effect doesn't leave us without a timer.
  const initedRef = useRef(false);
  useEffect(() => {
    if (items.length === 0) return;
    if (!initedRef.current) {
      initedRef.current = true;
      startRef.current = Date.now();
      nextRound();
    }

    const tick = () => {
      if (doneRef.current) return;
      nextRound();
      const interval = Math.max(
        MIN_POP_INTERVAL,
        BASE_POP_INTERVAL - roundRef.current * 50 - comboRef.current * 30,
      );
      intervalRef.current = setTimeout(tick, interval);
    };
    intervalRef.current = setTimeout(tick, BASE_POP_INTERVAL);

    return () => { if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; } };
  }, [items, nextRound]);

  const handleTap = useCallback((hole: number) => {
    if (tappedThisRoundRef.current) return;
    if (holeChars[hole] === currentTarget) {
      tappedThisRoundRef.current = true;
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      const bonus = Math.floor(newCombo / 3);
      const newScore = scoreRef.current + 1 + bonus;
      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(newCombo);
      setBestCombo(b => Math.max(b, newCombo));
      setActive([]);
      setPulse({ hole, type: 'hit' });
      setTimeout(() => setPulse(null), 350);
    } else {
      // Wrong hole — break combo
      comboRef.current = 0;
      setCombo(0);
      setPulse({ hole, type: 'miss' });
      setTimeout(() => setPulse(null), 350);
    }
  }, [holeChars, currentTarget]);

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3 bg-gradient-to-b from-amber-50 to-emerald-50 rounded-b-3xl">
      {/* HUD */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 text-sm sm:text-base">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">目標</span>
          <span className="font-chinese text-3xl sm:text-4xl font-bold text-rose-600 bg-white px-3 py-0.5 rounded-xl border-2 border-rose-300 shadow-md">
            {currentTarget || '—'}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">分數</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{score}</div>
        </div>
      </div>

      <div className="w-full max-w-md flex items-center justify-between text-xs sm:text-sm text-slate-600">
        <span>第 {Math.min(round, ROUND_COUNT)} / {ROUND_COUNT} 題</span>
        {combo >= 2 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 font-bold animate-pulse">
            🔥 連擊 x{combo}
          </span>
        )}
        <span>最高連擊 <strong>{bestCombo}</strong></span>
      </div>

      {/* Field */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm w-full">
        {Array.from({ length: HOLES }, (_, i) => {
          const visual = HOLE_VISUALS[i % HOLE_VISUALS.length];
          const isActive = active.includes(i);
          const isHit = pulse?.hole === i && pulse.type === 'hit';
          const isMiss = pulse?.hole === i && pulse.type === 'miss';
          return (
            <button
              key={i}
              onClick={() => isActive && handleTap(i)}
              className={`relative aspect-square rounded-2xl font-chinese text-3xl sm:text-4xl font-bold flex items-center justify-center border-2 transition-all overflow-hidden shadow-md ${
                isActive
                  ? 'bg-white border-amber-400 hover:scale-105 active:scale-95 cursor-pointer animate-pop'
                  : 'border-transparent cursor-default'
              } ${isHit ? 'ring-4 ring-emerald-400' : ''} ${isMiss ? 'ring-4 ring-rose-400' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${visual.ground} ${isActive ? 'opacity-30' : 'opacity-100'}`} />
              <div className="relative">
                {isActive ? (
                  <span className="text-slate-900 drop-shadow-sm">{holeChars[i] ?? ''}</span>
                ) : (
                  <span className="text-2xl opacity-70">{visual.emoji}</span>
                )}
              </div>
              {isHit && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-3xl animate-pop">✓</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">點擊跟「目標」一樣的字！速度會越來越快 🚀</p>
    </div>
  );
}

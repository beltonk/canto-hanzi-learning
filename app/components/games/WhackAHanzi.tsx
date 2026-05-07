'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameProps } from './types';
import { useAudio } from '@/lib/audio/context';
import CorrectBurst from '@/app/components/ui/CorrectBurst';

const HOLES = 9;
const ROUND_COUNT = 20;
const BASE_POP_INTERVAL = 2200; // ms — start slower for a more relaxed feel
const MIN_POP_INTERVAL = 900;   // don't go crazy fast

const HOLE_VISUALS = [
  { ground: 'from-amber-300 to-amber-500', emoji: '🌱' },
  { ground: 'from-emerald-300 to-emerald-500', emoji: '🌿' },
  { ground: 'from-lime-300 to-lime-500',     emoji: '🍃' },
  { ground: 'from-orange-300 to-orange-500', emoji: '🪨' },
];

export default function WhackAHanzi({ items, onResult }: GameProps) {
  const audio = useAudio();
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [active, setActive] = useState<number[]>([]);
  const [holeChars, setHoleChars] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [pulse, setPulse] = useState<{ hole: number; type: 'hit' | 'miss' } | null>(null);
  const [burstHole, setBurstHole] = useState<number | null>(null);
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
      audio.playCorrect();
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
      setBurstHole(hole);
      setTimeout(() => { setPulse(null); setBurstHole(null); }, 600);
    } else {
      // Wrong hole — break combo
      audio.playIncorrect();
      comboRef.current = 0;
      setCombo(0);
      setPulse({ hole, type: 'miss' });
      setTimeout(() => setPulse(null), 400);
    }
  }, [holeChars, currentTarget]);

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3 bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 rounded-b-3xl">
      {/* HUD */}
      <div className="w-full max-w-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">目標</span>
          <span className="font-chinese text-4xl sm:text-5xl font-bold text-rose-600 bg-white px-3 py-1 rounded-2xl border-2 border-rose-300 shadow-md">
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

      {/* Mole field */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm w-full">
        {Array.from({ length: HOLES }, (_, i) => {
          const visual = HOLE_VISUALS[i % HOLE_VISUALS.length];
          const isActive = active.includes(i);
          const isHit  = pulse?.hole === i && pulse.type === 'hit';
          const isMiss = pulse?.hole === i && pulse.type === 'miss';
          return (
            <div key={i} className="relative aspect-square select-none">
              {/* Hole pit — always visible earthy oval */}
              <div className={`absolute inset-x-1 bottom-0 h-[55%] rounded-full bg-gradient-to-b ${visual.ground} shadow-inner border-2 border-amber-600/30`} />

              {/* Mole / character — clips behind the bottom edge of the hole */}
              <div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                style={{ clipPath: 'inset(0 0 0 0 round 16px)' }}
              >
                <button
                  onClick={() => isActive && handleTap(i)}
                  disabled={!isActive}
                  aria-label={isActive ? holeChars[i] : undefined}
                  className={[
                    'absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-1',
                    'font-chinese text-3xl sm:text-4xl font-bold transition-all',
                    'focus:outline-none',
                    isActive
                      ? 'cursor-pointer active:scale-95'
                      : 'pointer-events-none',
                  ].join(' ')}
                  style={{
                    height: '90%',
                    transform: isActive
                      ? isHit ? 'translateY(0%) scaleY(0.75)' : 'translateY(0%)'
                      : 'translateY(105%)',
                    transition: isActive
                      ? isHit ? 'transform 0.08s ease-in' : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'
                      : 'transform 0.15s ease-in',
                  }}
                >
                  {/* Character bubble */}
                  <div className={[
                    'w-[78%] aspect-square rounded-full flex items-center justify-center shadow-lg border-4',
                    'transition-colors duration-150',
                    isHit  ? 'bg-emerald-400 border-emerald-600 text-white' :
                    isMiss ? 'bg-rose-400 border-rose-600 text-white' :
                    'bg-amber-100 border-amber-400 text-slate-900',
                  ].join(' ')}>
                    <span className="drop-shadow-sm leading-none">
                      {holeChars[i] ?? ''}
                    </span>
                  </div>
                  {/* Hammer hit effect */}
                  {isHit && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-3xl pointer-events-none"
                         style={{ animation: 'hammerDrop 0.25s ease-out forwards' }}>
                      🔨
                    </div>
                  )}
                  {burstHole === i && <CorrectBurst show={true} />}
                </button>
              </div>

              {/* Miss flash overlay */}
              {isMiss && (
                <div className="absolute inset-0 rounded-2xl bg-rose-400/30 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">點擊跟「目標」一樣的字！速度會越來越快 🚀</p>

      {/* Inline keyframe for hammer drop */}
      <style>{`
        @keyframes hammerDrop {
          0%   { transform: translate(-50%, -60%) rotate(-30deg); opacity: 1; }
          40%  { transform: translate(-50%, 20%) rotate(10deg); }
          60%  { transform: translate(-50%, 10%) rotate(5deg); }
          100% { transform: translate(-50%, -80%) rotate(-20deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

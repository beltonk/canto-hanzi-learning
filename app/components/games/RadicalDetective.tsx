'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addFavorite } from '@/lib/favorites';
import type { GameProps, GameItem } from './types';

const TIME_PER_ROUND = 20;
const TOTAL_ROUNDS = 4;
const GRID_SIZE = 8;     // 2x4 board
const TARGETS_PER_ROUND = 4; // exactly 4 right answers, 4 distractors

interface RoundData {
  radical: string;
  grid: Array<{ char: string; isTarget: boolean }>;
  totalTargets: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(items: GameItem[], excludeRadicals: string[]): RoundData | null {
  const byRadical = new Map<string, GameItem[]>();
  items.forEach(i => {
    if (!i.radical) return;
    if (excludeRadicals.includes(i.radical)) return;
    const arr = byRadical.get(i.radical) ?? [];
    arr.push(i);
    byRadical.set(i.radical, arr);
  });
  // Pick a radical that has at least TARGETS_PER_ROUND members so the round is solvable.
  const candidates = Array.from(byRadical.entries()).filter(([, arr]) => arr.length >= TARGETS_PER_ROUND);
  if (candidates.length === 0) return null;
  const [radical, sameRadicalItems] = shuffle(candidates)[0];
  const targets = shuffle(sameRadicalItems).slice(0, TARGETS_PER_ROUND);
  const others = shuffle(items.filter(i => i.radical !== radical));
  const distractors = others.slice(0, GRID_SIZE - targets.length);
  const gridItems = shuffle([...targets, ...distractors]);
  return {
    radical,
    grid: gridItems.map(i => ({ char: i.character, isTarget: i.radical === radical })),
    totalTargets: targets.length,
  };
}

export default function RadicalDetective({ items, onResult }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState<RoundData | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [falseClicks, setFalseClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [transitioning, setTransitioning] = useState(false);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const totalCorrectRef = useRef(0);
  const totalPossibleRef = useRef(0);
  const totalFalseClicksRef = useRef(0);
  const usedRadicalsRef = useRef<string[]>([]);

  // Build round on mount and when roundIdx changes.
  // Use a ref guard so React StrictMode (double-invoke effects) doesn't build the round twice.
  const builtRoundIdxRef = useRef<number>(-1);
  useEffect(() => {
    if (items.length < GRID_SIZE) return;
    if (builtRoundIdxRef.current === roundIdx) return;
    builtRoundIdxRef.current = roundIdx;
    const r = buildRound(items, usedRadicalsRef.current);
    if (!r) {
      doneRef.current = true;
      const correct = totalCorrectRef.current;
      const possible = Math.max(1, totalPossibleRef.current);
      const ratio = correct / possible;
      const stars: 1 | 2 | 3 = totalFalseClicksRef.current === 0 && ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
      onResult({ stars, correctCount: correct, totalCount: possible, durationMs: Date.now() - startRef.current });
      return;
    }
    usedRadicalsRef.current = [...usedRadicalsRef.current, r.radical];
    totalPossibleRef.current += r.totalTargets;
    setRound(r);
    setFound(new Set());
    setFalseClicks(0);
    setTimeLeft(TIME_PER_ROUND);
    setTransitioning(false);
    if (roundIdx === 0) startRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, items.length]);

  const finishRound = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    totalCorrectRef.current += found.size;
    totalFalseClicksRef.current += falseClicks;
    setTimeout(() => {
      if (roundIdx + 1 >= TOTAL_ROUNDS || doneRef.current) {
        doneRef.current = true;
        const correct = totalCorrectRef.current;
        const possible = totalPossibleRef.current;
        const ratio = correct / possible;
        const stars: 1 | 2 | 3 =
          totalFalseClicksRef.current === 0 && ratio >= 0.9 ? 3 :
          ratio >= 0.6 ? 2 : 1;
        onResult({ stars, correctCount: correct, totalCount: possible, durationMs: Date.now() - startRef.current });
      } else {
        setRoundIdx(r => r + 1);
      }
    }, 700);
  }, [found.size, falseClicks, roundIdx, transitioning, onResult]);

  // Per-round countdown — drive from a local ref so StrictMode double-invoke is safe.
  useEffect(() => {
    if (doneRef.current || !round || transitioning) return;
    let remaining = TIME_PER_ROUND;
    setTimeLeft(remaining);
    const t = setInterval(() => {
      remaining -= 1;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(t);
        finishRound();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [round, transitioning, finishRound]);

  const handleClick = useCallback((idx: number) => {
    if (!round || transitioning || doneRef.current || found.has(idx)) return;
    if (round.grid[idx]?.isTarget) {
      const newFound = new Set(found);
      newFound.add(idx);
      setFound(newFound);
      if (newFound.size >= round.totalTargets) {
        // round complete early — full score for this round
        finishRound();
      }
    } else {
      setFalseClicks(f => f + 1);
      // Auto-save misclicked characters to favorites so the user can review them
      const wrongChar = round.grid[idx]?.char;
      if (wrongChar) {
        addFavorite({
          text: wrongChar,
          kind: 'char',
          source: 'game:radical-detective',
          reason: 'mistake',
        });
      }
    }
  }, [round, transitioning, found, finishRound]);

  if (!round) {
    return <div className="p-6 text-center text-slate-600">準備案件中…</div>;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
      {/* HUD */}
      <div className="w-full max-w-md flex items-center justify-between text-sm">
        <span className="text-slate-700">第 <strong>{roundIdx + 1}</strong> / {TOTAL_ROUNDS} 案</span>
        <span className={`font-bold tabular-nums ${timeLeft <= 8 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {/* Mission card */}
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 text-white p-4 text-center shadow-lg">
        <div className="text-xs text-white/80 mb-1">🔍 找出 8 個字中含此部首的 4 個字</div>
        <div className="font-chinese text-5xl sm:text-6xl font-bold leading-none">{round.radical}</div>
        <div className="text-sm mt-2">
          已找到 <strong className="text-yellow-300 text-base">{found.size}</strong> / {round.totalTargets}
          {falseClicks > 0 && <span className="ml-3 text-rose-200">錯誤 {falseClicks}</span>}
        </div>
      </div>

      {/* Round dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full ${i < roundIdx ? 'bg-emerald-500' : i === roundIdx ? 'bg-violet-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* Grid: 4x2 — exactly 4 right answers among 8 cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
        {round.grid.map((item, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={found.has(i) || transitioning}
            className={`aspect-square rounded-xl font-chinese text-2xl sm:text-3xl font-bold border-2 flex items-center justify-center transition-all shadow-sm ${
              found.has(i)
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-600 text-white scale-95'
                : transitioning
                ? (item.isTarget ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400')
                : 'bg-white border-slate-200 text-slate-900 hover:border-violet-400 hover:bg-violet-50 active:scale-95'
            }`}
          >
            {item.char}
          </button>
        ))}
      </div>
    </div>
  );
}

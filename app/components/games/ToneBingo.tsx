'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAudio } from '@/lib/audio/context';
import FavoriteButton from '@/app/components/ui/FavoriteButton';
import type { GameProps } from './types';

const BOARD_SIZE = 8;        // 4x2 board
const TARGETS_PER_ROUND = 4; // exactly 4 of the 8 cards must be marked
const TOTAL_ROUNDS = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BoardCell {
  character: string;
  jyutping: string;
  isTarget: boolean;
}

interface RoundData {
  cells: BoardCell[];
  callOrder: number[]; // indices into cells, only the targets, in shuffled order
}

function buildRound(items: { character: string; jyutping: string }[]): RoundData | null {
  const eligible = items.filter(i => i.character && i.jyutping);
  if (eligible.length < BOARD_SIZE) return null;
  const picked = shuffle(eligible).slice(0, BOARD_SIZE);
  const targetIdxs = shuffle(picked.map((_, i) => i)).slice(0, TARGETS_PER_ROUND);
  const targetSet = new Set(targetIdxs);
  const cells: BoardCell[] = picked.map((c, i) => ({
    character: c.character,
    jyutping: c.jyutping,
    isTarget: targetSet.has(i),
  }));
  return {
    cells,
    callOrder: shuffle(targetIdxs),
  };
}

export default function ToneBingo({ items, onResult }: GameProps) {
  const audio = useAudio();
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState<RoundData | null>(null);
  const [callPos, setCallPos] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [missCount, setMissCount] = useState(0);
  const [pulse, setPulse] = useState<{ idx: number; type: 'hit' | 'miss' } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const totalCorrectRef = useRef(0);
  const totalMissRef = useRef(0);

  // Memoize a stable list signature so the build effect doesn't churn.
  const itemsKey = useMemo(() => items.map(i => i.character).join('|'), [items]);

  const builtRoundIdxRef = useRef(-1);
  useEffect(() => {
    if (items.length < BOARD_SIZE) return;
    if (builtRoundIdxRef.current === roundIdx) return;
    builtRoundIdxRef.current = roundIdx;
    const r = buildRound(items);
    if (!r) {
      doneRef.current = true;
      return;
    }
    if (roundIdx === 0) startRef.current = Date.now();
    setRound(r);
    setMarked(new Set());
    setMissCount(0);
    setCallPos(0);
    setTransitioning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, itemsKey]);

  const currentTarget = round && callPos < round.callOrder.length
    ? round.cells[round.callOrder[callPos]]
    : null;

  // Auto-pronounce on each new call
  useEffect(() => {
    if (!currentTarget || doneRef.current || transitioning) return;
    const t = setTimeout(() => audio.speakTTS(currentTarget.character, 'zh-HK', 0.8), 250);
    return () => clearTimeout(t);
  }, [currentTarget, audio, transitioning]);

  const finishRound = useCallback((correctCount: number, misses: number) => {
    if (doneRef.current || transitioning) return;
    setTransitioning(true);
    totalCorrectRef.current += correctCount;
    totalMissRef.current += misses;
    setTimeout(() => {
      const nextRoundIdx = roundIdx + 1;
      if (nextRoundIdx >= TOTAL_ROUNDS) {
        doneRef.current = true;
        const correct = totalCorrectRef.current;
        const possible = TOTAL_ROUNDS * TARGETS_PER_ROUND;
        const m = totalMissRef.current;
        const ratio = correct / possible;
        const stars: 1 | 2 | 3 = m === 0 && ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
        onResult({ stars, correctCount: correct, totalCount: possible, durationMs: Date.now() - startRef.current });
      } else {
        setRoundIdx(nextRoundIdx);
      }
    }, 900);
  }, [roundIdx, transitioning, onResult]);

  const handleTap = useCallback((idx: number) => {
    if (!round || !currentTarget || doneRef.current || transitioning) return;
    if (marked.has(idx)) return;
    const cell = round.cells[idx];
    if (cell.character === currentTarget.character) {
      const newMarked = new Set(marked);
      newMarked.add(idx);
      setMarked(newMarked);
      setPulse({ idx, type: 'hit' });
      setTimeout(() => setPulse(null), 350);
      if (newMarked.size >= TARGETS_PER_ROUND) {
        finishRound(newMarked.size, missCount);
      } else {
        setCallPos(p => p + 1);
      }
    } else {
      setMissCount(c => c + 1);
      setPulse({ idx, type: 'miss' });
      setTimeout(() => setPulse(null), 350);
    }
  }, [round, currentTarget, marked, missCount, transitioning, finishRound]);

  const handleSkip = useCallback(() => {
    if (!round || doneRef.current || transitioning) return;
    if (callPos >= round.callOrder.length - 1) {
      finishRound(marked.size, missCount + 1);
    } else {
      setCallPos(p => p + 1);
      setMissCount(c => c + 1);
    }
  }, [round, callPos, marked.size, missCount, transitioning, finishRound]);

  const handleReplay = useCallback(() => {
    if (currentTarget) audio.speakTTS(currentTarget.character, 'zh-HK', 0.8);
  }, [currentTarget, audio]);

  if (items.length < BOARD_SIZE) {
    return (
      <div className="p-6 text-center text-slate-600">
        <div className="text-5xl mb-2">🎲</div>
        需要至少 {BOARD_SIZE} 個字才能玩賓果！
      </div>
    );
  }

  if (!round) {
    return <div className="p-6 text-center text-slate-600">準備中…</div>;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
      {/* HUD */}
      <div className="w-full max-w-md flex items-center justify-between text-sm">
        <span className="text-slate-700">第 <strong>{roundIdx + 1}</strong> / {TOTAL_ROUNDS} 局</span>
        <span className="text-slate-700">已配對 <strong className="text-fuchsia-600">{marked.size}</strong> / {TARGETS_PER_ROUND}</span>
        <span className="text-slate-700">失誤 <strong className={missCount > 2 ? 'text-rose-600' : ''}>{missCount}</strong></span>
      </div>

      {/* Caller card */}
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white p-4 text-center shadow-lg">
        <div className="text-xs text-white/80 mb-1">🔊 聽發音 · 在 8 個字中找出對應的字（共 4 個）</div>
        {currentTarget ? (
          <>
            <div className="font-mono text-3xl font-bold tracking-widest">{currentTarget.jyutping}</div>
            <div className="text-xs text-white/70 mt-1">第 {callPos + 1} / {TARGETS_PER_ROUND} 個</div>
          </>
        ) : (
          <div className="text-base font-medium">準備中…</div>
        )}
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={handleReplay}
            className="px-4 py-1.5 rounded-xl bg-white/25 backdrop-blur text-white text-sm font-semibold hover:bg-white/40 active:scale-95"
          >
            🔊 再聽一次
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-1.5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 active:scale-95"
          >
            ⏭ 跳過
          </button>
        </div>
      </div>

      {/* Round dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full ${i < roundIdx ? 'bg-emerald-500' : i === roundIdx ? 'bg-fuchsia-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* Board: 4x2 — exactly 4 right answers among 8 cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
        {round.cells.map((cell, i) => {
          const isMarked = marked.has(i);
          const isHit = pulse?.idx === i && pulse.type === 'hit';
          const isMiss = pulse?.idx === i && pulse.type === 'miss';
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={isMarked || transitioning}
              className={`aspect-square rounded-xl font-chinese text-3xl sm:text-4xl font-bold border-2 flex items-center justify-center transition-all shadow-sm ${
                isMarked
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-600 text-white scale-95'
                  : transitioning
                  ? (cell.isTarget ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400')
                  : 'bg-white border-slate-200 text-slate-900 hover:border-fuchsia-400 hover:bg-fuchsia-50 active:scale-95'
              } ${isHit ? 'ring-4 ring-emerald-400' : ''} ${isMiss ? 'ring-4 ring-rose-400 animate-wiggle' : ''}`}
            >
              {isMarked ? '✓' : cell.character}
            </button>
          );
        })}
      </div>

      {currentTarget && missCount > 0 && (
        <div className="w-full max-w-md flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>下次想複習這個字？</span>
          <FavoriteButton
            text={currentTarget.character}
            kind="char"
            jyutping={currentTarget.jyutping}
            source="game:tone-bingo"
            reason="mistake"
            variant="chip"
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

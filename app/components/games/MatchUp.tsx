'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GameProps } from './types';

type MatchMode = 'jyutping' | 'meaning' | 'radical';

interface Tile {
  id: string;
  content: string;
  charId: string;
  type: 'char' | 'match';
  matched: boolean;
}

const MODE_INFO: Record<MatchMode, { label: string; emoji: string }> = {
  jyutping: { label: '配對粵拼', emoji: '🔡' },
  meaning:  { label: '配對詞語', emoji: '📚' },
  radical:  { label: '配對部首', emoji: '🧩' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTiles(items: GameProps['items'], mode: MatchMode, count: number): Tile[] {
  const eligible = items.filter(i => {
    if (mode === 'jyutping') return Boolean(i.jyutping);
    if (mode === 'meaning')  return Boolean(i.meaning);
    if (mode === 'radical')  return Boolean(i.radical);
    return false;
  });
  const selected = shuffle(eligible).slice(0, count);
  const tilePairs: Tile[] = [];
  selected.forEach((item, i) => {
    const matchContent =
      mode === 'jyutping' ? item.jyutping :
      mode === 'meaning'  ? (item.meaning ?? '') :
      (item.radical ?? '');
    tilePairs.push(
      { id: `char-${i}`,  content: item.character, charId: `pair-${i}`, type: 'char',  matched: false },
      { id: `match-${i}`, content: matchContent,   charId: `pair-${i}`, type: 'match', matched: false },
    );
  });
  return shuffle(tilePairs);
}

const MODES: MatchMode[] = ['jyutping', 'meaning', 'radical'];
const TOTAL_ROUNDS = 3;
const PAIRS_PER_ROUND = 6;

export default function MatchUp({ items, onResult }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const mode = MODES[roundIdx];
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const startRef = useRef(0);
  const processingRef = useRef(false);
  const incorrectFlipsRef = useRef(0);
  const cumulativeMatchedRef = useRef(0);

  // Build a fresh board per round
  const eligibleCount = useMemo(() => {
    return items.filter(i => {
      if (mode === 'jyutping') return Boolean(i.jyutping);
      if (mode === 'meaning')  return Boolean(i.meaning);
      if (mode === 'radical')  return Boolean(i.radical);
      return false;
    }).length;
  }, [items, mode]);

  const pairsThisRound = Math.min(PAIRS_PER_ROUND, Math.floor(eligibleCount));

  useEffect(() => {
    if (items.length < 2 || pairsThisRound === 0) return;
    Promise.resolve().then(() => {
      setTiles(buildTiles(items, mode, pairsThisRound));
      setMatched(0);
      setFlipped([]);
      processingRef.current = false;
      if (roundIdx === 0) startRef.current = Date.now();
    });
  }, [items, mode, pairsThisRound, roundIdx]);

  const handleFlip = useCallback((tileId: string) => {
    if (processingRef.current) return;
    if (flipped.includes(tileId) || flipped.length >= 2) return;
    const newFlipped = [...flipped, tileId];
    setFlipped(newFlipped);
    if (newFlipped.length !== 2) return;

    processingRef.current = true;
    setTimeout(() => {
      const a = tiles.find(t => t.id === newFlipped[0]);
      const b = tiles.find(t => t.id === newFlipped[1]);
      if (a && b && a.charId === b.charId) {
        const updated = tiles.map(t =>
          t.id === a.id || t.id === b.id ? { ...t, matched: true } : t,
        );
        setTiles(updated);
        const newMatchedCount = updated.filter(t => t.matched).length / 2;
        setMatched(newMatchedCount);
        if (newMatchedCount >= pairsThisRound) {
          cumulativeMatchedRef.current += newMatchedCount;
          setTimeout(() => {
            if (roundIdx + 1 >= TOTAL_ROUNDS) {
              const totalPairs = TOTAL_ROUNDS * PAIRS_PER_ROUND;
              const f = incorrectFlipsRef.current;
              const stars: 1 | 2 | 3 = f === 0 ? 3 : f <= 4 ? 2 : 1;
              onResult({
                stars,
                correctCount: cumulativeMatchedRef.current,
                totalCount: totalPairs,
                durationMs: Date.now() - startRef.current,
              });
            } else {
              setRoundIdx(r => r + 1);
            }
          }, 800);
        }
      } else {
        incorrectFlipsRef.current += 1;
        setTotalIncorrect(t => t + 1);
      }
      setFlipped([]);
      processingRef.current = false;
    }, 800);
  }, [flipped, tiles, pairsThisRound, roundIdx, onResult]);

  const cols = pairsThisRound * 2 <= 8 ? 4 : 6;

  if (tiles.length === 0) {
    return <div className="p-6 text-center text-slate-600">準備字卡中…</div>;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
      {/* Round header */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{MODE_INFO[mode].emoji}</span>
          <div>
            <div className="text-base font-bold text-slate-900">{MODE_INFO[mode].label}</div>
            <div className="text-xs text-slate-500">第 {roundIdx + 1} / {TOTAL_ROUNDS} 回合</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">已配對</div>
          <div className="text-xl font-bold text-emerald-600 tabular-nums">{matched}/{pairsThisRound}</div>
        </div>
      </div>

      {/* Round dots */}
      <div className="flex gap-1.5">
        {MODES.map((_m, i) => (
          <div
            key={i}
            className={`h-1.5 w-10 rounded-full transition-all ${
              i < roundIdx ? 'bg-emerald-500' : i === roundIdx ? 'bg-indigo-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Board */}
      <div
        className="grid gap-2 w-full max-w-md"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {tiles.map(tile => {
          const isFlipped = flipped.includes(tile.id) || tile.matched;
          return (
            <button
              key={tile.id}
              onClick={() => !tile.matched && handleFlip(tile.id)}
              disabled={tile.matched}
              className={`aspect-square rounded-xl font-bold flex items-center justify-center transition-all border-2 shadow-sm ${
                tile.matched
                  ? 'bg-emerald-500 border-emerald-600 text-white scale-95'
                  : isFlipped
                  ? (tile.type === 'char'
                    ? 'bg-rose-500 border-rose-600 text-white font-chinese text-2xl sm:text-3xl scale-105'
                    : 'bg-sky-500 border-sky-600 text-white text-sm sm:text-base scale-105')
                  : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 text-amber-700 hover:scale-105 active:scale-95'
              }`}
            >
              {isFlipped ? (
                tile.matched ? '✓' : <span className={tile.type === 'match' ? 'px-1 break-all leading-tight' : ''}>{tile.content}</span>
              ) : (
                <span className="text-xl">?</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">
        點擊兩張卡片配對！失誤次數：<span className={totalIncorrect > 4 ? 'text-rose-500 font-semibold' : 'text-slate-700'}>{totalIncorrect}</span>
      </p>
    </div>
  );
}

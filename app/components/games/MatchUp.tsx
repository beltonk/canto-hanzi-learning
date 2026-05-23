'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GameProps } from './types';
import { useAudio } from '@/lib/audio/context';
import CorrectBurst from '@/app/components/ui/CorrectBurst';

type MatchMode = 'jyutping' | 'meaning' | 'radical';

interface Tile {
  id: string;
  content: string;
  charId: string;
  type: 'char' | 'match';
  matched: boolean;
}

const MODE_INFO: Record<MatchMode, {
  label: string; emoji: string;
  bgClass: string;       // game wrapper background
  charBg: string;        // face-up char tile colours
  matchBg: string;       // face-up match tile colours
  matchedBg: string;     // matched tile colours
  accentText: string;    // HUD accent
}> = {
  jyutping: {
    label: '配對粵拼', emoji: '🔡',
    bgClass:    'from-indigo-100 via-purple-50 to-pink-50',
    charBg:     'bg-rose-500 border-rose-600 text-white',
    matchBg:    'bg-indigo-500 border-indigo-600 text-white',
    matchedBg:  'bg-emerald-500 border-emerald-600 text-white',
    accentText: 'text-indigo-600',
  },
  meaning:  {
    label: '配對詞語', emoji: '📚',
    bgClass:    'from-sky-100 via-cyan-50 to-teal-50',
    charBg:     'bg-fuchsia-500 border-fuchsia-600 text-white',
    matchBg:    'bg-sky-500 border-sky-600 text-white',
    matchedBg:  'bg-emerald-500 border-emerald-600 text-white',
    accentText: 'text-sky-600',
  },
  radical:  {
    label: '配對部首', emoji: '🧩',
    bgClass:    'from-amber-100 via-orange-50 to-yellow-50',
    charBg:     'bg-orange-500 border-orange-600 text-white',
    matchBg:    'bg-amber-500 border-amber-600 text-white',
    matchedBg:  'bg-emerald-500 border-emerald-600 text-white',
    accentText: 'text-amber-600',
  },
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
  const audio = useAudio();
  const [roundIdx, setRoundIdx] = useState(0);
  const mode = MODES[roundIdx];
  const modeInfo = MODE_INFO[mode];
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [shakePair, setShakePair] = useState<string | null>(null);
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

    // Auto-pronounce jyutping when a phonics tile is revealed (jyutping mode only)
    if (mode === 'jyutping') {
      const tile = tiles.find(t => t.id === tileId);
      if (tile?.type === 'match') {
        // tile.content is the jyutping string — speak the *character* it represents
        // Find the paired char tile to get the character
        const paired = tiles.find(t => t.charId === tile.charId && t.type === 'char');
        if (paired) audio.speakTTS(paired.content, 'zh-HK', 0.5);
      }
    }

    if (newFlipped.length !== 2) return;

    processingRef.current = true;
    setTimeout(() => {
      const a = tiles.find(t => t.id === newFlipped[0]);
      const b = tiles.find(t => t.id === newFlipped[1]);
      if (a && b && a.charId === b.charId) {
        audio.playCorrect();
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 600);
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
        audio.playIncorrect();
        incorrectFlipsRef.current += 1;
        setTotalIncorrect(t => t + 1);
        setShakePair(newFlipped[0]);
        setTimeout(() => setShakePair(null), 400);
      }
      setFlipped([]);
      processingRef.current = false;
    }, 800);
  }, [audio, flipped, mode, tiles, pairsThisRound, roundIdx, onResult]);

  const cols = pairsThisRound * 2 <= 8 ? 4 : 6;

  if (tiles.length === 0) {
    return <div className="p-6 text-center text-slate-600">準備字卡中…</div>;
  }

  return (
    <div className={`p-3 sm:p-4 flex flex-col items-center gap-3 bg-gradient-to-br ${modeInfo.bgClass} rounded-b-3xl`}>
      {/* Round header */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{modeInfo.emoji}</span>
          <div>
            <div className={`text-base font-bold ${modeInfo.accentText}`}>{modeInfo.label}</div>
            <div className="text-xs text-slate-500">第 {roundIdx + 1} / {TOTAL_ROUNDS} 回合</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">已配對</div>
            <div className={`text-xl font-bold tabular-nums ${modeInfo.accentText}`}>{matched}/{pairsThisRound}</div>
          </div>
          {totalIncorrect > 0 && (
            <div className="text-right">
              <div className="text-xs text-slate-500">失誤</div>
              <div className={`text-xl font-bold tabular-nums ${totalIncorrect > 4 ? 'text-rose-500' : 'text-slate-600'}`}>{totalIncorrect}</div>
            </div>
          )}
        </div>
      </div>

      {/* Round progress dots */}
      <div className="flex gap-2 items-center">
        {MODES.map((_m, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i < roundIdx ? 'w-10 bg-emerald-500' :
              i === roundIdx ? 'w-14 bg-indigo-500 shadow-md' :
              'w-10 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs font-semibold">
        <span className={`px-2 py-0.5 rounded-full ${modeInfo.charBg}`}>漢字</span>
        <span className={`px-2 py-0.5 rounded-full ${modeInfo.matchBg}`}>
          {mode === 'jyutping' ? '粵拼 🔊' : mode === 'meaning' ? '詞語' : '部首'}
        </span>
      </div>

      {/* Board */}
      <div
        className="relative grid gap-2 sm:gap-3 md:gap-4 w-full max-w-md md:max-w-xl"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        <CorrectBurst show={showBurst} />
        {tiles.map(tile => {
          const isFlipped = flipped.includes(tile.id) || tile.matched;
          const faceUpClass = tile.matched
            ? modeInfo.matchedBg
            : tile.type === 'char'
              ? modeInfo.charBg
              : modeInfo.matchBg;
          const shake = shakePair && (tile.id === shakePair || flipped.includes(tile.id));
          return (
            <button
              key={tile.id}
              onClick={() => !tile.matched && handleFlip(tile.id)}
              disabled={tile.matched}
              className={[
                'aspect-square rounded-2xl font-bold flex items-center justify-center',
                'border-2 shadow-md transition-all duration-200 select-none',
                isFlipped
                  ? `${faceUpClass} ${tile.matched ? 'scale-90' : 'scale-105 shadow-lg'}`
                  : 'bg-white/80 border-white text-slate-400 hover:scale-105 hover:bg-white active:scale-95 cursor-pointer',
                shake ? 'animate-incorrect-shake' : '',
              ].join(' ')}
            >
              {isFlipped ? (
                tile.matched ? (
                  <span className="text-2xl">✓</span>
                ) : (
                  <span className={[
                    tile.type === 'char'
                      ? 'font-chinese text-2xl sm:text-3xl leading-none'
                      : 'text-xs sm:text-sm px-1 break-all leading-tight text-center',
                  ].join(' ')}>
                    {tile.content}
                  </span>
                )
              ) : (
                <span className="text-2xl">🀫</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">
        找出配對的漢字和{mode === 'jyutping' ? '粵拼' : mode === 'meaning' ? '詞語' : '部首'}！
      </p>
    </div>
  );
}

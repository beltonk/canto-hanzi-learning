'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudio } from '@/lib/audio/context';
import CorrectBurst from '@/app/components/ui/CorrectBurst';
import type { GameProps } from './types';
import { useElementSize } from '@/lib/viewport/useElementSize';

const ROUND_COUNT = 8;

interface BuildRound {
  word: string;
  hintChar: string;
  hintJyutping: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WordBuilder({ items, onResult }: GameProps) {
  const audio = useAudio();
  const rounds = useMemo<BuildRound[]>(() => {
    // Quick character → jyutping lookup so we can recover a valid hint when
    // the upstream lexicon associates a word with a character that isn't
    // actually in it (variant / simplified-traditional / related-word
    // entries — e.g. 份 → 分量, 什 → 甚麼). About 10% of word entries hit
    // this case and the old code blindly used i.character as the hint,
    // producing a 線索字 that was nowhere in the target word.
    const charToJyutping = new Map<string, string>();
    items.forEach(i => charToJyutping.set(i.character, i.jyutping));

    const candidates: BuildRound[] = [];
    items.forEach(i => {
      (i.words ?? []).forEach(w => {
        if (w.length < 2 || w.length > 5) return;
        if (!/^[\u4e00-\u9fff]+$/.test(w)) return;

        let hintChar = i.character;
        let hintJyutping = i.jyutping;
        if (!w.includes(hintChar)) {
          // Recover: pick any character in the word for which we know the
          // jyutping. If we can't, this round would mislead the kid — drop it.
          const recovered = w.split('').find(c => charToJyutping.has(c));
          if (!recovered) return;
          hintChar = recovered;
          hintJyutping = charToJyutping.get(recovered)!;
        }
        candidates.push({ word: w, hintChar, hintJyutping });
      });
    });
    // dedupe by word (first valid candidate wins)
    const seen = new Set<string>();
    const uniq = candidates.filter(c => {
      if (seen.has(c.word)) return false;
      seen.add(c.word);
      return true;
    });
    return shuffle(uniq).slice(0, ROUND_COUNT);
  }, [items]);

  const totalRounds = rounds.length;
  const [roundIdx, setRoundIdx] = useState(0);
  const [arranged, setArranged] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hintUsedThisRound, setHintUsedThisRound] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [burst, setBurst] = useState(false);
  const startRef = useRef(Date.now());

  const current = rounds[roundIdx] ?? null;
  const target = current?.word ?? '';

  const { ref: containerRef, size: containerSize } = useElementSize<HTMLDivElement>();
  const containerWidth = containerSize.width || 0;

  // Build pool: target chars + 2-3 random distractor chars
  const pool = useMemo(() => {
    if (!target) return [] as string[];
    const others: string[] = [];
    items.forEach(i => {
      if (!target.includes(i.character) && !others.includes(i.character)) {
        others.push(i.character);
      }
    });
    const distractorCount = Math.min(3, others.length);
    const distractors = shuffle(others).slice(0, distractorCount);
    return shuffle([...target.split(''), ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, target]);

  useEffect(() => {
    setArranged([]);
    setHintUsedThisRound(false);
    setFeedback('idle');
  }, [roundIdx]);

  const finishRound = useCallback((newScore: number) => {
    const r = roundIdx + 1;
    if (r >= totalRounds) {
      const perfectRounds = newScore;
      const stars: 1 | 2 | 3 =
        perfectRounds >= totalRounds * 0.85 && hintsUsed === 0 ? 3 :
        perfectRounds >= totalRounds * 0.6 ? 2 : 1;
      onResult({ stars, correctCount: perfectRounds, totalCount: totalRounds, durationMs: Date.now() - startRef.current });
    } else {
      setRoundIdx(r);
    }
  }, [roundIdx, totalRounds, hintsUsed, onResult]);

  const handleTile = useCallback((char: string, sourceIdx: number) => {
    if (feedback !== 'idle') return;
    const next = [...arranged, char];
    setArranged(next);
    if (next.length === target.length) {
      const correct = next.join('') === target;
      if (correct) {
        setFeedback('correct');
        setBurst(true);
        // Celebration cue + pronunciation of the completed word.
        // The chime is short (~0.35s) and the TTS follows so the kid
        // hears the answer they just built. Slight delay lets the
        // chime breathe before the voice kicks in.
        audio.playCorrect();
        setTimeout(() => audio.speakTTS(target, 'zh-HK', 0.5), 250);
        const newScore = score + (hintUsedThisRound ? 0.5 : 1);
        // Hold the celebration a touch longer so kids can enjoy the
        // animation and hear the pronunciation before advancing.
        setTimeout(() => {
          setBurst(false);
          setScore(newScore);
          finishRound(newScore);
        }, 1400);
      } else {
        setFeedback('wrong');
        audio.playIncorrect();
        setTimeout(() => {
          setArranged([]);
          setFeedback('idle');
        }, 800);
      }
    }
    void sourceIdx;
  }, [arranged, feedback, target, score, hintUsedThisRound, finishRound, audio]);

  const handleClear = () => {
    if (feedback !== 'idle') return;
    setArranged([]);
  };

  const handleHint = () => {
    if (hintUsedThisRound || feedback !== 'idle') return;
    setHintUsedThisRound(true);
    setHintsUsed(c => c + 1);
    setArranged(target.slice(0, 1).split(''));
  };

  const handleSkip = () => {
    if (feedback !== 'idle') return;
    finishRound(score);
  };

  if (totalRounds === 0) {
    return (
      <div className="p-6 text-center text-slate-600">
        <div className="text-5xl mb-2">📭</div>
        目前字庫中沒有合適的詞語可組合，請刷新試試！
      </div>
    );
  }
  if (!current) return <div className="p-6 text-center text-slate-500">載入中...</div>;

  // available pool excludes already-arranged tiles by occurrence
  const remaining = [...pool];
  arranged.forEach(ch => {
    const i = remaining.indexOf(ch);
    if (i >= 0) remaining.splice(i, 1);
  });

  const slotTileSize = (() => {
    // Tile size adapts to viewport so all chars fit on iPhone SE (320px) and
    // grow comfortably on iPad. Width-driven, with a sensible ceiling.
    const cap = containerWidth > 0 ? Math.min(72, Math.floor(containerWidth / (target.length + 2))) : 56;
    return Math.max(48, cap);
  })();

  return (
    <div
      ref={containerRef}
      className="p-3 sm:p-4 flex flex-col items-center gap-3"
      style={{ touchAction: 'manipulation' }}
    >
      {/* HUD */}
      <div className="w-full max-w-md md:max-w-lg flex items-center justify-between text-sm">
        <span className="text-slate-700">第 <strong>{roundIdx + 1}</strong> / {totalRounds} 題</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
          ⭐ {Math.floor(score)}{score % 1 ? '.5' : ''}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-all ${
              i < roundIdx ? 'bg-emerald-500' : i === roundIdx ? 'bg-indigo-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Hint card */}
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4 text-center">
        <div className="text-xs text-slate-600 mb-1">線索字</div>
        <div className="font-chinese text-5xl sm:text-6xl text-slate-900 leading-none mb-1">{current.hintChar}</div>
        <div className="font-mono text-base text-amber-700">{current.hintJyutping}</div>
        <div className="text-xs text-slate-600 mt-2">用底下的字組成包含此字的 <strong>{target.length}</strong> 字詞語</div>
      </div>

      {/* Slots */}
      <div className={`relative flex gap-2 justify-center transition-all ${feedback === 'correct' ? 'animate-pop' : feedback === 'wrong' ? 'animate-wiggle' : ''}`}>
        {Array.from({ length: target.length }, (_, i) => (
          <div
            key={i}
            style={{ width: slotTileSize, height: slotTileSize, fontSize: Math.round(slotTileSize * 0.55) }}
            className={`rounded-2xl border-2 flex items-center justify-center font-chinese font-bold shadow-sm transition-all ${
              arranged[i]
                ? feedback === 'correct'
                  ? 'bg-emerald-500 border-emerald-600 text-white scale-105'
                  : feedback === 'wrong'
                  ? 'bg-rose-500 border-rose-600 text-white'
                  : 'bg-indigo-500 border-indigo-600 text-white scale-105'
                : 'bg-slate-50 border-dashed border-slate-300 text-slate-300'
            }`}
          >
            {arranged[i] ?? '_'}
          </div>
        ))}
        <CorrectBurst show={burst} />
      </div>

      {/* Celebration banner: shows the completed word and an audio replay
          chip once the kid gets it right. */}
      {feedback === 'correct' && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 px-4 py-2 flex items-center gap-3 shadow-md animate-float-in">
          <span className="text-2xl">🎉</span>
          <div className="text-left">
            <div className="font-chinese text-xl font-bold text-emerald-800">{target}</div>
            <div className="text-xs text-emerald-700">答對了！</div>
          </div>
          <button
            onClick={() => audio.speakTTS(target, 'zh-HK', 0.5)}
            className="ml-2 px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 text-sm font-semibold shadow-sm hover:bg-emerald-50 active:scale-95"
            title="再聽一次"
          >
            🔊 再聽
          </button>
        </div>
      )}

      {/* Tile pool */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md md:max-w-lg">
        {remaining.map((ch, i) => (
          <button
            key={`${ch}-${i}`}
            onClick={() => handleTile(ch, i)}
            disabled={feedback !== 'idle'}
            aria-label={`tile ${ch}`}
            style={{ width: slotTileSize, height: slotTileSize, fontSize: Math.round(slotTileSize * 0.5) }}
            className="rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-400 font-chinese font-bold text-amber-900 hover:scale-110 active:scale-95 disabled:opacity-40 transition-all shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 active:scale-95 min-h-11 inline-flex items-center focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
        >
          ↺ 清除
        </button>
        <button
          onClick={handleHint}
          disabled={hintUsedThisRound}
          className="px-4 py-2 rounded-xl bg-sky-100 text-sky-700 text-sm font-medium hover:bg-sky-200 active:scale-95 disabled:opacity-40 min-h-11 inline-flex items-center focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
        >
          💡 提示 (-0.5⭐)
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 active:scale-95 min-h-11 inline-flex items-center focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
        >
          ⏭ 跳過
        </button>
      </div>
    </div>
  );
}

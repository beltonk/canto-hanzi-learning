'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import StrokeTracing from '@/app/components/learning/StrokeTracing';
import type { StrokeVector } from '@/types/fullCharacter';
import type { GameProps } from './types';

const CHAR_COUNT = 5;
const TIME_PER_CHAR = 30; // generous, since real tracing takes time

interface CharFull {
  character: string;
  jyutping: string;
  strokeVectors?: StrokeVector[];
}

export default function StrokeRacer({ items, onResult }: GameProps) {
  const [charIdx, setCharIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CHAR);
  const [rocketPos, setRocketPos] = useState(0);
  const [chars, setChars] = useState<CharFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultStars, setResultStars] = useState<(1 | 2 | 3 | 0)[]>([]);
  const [feedback, setFeedback] = useState<'pending' | 'pass' | 'timeout'>('pending');
  const [canvasSize, setCanvasSize] = useState(320);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const scoreRef = useRef(0);
  const charIdxRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive sizing
  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 360;
      if (w >= 1024) setCanvasSize(360);
      else if (w >= 640) setCanvasSize(340);
      else setCanvasSize(Math.min(w - 56, 300));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Load full character data (with stroke vectors) for the first CHAR_COUNT items that have them
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const candidates = items.slice(0, CHAR_COUNT * 4).map(i => i.character);
      const loaded: CharFull[] = [];
      for (const ch of candidates) {
        if (loaded.length >= CHAR_COUNT) break;
        try {
          const r = await fetch(`/api/characters?char=${encodeURIComponent(ch)}`);
          const json = await r.json();
          const c = json.character;
          if (c?.strokeVectors?.length) {
            loaded.push({ character: c.character, jyutping: c.jyutping, strokeVectors: c.strokeVectors });
          }
        } catch { /* skip */ }
      }
      if (!cancelled) {
        setChars(loaded);
        setLoading(false);
        startRef.current = Date.now();
      }
    };
    load();
    return () => { cancelled = true; };
  }, [items]);

  const currentChar = chars[charIdx];

  const advance = useCallback((stars: 1 | 2 | 3 | 0) => {
    if (doneRef.current) return;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (stars > 0) {
      scoreRef.current += 1;
      setRocketPos(p => Math.min(p + 100 / CHAR_COUNT, 100));
    }
    setResultStars(rs => {
      const c = [...rs];
      c[charIdxRef.current] = stars;
      return c;
    });
    charIdxRef.current += 1;
    if (charIdxRef.current >= chars.length) {
      doneRef.current = true;
      const s = scoreRef.current;
      const totalStars: 1 | 2 | 3 = s >= chars.length * 0.8 ? 3 : s >= chars.length * 0.5 ? 2 : 1;
      onResult({ stars: totalStars, correctCount: s, totalCount: chars.length, durationMs: Date.now() - startRef.current });
    } else {
      // brief pause showing result, then next char
      advanceTimerRef.current = setTimeout(() => {
        setCharIdx(charIdxRef.current);
        setTimeLeft(TIME_PER_CHAR);
        setFeedback('pending');
      }, 800);
    }
  }, [onResult, chars.length]);

  // Per-char countdown — drive from a local variable so the setState updater
  // stays pure (StrictMode double-invoke would otherwise advance twice).
  useEffect(() => {
    if (loading || chars.length === 0 || doneRef.current || feedback !== 'pending') return;
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = TIME_PER_CHAR;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setFeedback('timeout');
        advance(0);
      }
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [charIdx, loading, chars.length, advance, feedback]);

  const handleStrokeComplete = useCallback((stars: 1 | 2 | 3) => {
    setFeedback('pass');
    advance(stars);
  }, [advance]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center gap-3 min-h-[400px] justify-center">
        <div className="text-5xl animate-bounce">🚀</div>
        <p className="text-slate-600">準備筆順資料中…</p>
      </div>
    );
  }

  if (chars.length === 0) {
    return (
      <div className="p-8 text-center text-slate-600">
        <div className="text-5xl mb-2">🪐</div>
        暫時沒有可練習筆順的字符
      </div>
    );
  }

  if (!currentChar) {
    return <div className="p-4 text-center text-slate-500">準備中...</div>;
  }

  const lowTime = timeLeft <= 8;

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
      {/* Rocket race track */}
      <div className="w-full max-w-md relative h-14 bg-gradient-to-r from-indigo-900 via-purple-800 to-fuchsia-700 rounded-2xl overflow-hidden border-2 border-indigo-300 shadow-md">
        {/* Stars background */}
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-1 left-2 text-xs">✨</div>
          <div className="absolute top-3 left-1/4 text-xs">⭐</div>
          <div className="absolute top-2 left-2/4 text-xs">·</div>
          <div className="absolute top-4 left-3/4 text-xs">✦</div>
          <div className="absolute top-1 right-3 text-xs">🌟</div>
        </div>
        {/* Track markers */}
        {Array.from({ length: CHAR_COUNT - 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-px h-6 bg-white/20"
            style={{ left: `${((i + 1) / CHAR_COUNT) * 100}%` }}
          />
        ))}
        {/* Goal */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xl">🪐</div>
        {/* Rocket */}
        <div
          className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-700 ease-out"
          style={{ left: `${rocketPos}%`, transform: 'translate(-50%, -50%)' }}
        >
          🚀
        </div>
        {/* Stars earned per slot */}
        <div className="absolute bottom-0.5 left-2 right-2 flex justify-between">
          {chars.map((_, i) => (
            <span key={i} className="text-[10px] text-yellow-300">
              {resultStars[i] === 0 ? '✗' : resultStars[i] ? '⭐' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="w-full max-w-md flex items-center justify-between text-sm">
        <span className="text-slate-700 font-medium">第 <strong>{charIdx + 1}</strong> / {chars.length} 字</span>
        <span className="text-slate-700">粵拼 <strong className="font-mono">{currentChar.jyutping}</strong></span>
        <span className={`font-bold tabular-nums ${lowTime ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {/* Tracing area — uses StrokeTracing which already has full stroke detection + visualization */}
      <div className="relative">
        <StrokeTracing
          key={charIdx}
          strokeVectors={currentChar.strokeVectors}
          character={currentChar.character}
          size={canvasSize}
          onComplete={handleStrokeComplete}
        />
        {feedback === 'timeout' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-rose-500/30 rounded-3xl">
            <div className="text-5xl font-bold text-rose-700 animate-pop">⏰ 時間到！</div>
          </div>
        )}
      </div>
    </div>
  );
}

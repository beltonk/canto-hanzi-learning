'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { addFavorite } from '@/lib/favorites';
import type { GameProps } from './types';
import { useAudio } from '@/lib/audio/context';
import { useElementSize } from '@/lib/viewport/useElementSize';

const ROUND_COUNT = 12;
const MAX_LIVES = 3;
const TILE_SIZE_PX = 56;
const SAFE_GAP_PX = 14;
const FALL_BASE_PX_PER_S = 45;
const FALL_MAX_PX_PER_S = 120;
const TICK_MS = 33;

// Derive lane count from container width so each tile has comfortable spacing.
function laneCountFor(widthPx: number): number {
  if (widthPx < 360) return 3;
  if (widthPx < 520) return 4;
  if (widthPx < 720) return 5;
  return 6;
}
// More lanes → faster spawn so the field stays lively.
function spawnIntervalFor(lanes: number): number {
  return Math.round(900 - lanes * 50);
}
// Frame height scales with width on tablets, capped to keep gameplay readable.
function frameHeightFor(widthPx: number): number {
  if (widthPx < 360) return 340;
  if (widthPx < 520) return 380;
  if (widthPx < 720) return 440;
  return 500;
}

interface FallingChar {
  id: number;
  char: string;
  isTarget: boolean;
  lane: number;
  yPx: number;
  speedPxPerS: number;
  hue: number;
  emoji: string;
}

const TILE_EMOJIS = ['💧', '⭐', '🌟', '✨', '☁️', '🍃', '❄️', '🍎'];

let idCounter = 0;
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function CharacterRain({ items, onResult }: GameProps) {
  const audio = useAudio();
  // Display state — driven by `tilesRef` via the `tick` counter that forces re-renders.
  // Storing tiles in a ref (instead of useState) avoids React StrictMode's
  // double-invoke of state updater functions, which was clobbering side
  // effects like the spawn cooldown timestamp.
  const [target, setTarget] = useState('');
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<{ x: number; y: number; text: string; color: string } | null>(null);
  const [, setTick] = useState(0);

  // Container-driven sizing
  const frameRef = useRef<HTMLDivElement>(null);
  const frameSize = useElementSize(frameRef);
  const widthPx = frameSize.width || 360;
  const columnCount = laneCountFor(widthPx);
  const columnWidthPct = 100 / columnCount;
  const maxTilesOnScreen = columnCount + 2;
  const spawnIntervalMs = spawnIntervalFor(columnCount);
  const frameHeightPx = frameHeightFor(widthPx);

  const tilesRef = useRef<FallingChar[]>([]);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  const stateRef = useRef({ round: 0, score: 0, lives: MAX_LIVES, combo: 0 });
  const targetRef = useRef('');
  const targetCaughtRef = useRef(false);
  const lastSpawnAtRef = useRef<number>(0);

  // Keep latest dynamic params accessible from the animation loop without
  // forcing a re-subscription each render.
  const layoutRef = useRef({ columnCount, spawnIntervalMs, maxTilesOnScreen, frameHeightPx });
  layoutRef.current = { columnCount, spawnIntervalMs, maxTilesOnScreen, frameHeightPx };

  const itemsKey = items.map(i => i.character).join('|');
  const itemsByChar = useMemo(() => {
    const map = new Map<string, typeof items[number]>();
    items.forEach(i => map.set(i.character, i));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const finishGame = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stateRef.current.score;
    const stars: 1 | 2 | 3 = s >= ROUND_COUNT * 0.8 ? 3 : s >= ROUND_COUNT * 0.5 ? 2 : 1;
    const startedAt = startRef.current;
    Promise.resolve().then(() =>
      onResult({ stars, correctCount: s, totalCount: ROUND_COUNT, durationMs: Date.now() - startedAt })
    );
  }, [onResult]);

  const spawnRound = useCallback((r: number) => {
    if (items.length === 0) return;
    const tItem = items[r % items.length];
    setTarget(tItem.character);
    targetRef.current = tItem.character;
    targetCaughtRef.current = false;
    tilesRef.current = [];
    lastSpawnAtRef.current = performance.now();
    setTick(t => t + 1);
  }, [items]);

  useEffect(() => {
    if (items.length === 0) return;
    stateRef.current = { round: 0, score: 0, lives: MAX_LIVES, combo: 0 };
    doneRef.current = false;
    startRef.current = Date.now();
    spawnRound(0);
  }, [items, spawnRound]);

  const spawnTile = useCallback((currentTiles: FallingChar[]): FallingChar | null => {
    const t = targetRef.current;
    if (!t || items.length === 0) return null;

    const tileHalfPx = TILE_SIZE_PX / 2;
    const usableLanes: number[] = [];
    const lanes = layoutRef.current.columnCount;
    for (let lane = 0; lane < lanes; lane++) {
      const inLane = currentTiles.filter(ti => ti.lane === lane);
      const minY = inLane.length === 0 ? Infinity : Math.min(...inLane.map(ti => ti.yPx));
      if (minY > tileHalfPx + SAFE_GAP_PX + TILE_SIZE_PX) usableLanes.push(lane);
    }
    if (usableLanes.length === 0) return null;
    const lane = rand(usableLanes);

    const wantTarget = !targetCaughtRef.current && Math.random() < 0.4;
    const item = wantTarget
      ? itemsByChar.get(t) ?? items[0]
      : (() => {
          const others = items.filter(i => i.character !== t);
          return rand(others.length > 0 ? others : items);
        })();

    const speed = FALL_BASE_PX_PER_S + Math.random() * (FALL_MAX_PX_PER_S - FALL_BASE_PX_PER_S);
    return {
      id: idCounter++,
      char: item.character,
      isTarget: item.character === t,
      lane,
      yPx: -SAFE_GAP_PX,
      speedPxPerS: speed,
      hue: Math.floor(Math.random() * 360),
      emoji: rand(TILE_EMOJIS),
    };
  }, [items, itemsByChar]);

  // Animation loop — tiles live in a ref; we mutate, then force a re-render.
  useEffect(() => {
    if (items.length === 0) return;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      if (doneRef.current) return;
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Advance tiles
      let next = tilesRef.current.map(t => ({ ...t, yPx: t.yPx + t.speedPxPerS * dt }));

      // Check missed target
      const fh = layoutRef.current.frameHeightPx;
      const missed = next.find(t => t.isTarget && t.yPx > fh + TILE_SIZE_PX);
      let advanceRound = false;
      let advanceTo = 0;
      if (missed && !targetCaughtRef.current) {
        targetCaughtRef.current = true;
        // Auto-save the missed target so the player can revisit it later.
        addFavorite({
          text: missed.char,
          kind: 'char',
          source: 'game:character-rain',
          reason: 'mistake',
        });
        const newLives = stateRef.current.lives - 1;
        stateRef.current.lives = newLives;
        stateRef.current.combo = 0;
        setLives(newLives);
        setCombo(0);
        if (newLives <= 0) {
          tilesRef.current = next;
          setTick(t => t + 1);
          finishGame();
          return;
        }
        const nextR = stateRef.current.round + 1;
        stateRef.current.round = nextR;
        setRound(nextR);
        if (nextR >= ROUND_COUNT) {
          tilesRef.current = [];
          setTick(t => t + 1);
          finishGame();
          return;
        }
        advanceRound = true;
        advanceTo = nextR;
        next = [];
      } else {
        // Drop tiles past bottom (non-target tiles just disappear)
        next = next.filter(t => t.yPx <= fh + TILE_SIZE_PX);

        // Spawn new tile when cooldown elapsed
        const { spawnIntervalMs: spawnEvery, maxTilesOnScreen: maxTiles } = layoutRef.current;
        if (now - lastSpawnAtRef.current >= spawnEvery && next.length < maxTiles) {
          const newTile = spawnTile(next);
          if (newTile) {
            next.push(newTile);
            lastSpawnAtRef.current = now;
          }
        }
      }

      tilesRef.current = next;
      setTick(t => t + 1);

      if (advanceRound) {
        setTimeout(() => spawnRound(advanceTo), 200);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [items.length, spawnRound, spawnTile, finishGame]);

  const handleTap = useCallback((tile: FallingChar) => {
    if (doneRef.current) return;
    if (tile.char === targetRef.current && !targetCaughtRef.current) {
      targetCaughtRef.current = true;
      audio.playCorrect();
      const comboBonus = Math.floor(stateRef.current.combo / 3);
      const newScore = stateRef.current.score + 1 + comboBonus;
      const newCombo = stateRef.current.combo + 1;
      stateRef.current.score = newScore;
      stateRef.current.combo = newCombo;
      setScore(newScore);
      setCombo(newCombo);
      const xPct = tile.lane * columnWidthPct + columnWidthPct / 2;
      setFeedback({
        x: xPct,
        y: (tile.yPx / frameHeightPx) * 100,
        text: comboBonus > 0 ? `+${1 + comboBonus} 🔥` : '+1',
        color: 'text-emerald-500',
      });
      setTimeout(() => setFeedback(null), 700);

      const nextR = stateRef.current.round + 1;
      stateRef.current.round = nextR;
      setRound(nextR);

      if (nextR >= ROUND_COUNT) {
        finishGame();
      } else {
        tilesRef.current = [];
        setTick(t => t + 1);
        setTimeout(() => spawnRound(nextR), 350);
      }
    } else if (tile.char !== targetRef.current) {
      audio.playIncorrect();
      stateRef.current.combo = 0;
      setCombo(0);
      const xPct = tile.lane * columnWidthPct + columnWidthPct / 2;
      setFeedback({ x: xPct, y: (tile.yPx / frameHeightPx) * 100, text: '✗', color: 'text-rose-500' });
      setTimeout(() => setFeedback(null), 500);
    }
  }, [audio, spawnRound, finishGame, columnWidthPct, frameHeightPx]);

  const tiles = tilesRef.current;

  return (
    <div
      className="flex flex-col items-center gap-3 p-3 sm:p-4"
      style={{
        paddingTop: 'max(12px, var(--safe-top))',
        paddingBottom: 'max(12px, var(--safe-bottom))',
      }}
    >
      {/* HUD */}
      <div className="w-full max-w-md md:max-w-xl flex items-center justify-between gap-2 px-2 text-sm sm:text-base">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-medium text-slate-700">目標</span>
          <span className="font-chinese text-3xl sm:text-4xl font-bold text-rose-600 bg-rose-50 px-3 py-0.5 rounded-xl border-2 border-rose-200 shadow-sm animate-pulse">
            {target}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <span className="text-base sm:text-lg" title="生命">
            {'❤️'.repeat(Math.max(0, lives))}{'🤍'.repeat(Math.max(0, MAX_LIVES - lives))}
          </span>
          {combo >= 2 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold">
              🔥 連擊 x{combo}
            </span>
          )}
        </div>
      </div>
      <div className="w-full max-w-md md:max-w-xl flex items-center justify-between text-xs sm:text-sm text-slate-600 px-2">
        <span>第 {Math.min(round + 1, ROUND_COUNT)} / {ROUND_COUNT} 題</span>
        <span>分數 <strong className="text-slate-900">{score}</strong></span>
      </div>

      {/* Game frame — width drives lane count and height. */}
      <div
        ref={frameRef}
        className="relative w-full max-w-md md:max-w-xl rounded-3xl overflow-hidden border-4 border-sky-300 shadow-xl bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50"
        style={{ height: frameHeightPx, touchAction: 'manipulation' }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-3 left-4 text-3xl">☁️</div>
          <div className="absolute top-8 right-6 text-2xl">☁️</div>
          <div className="absolute top-16 left-1/3 text-xl">☁️</div>
          {Array.from({ length: columnCount - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/30"
              style={{ left: `${(i + 1) * columnWidthPct}%` }}
            />
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-emerald-400 to-transparent" />
        </div>

        {tiles.map(tile => {
          const xPct = tile.lane * columnWidthPct + columnWidthPct / 2;
          const isTarget = tile.isTarget;
          return (
            <button
              key={tile.id}
              onClick={() => handleTap(tile)}
              className={`absolute font-chinese font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-90 hover:scale-105 shadow-lg select-none ${
                isTarget
                  ? 'border-2 border-rose-300 text-slate-900 ring-2 ring-rose-200'
                  : 'border border-slate-200 text-slate-800'
              }`}
              style={{
                left: `${xPct}%`,
                top: `${tile.yPx}px`,
                width: TILE_SIZE_PX,
                height: TILE_SIZE_PX,
                fontSize: 28,
                transform: 'translate(-50%, 0)',
                background: isTarget
                  ? `linear-gradient(135deg, hsl(${tile.hue}, 90%, 95%), white)`
                  : `linear-gradient(135deg, hsl(${tile.hue}, 70%, 96%), white)`,
              }}
              aria-label={`${tile.char}${isTarget ? ' (目標)' : ''}`}
            >
              <span className="absolute -top-2 -right-1.5 text-xs">{tile.emoji}</span>
              {tile.char}
            </button>
          );
        })}

        {feedback && (
          <div
            className={`absolute pointer-events-none font-bold text-2xl ${feedback.color} animate-pop`}
            style={{ left: `${feedback.x}%`, top: `${feedback.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {feedback.text}
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 text-center">
        點擊跟「目標」一樣的字！⭐ 連續答對 +bonus 分
      </p>
    </div>
  );
}

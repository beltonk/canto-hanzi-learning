'use client';
/**
 * ConfettiBurst — full-viewport falling-confetti celebration overlay.
 *
 * Renders a fixed-position, non-interactive layer of colourful particles
 * that fall from above the viewport with random horizontal drift and
 * rotation. Designed for game-complete / level-up moments — for tighter
 * per-answer feedback use the smaller <CorrectBurst /> instead.
 *
 * Behaviour:
 *  - Auto-cleans up after `durationMs` (default 3500 ms).
 *  - Pure CSS animation, GPU-accelerated transforms only.
 *  - Honours `prefers-reduced-motion`: renders nothing when reduced.
 *  - Particles are computed once per `show=true` so each celebration
 *    looks slightly different.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '@/src/lib/motion';

const COLORS = [
  '#f97316', // orange-500
  '#facc15', // yellow-400
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#ef4444', // red-500
];

interface Piece {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  rotStart: number;
  rotEnd: number;
  drift: string;
  width: number;
  height: number;
  borderRadius: string;
}

interface Props {
  show: boolean;
  /** Number of particles to render. Default 70. */
  count?: number;
  /** How long the overlay stays mounted, in ms. Default 3500. */
  durationMs?: number;
}

export default function ConfettiBurst({ show, count = 70, durationMs = 3500 }: Props) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  // Re-roll particles each time `show` flips to true.
  const [seed, setSeed] = useState(0);

  const pieces = useMemo<Piece[]>(() => {
    if (reduced) return [];
    return Array.from({ length: count }).map((_, i) => {
      const shape = i % 3; // 0 = square, 1 = circle, 2 = rectangle
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 600}ms`,
        duration: `${2200 + Math.random() * 1500}ms`,
        color: COLORS[i % COLORS.length],
        rotStart: Math.floor(Math.random() * 360),
        rotEnd: Math.floor(Math.random() * 360) + 540,
        drift: `${(Math.random() - 0.5) * 220}px`,
        width: shape === 2 ? 7 : 9,
        height: shape === 2 ? 14 : 9,
        borderRadius: shape === 1 ? '50%' : '2px',
      };
    });
    // `seed` intentionally drives a re-roll on each show=true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, reduced, seed]);

  useEffect(() => {
    if (show) {
      setSeed(s => s + 1);
      setActive(true);
      const t = setTimeout(() => setActive(false), durationMs);
      return () => clearTimeout(t);
    }
  }, [show, durationMs]);

  if (!active || reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            top: '-5vh',
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ['--rot-start' as string]: `${p.rotStart}deg`,
            ['--rot-end' as string]: `${p.rotEnd}deg`,
            ['--drift' as string]: p.drift,
          } as React.CSSProperties}
        >
          <div
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              borderRadius: p.borderRadius,
              boxShadow: '0 1px 2px rgba(15,23,42,0.18)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

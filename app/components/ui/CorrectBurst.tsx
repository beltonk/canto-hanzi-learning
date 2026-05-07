'use client';
/**
 * CorrectBurst — lightweight confetti overlay for correct answers.
 * Renders a brief ring + flying stars centred on its parent (position: relative).
 * Unmounts itself after the animation completes.
 */
import React from 'react';

const STARS = ['⭐', '🌟', '✨', '💫', '🎉'];
const OFFSETS = [
  { tx: '-45px', ty: '-55px' },
  { tx: '45px',  ty: '-55px' },
  { tx: '-60px', ty: '-10px' },
  { tx: '60px',  ty: '-10px' },
  { tx: '-20px', ty: '-70px' },
  { tx: '20px',  ty: '-70px' },
];

interface Props {
  /** Controls visibility; when set to false the component cleans itself up. */
  show: boolean;
}

export default function CorrectBurst({ show }: Props) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20" aria-hidden>
      {/* Expanding ring */}
      <div className="absolute w-16 h-16 rounded-full border-4 border-emerald-400 animate-correct-burst" />
      {/* Star particles */}
      {OFFSETS.map((off, i) => (
        <div
          key={i}
          className="absolute text-xl animate-star-pop"
          style={{ '--tx': off.tx, '--ty': off.ty, animationDelay: `${i * 30}ms` } as React.CSSProperties}
        >
          {STARS[i % STARS.length]}
        </div>
      ))}
    </div>
  );
}

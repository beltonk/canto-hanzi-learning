'use client';
import React, { useEffect } from 'react';

export type MascotId = 'panda' | 'rabbit' | 'monkey' | 'owl' | 'cat' | 'tiger';
export type MascotPose = 'idle' | 'happy' | 'cheer' | 'oops';

// Legacy type alias for backwards compatibility
export type MascotType = 'panda' | 'rabbit' | 'monkey' | 'owl';

const MASCOT_EMOJI: Record<MascotId, string> = {
  panda: '🐼', rabbit: '🐰', monkey: '🐵', owl: '🦉', cat: '🐱', tiger: '🐯',
};

const POSE_BG: Record<MascotPose, string> = {
  idle: 'bg-[var(--color-peach)] border-[var(--color-peach-light)]',
  happy: 'bg-[var(--color-mint-light)] border-[var(--color-mint)]',
  cheer: 'bg-[var(--color-golden-light)] border-[var(--color-golden)]',
  oops: 'bg-[var(--color-sky-light)] border-[var(--color-sky)]',
};

const POSE_ANIMATION: Record<MascotPose, string> = {
  idle: '',
  happy: 'animate-bounce',
  cheer: 'animate-cheer',
  oops: 'animate-wiggle',
};

interface MascotProps {
  id?: MascotId;
  mascot?: string; // legacy prop
  /** Legacy prop - maps to id */
  type?: MascotType;
  pose?: MascotPose;
  size?: number;
  className?: string;
  voiceline?: string;
  /** Legacy props */
  message?: string;
  animate?: boolean;
}

interface SpeechProps {
  children: React.ReactNode;
  className?: string;
}

function Speech({ children, className }: SpeechProps) {
  return (
    <div className={`relative bg-white rounded-2xl border-2 border-[var(--card-border)] px-4 py-2 shadow-md text-[var(--color-charcoal)] text-sm font-medium ${className ?? ''}`}>
      {children}
      <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
    </div>
  );
}

function MascotComponent({ id, mascot, type, pose = 'idle', size = 80, className, voiceline, message, animate }: MascotProps) {
  const resolvedId = (id ?? mascot ?? type ?? 'panda') as MascotId;
  const emoji = MASCOT_EMOJI[resolvedId] ?? '🐼';
  const bgClass = POSE_BG[pose];
  const animClass = POSE_ANIMATION[pose];

  // Legacy: if animate=true and no explicit pose, treat as floating
  const extraAnim = animate === true && pose === 'idle' ? 'animate-float' : '';

  useEffect(() => {
    if (voiceline && typeof window !== 'undefined') {
      // Placeholder for AudioProvider integration
    }
  }, [voiceline]);

  return (
    <div className={`flex flex-col items-center ${className ?? ''}`}>
      <div
        className={`inline-flex items-center justify-center rounded-full border-4 select-none ${bgClass} ${animClass} ${extraAnim}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        role="img"
        aria-label={`${resolvedId} mascot - ${pose}`}
      >
        {emoji}
      </div>
      {message && (
        <div className="mt-2 px-4 py-2 bg-[var(--card-bg)] rounded-full shadow-md border-2 border-[var(--color-peach)]">
          <p className="text-[var(--color-charcoal)] text-lg font-medium text-center">{message}</p>
        </div>
      )}
    </div>
  );
}

const Mascot = Object.assign(MascotComponent, { Speech });
export default Mascot;

// Legacy named exports for backwards compatibility
export function MascotIcon({ type, size = 'md', className = '' }: { type: MascotType; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 40, md: 60, lg: 80 };
  const emoji = MASCOT_EMOJI[type] ?? '🐼';
  return (
    <span
      className={className}
      style={{ fontSize: sizeMap[size] }}
      role="img"
      aria-label={`${type} mascot`}
    >
      {emoji}
    </span>
  );
}

export function MascotCelebration({ type, message }: { type: MascotType; message?: string }) {
  const displayMessage = message ?? '做得好！';
  return (
    <div className="flex flex-col items-center animate-bounce-in">
      <div className="relative">
        <span className="text-7xl" role="img" aria-label="celebration">
          {MASCOT_EMOJI[type]}
        </span>
        <span className="absolute -top-2 -right-2 text-3xl animate-star-burst">⭐</span>
        <span className="absolute -top-4 -left-2 text-2xl animate-star-burst" style={{ animationDelay: '0.1s' }}>✨</span>
        <span className="absolute -bottom-1 -right-4 text-2xl animate-star-burst" style={{ animationDelay: '0.2s' }}>🌟</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--color-mint-dark)]">{displayMessage}</p>
    </div>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// CSS class names for motion primitives.
// When reduced motion is preferred, use the -reduced variant.
export const motionClasses = {
  pop: 'animate-pop',
  popReduced: 'animate-fade-in',
  wiggle: 'animate-wiggle',
  wiggleReduced: '',
  floatIn: 'animate-float-in',
  floatInReduced: 'animate-fade-in',
  cheer: 'animate-cheer',
  cheerReduced: 'animate-fade-in',
  confetti: 'animate-confetti',
  confettiReduced: '',
  parallax: 'animate-parallax',
  parallaxReduced: '',
} as const;

export function useMotionClass(primitive: keyof typeof motionClasses): string {
  const reduced = useReducedMotion();
  const reducedKey = `${primitive}Reduced` as keyof typeof motionClasses;
  return reduced ? (motionClasses[reducedKey] ?? '') : motionClasses[primitive];
}

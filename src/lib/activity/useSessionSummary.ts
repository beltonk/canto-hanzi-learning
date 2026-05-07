'use client';
import { useRef, useState, useCallback } from 'react';
import { loadRoot } from '../storage';

export interface SessionSummaryData {
  xpEarned: number;
  charsCount: number;
  streak: number;
}

/**
 * Hook for tracking XP and characters earned during a session,
 * and showing an end-of-session summary before navigating home.
 */
export function useSessionSummary() {
  const startXpRef = useRef<number | null>(null);
  const startCharsRef = useRef<number | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  // Use a ref to store the pending exit callback to avoid closure issues
  const pendingExitCallbackRef = useRef<(() => void) | null>(null);

  const initSession = useCallback(() => {
    const root = loadRoot();
    startXpRef.current = root.gamification.xp;
    startCharsRef.current = Object.keys(root.progress.characters).length;
  }, []);

  const requestExit = useCallback((onConfirm: () => void) => {
    const root = loadRoot();
    const startXp = startXpRef.current ?? root.gamification.xp;
    const startChars = startCharsRef.current ?? Object.keys(root.progress.characters).length;
    const xpEarned = root.gamification.xp - startXp;
    const charsCount = Object.keys(root.progress.characters).length - startChars;

    if (xpEarned > 0 || charsCount > 0) {
      pendingExitCallbackRef.current = onConfirm;
      setSummary({ xpEarned, charsCount, streak: root.gamification.streak });
    } else {
      onConfirm();
    }
  }, []);

  const dismissSummary = useCallback(() => {
    const cb = pendingExitCallbackRef.current;
    pendingExitCallbackRef.current = null;
    setSummary(null);
    cb?.();
  }, []);

  return { initSession, requestExit, summary, dismissSummary };
}

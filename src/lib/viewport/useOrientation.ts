'use client';

import { useSyncExternalStore } from 'react';
import type { Orientation } from './breakpoints';

function getMQ(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia('(orientation: portrait)');
}

function getOrientation(): Orientation {
  return getMQ()?.matches ? 'portrait' : 'landscape';
}

const _listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  const mq = getMQ();
  const handler = () => {
    _listeners.forEach(fn => fn());
  };
  mq?.addEventListener('change', handler);
  return () => {
    _listeners.delete(callback);
    mq?.removeEventListener('change', handler);
  };
}

/**
 * Returns 'portrait' | 'landscape' based on the CSS orientation media query.
 * SSR-safe: returns 'portrait' on the server.
 * Updates immediately (no debounce) since it's driven by a media query event.
 */
export function useOrientation(): Orientation {
  return useSyncExternalStore(subscribe, getOrientation, () => 'portrait' as Orientation);
}

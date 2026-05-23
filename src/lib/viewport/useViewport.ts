'use client';

import { useSyncExternalStore } from 'react';
import { widthToBreakpoint, type Breakpoint } from './breakpoints';

export interface ViewportState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
}

const SERVER_SNAPSHOT: ViewportState = { width: 0, height: 0, breakpoint: 'lg' };

function getSnapshot(): ViewportState {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    breakpoint: widthToBreakpoint(window.innerWidth),
  };
}

let _cached: ViewportState = SERVER_SNAPSHOT;
let _timer: ReturnType<typeof setTimeout> | null = null;
const _listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  if (_listeners.size === 0) {
    _cached = getSnapshot();
  }
  _listeners.add(callback);

  const handler = () => {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => {
      _cached = getSnapshot();
      _listeners.forEach(fn => fn());
    }, 120);
  };

  window.addEventListener('resize', handler, { passive: true });
  window.addEventListener('orientationchange', handler, { passive: true });

  return () => {
    _listeners.delete(callback);
    if (_listeners.size === 0) {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    }
  };
}

function getCachedSnapshot(): ViewportState {
  return _cached;
}

/**
 * Returns the current viewport dimensions and breakpoint token.
 * SSR-safe: returns `{ width: 0, height: 0, breakpoint: 'lg' }` on the server.
 * Debounced 120 ms to avoid layout thrash on rapid resize.
 */
export function useViewport(): ViewportState {
  return useSyncExternalStore(subscribe, getCachedSnapshot, () => SERVER_SNAPSHOT);
}

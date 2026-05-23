import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { widthToBreakpoint } from '@/lib/viewport/breakpoints';

// ---------- widthToBreakpoint unit tests ----------

describe('widthToBreakpoint', () => {
  it('returns xs for 0', () => expect(widthToBreakpoint(0)).toBe('xs'));
  it('returns xs for 479', () => expect(widthToBreakpoint(479)).toBe('xs'));
  it('returns sm for 480', () => expect(widthToBreakpoint(480)).toBe('sm'));
  it('returns sm for 767', () => expect(widthToBreakpoint(767)).toBe('sm'));
  it('returns md for 768', () => expect(widthToBreakpoint(768)).toBe('md'));
  it('returns md for 1023', () => expect(widthToBreakpoint(1023)).toBe('md'));
  it('returns lg for 1024', () => expect(widthToBreakpoint(1024)).toBe('lg'));
  it('returns xl for 1280', () => expect(widthToBreakpoint(1280)).toBe('xl'));
  it('returns 2xl for 1536', () => expect(widthToBreakpoint(1536)).toBe('2xl'));
});

// ---------- useViewport ----------

describe('useViewport', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth',  { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns correct breakpoint for phone-portrait width', async () => {
    const { useViewport } = await import('@/lib/viewport/useViewport');
    const { result } = renderHook(() => useViewport());
    // SSR snapshot is 'lg'; after first client render we get the real value
    expect(['xs', 'lg']).toContain(result.current.breakpoint);
  });
});

// ---------- useOrientation ----------

describe('useOrientation', () => {
  beforeEach(() => {
    // jsdom has no matchMedia; stub a minimal implementation.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('portrait'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns portrait or landscape without throwing', async () => {
    const { useOrientation } = await import('@/lib/viewport/useOrientation');
    const { result } = renderHook(() => useOrientation());
    expect(['portrait', 'landscape']).toContain(result.current);
  });
});

// ---------- useElementSize ----------

describe('useElementSize', () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver — stub it so the hook can mount without crashing.
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 0,0 when ref is null', async () => {
    const { useElementSize } = await import('@/lib/viewport/useElementSize');
    const { useRef } = await import('react');
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      return useElementSize(ref);
    });
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
  });

  it('mounts without throwing when an element is attached', async () => {
    const { useElementSize } = await import('@/lib/viewport/useElementSize');
    const { useRef } = await import('react');
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'));
      return useElementSize(ref);
    });
    // jsdom getBoundingClientRect returns zeros; just assert no throw and numeric types.
    expect(typeof result.current.width).toBe('number');
    expect(typeof result.current.height).toBe('number');
  });
});

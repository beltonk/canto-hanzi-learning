'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

const EMPTY: ElementSize = { width: 0, height: 0 };

/**
 * Tracks the rendered size of a DOM element via ResizeObserver.
 * Returns { width: 0, height: 0 } until the element mounts or on the server.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { width, height } = useElementSize(ref);
 */
export function useElementSize<T extends Element>(ref: RefObject<T | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>(EMPTY);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Read initial size synchronously so the first render has real values.
    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    observerRef.current = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { inlineSize: width, blockSize: height } =
          entry.borderBoxSize?.[0] ?? { inlineSize: entry.contentRect.width, blockSize: entry.contentRect.height };
        setSize({ width, height });
      }
    });

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref]);

  return size;
}

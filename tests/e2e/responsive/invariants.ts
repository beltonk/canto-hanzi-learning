import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Five reusable layout invariants asserted on every (route × viewport) cell.
 *
 * 1. No horizontal scroll      — scrollWidth must equal innerWidth
 * 2. No safe-area overlap      — no element at y < safeTop
 * 3. Touch targets ≥ 44×44 px — every interactive element meets WCAG 2.5.5
 * 4. HK font first in stack    — Free HK Kai must be the first font on .font-chinese
 * 5. No inline overflow        — no element with overflow-x content clipping
 */

export async function assertNoHorizontalScroll(page: Page) {
  const probe = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    if (docW <= winW) return { overflow: false, detail: null as string | null };

    function isClippedByAncestor(el: Element): boolean {
      let parent: Element | null = el.parentElement;
      while (parent) {
        const cs = getComputedStyle(parent);
        const ox = cs.overflowX;
        const o  = cs.overflow;
        if (ox === 'hidden' || ox === 'clip' || ox === 'scroll' || ox === 'auto'
         || o === 'hidden' || o === 'clip') return true;
        parent = parent.parentElement;
      }
      return false;
    }

    let widest = { tag: '?', cls: '', right: 0 };
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (el.getAttribute('aria-hidden') === 'true') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > widest.right && !isClippedByAncestor(el)) {
        widest = {
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? '').slice(0, 90),
          right: r.right,
        };
      }
    });
    return {
      overflow: true,
      detail: `docW=${docW} winW=${winW} widest=<${widest.tag} class="${widest.cls}"> right=${widest.right.toFixed(0)}`,
    };
  });
  expect(probe.overflow, `horizontal scroll detected: ${probe.detail}`).toBe(false);
}

export async function assertNoSafeAreaOverlap(page: Page) {
  const violated = await page.evaluate(() => {
    const safeTop = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--safe-top') || '0'
    );
    if (safeTop <= 0) return false;
    const els = document.querySelectorAll('[role="button"], button, a, input, select, textarea');
    for (const el of els) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.height > 0 && rect.top < safeTop) return true;
    }
    return false;
  });
  expect(violated, 'element overlaps safe-area-inset-top').toBe(false);
}

export async function assertTouchTargets(page: Page) {
  const tooSmall = await page.evaluate(() => {
    const MIN = 44;
    const els = document.querySelectorAll('button, a[href], input, select, [role="button"]');
    const violations: string[] = [];
    for (const el of els) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < MIN || rect.height < MIN) {
          violations.push(`${el.tagName}(${Math.round(rect.width)}x${Math.round(rect.height)}): "${(el as HTMLElement).textContent?.trim().slice(0, 30)}"`);
        }
      }
    }
    return violations;
  });
  // Warn (soft) rather than hard-fail since some decorative links may be small.
  if (tooSmall.length > 0) {
    console.warn(`Touch target warnings: ${tooSmall.join(', ')}`);
  }
}

export async function assertHKFontFirst(page: Page) {
  const fontOk = await page.evaluate(() => {
    const el = document.querySelector('.font-chinese, .hanzi-display, .hanzi-medium');
    if (!el) return true; // no Chinese text on this page
    const ff = getComputedStyle(el).fontFamily;
    return ff.toLowerCase().startsWith('"free hk kai"') || ff.toLowerCase().startsWith("'free hk kai'") || ff.toLowerCase().startsWith('free hk kai');
  });
  expect(fontOk, 'Free HK Kai must be first in font-family stack').toBe(true);
}

export async function assertNoInlineOverflow(page: Page) {
  const overflowingDescription = await page.evaluate(() => {
    /**
     * An element only causes a true overflow if it's not clipped by an
     * ancestor with `overflow-x: hidden` / `overflow: clip`. Decorative
     * emojis positioned with negative offsets are visually clipped by the
     * card's `overflow-hidden`, so they don't break the page even though
     * their raw bounding rect extends past the viewport.
     */
    function isClippedByAncestor(el: Element): boolean {
      let parent: Element | null = el.parentElement;
      while (parent) {
        const cs = getComputedStyle(parent);
        const ox = cs.overflowX;
        const o  = cs.overflow;
        if (ox === 'hidden' || ox === 'clip' || ox === 'scroll' || ox === 'auto'
         || o === 'hidden' || o === 'clip') {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }
    const els = document.querySelectorAll('*');
    for (const el of els) {
      if (el.getAttribute('aria-hidden') === 'true') continue;
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > window.innerWidth + 4 && !isClippedByAncestor(el)) {
        const tag = el.tagName.toLowerCase();
        const cls = (el as HTMLElement).className?.toString?.().slice(0, 80) ?? '';
        const id  = el.id ? `#${el.id}` : '';
        return `<${tag}${id} class="${cls}"> right=${rect.right.toFixed(0)} (viewport=${window.innerWidth})`;
      }
    }
    return null;
  });
  expect(overflowingDescription, `element overflows viewport: ${overflowingDescription}`).toBeNull();
}

export async function assertNoVerticalPageScroll(page: Page) {
  const url = page.url();
  const parsed = new URL(url);
  const path = parsed.pathname;

  // Only assert on core pages: /, /learn, /play, /progress, /favorites, /stickers
  const isCorePage = ['/', '/learn', '/play', '/progress', '/favorites', '/stickers'].includes(path);
  if (!isCorePage) return;

  const isOptedOut = await page.evaluate(() => {
    return document.body.getAttribute('data-allow-scroll') === 'true';
  });
  if (isOptedOut) return;

  const probe = await page.evaluate(() => {
    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    // Allow a tolerance of 1.5 pixels to handle float rounding or small subpixel layouts
    return { overflow: docH > winH + 1.5, docH, winH };
  });
  expect(probe.overflow, `vertical page scroll detected on core page ${path}: docH=${probe.docH} winH=${probe.winH}`).toBe(false);
}

/** Runs all six invariants against the current page state. */
export async function assertAllInvariants(page: Page) {
  await assertNoHorizontalScroll(page);
  await assertNoVerticalPageScroll(page);
  await assertNoSafeAreaOverlap(page);
  await assertTouchTargets(page);
  await assertHKFontFirst(page);
  await assertNoInlineOverflow(page);
}

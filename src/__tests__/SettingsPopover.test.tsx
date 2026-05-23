import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ProgressPage from '@/app/progress/page';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/progress',
}));

// Mock getFavoritesCount
vi.mock('@/lib/favorites', () => ({
  getFavoritesCount: () => 3,
}));

// Mock loadRoot and storage
vi.mock('@/lib/storage', () => ({
  loadRoot: () => ({
    gamification: {
      xp: 150,
      streak: 5,
      garden: ['flower'],
      stickers: ['sticker_1'],
      quests: {
        lastRefreshDay: '2026-05-24',
        today: [],
      },
    },
    progress: {
      characters: {
        '一': { state: 'mastered', wins: 5, attempts: 5, lastReviewed: 12345 },
      },
      log: [],
    },
  }),
}));

describe('SettingsPopover on ProgressPage', () => {
  beforeEach(() => {
    // Stub native HTMLDialogElement methods in JSDOM
    HTMLDialogElement.prototype.showModal = function(this: HTMLDialogElement) {
      this.setAttribute('open', 'true');
    };
    HTMLDialogElement.prototype.close = function(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    
    // Mock global confirm and window.location.reload
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    
    // Setup reload spy
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { reload: reloadMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders settings trigger button on the ProgressPage', async () => {
    const { getByRole } = render(<ProgressPage />);
    
    // Wait for the client-side state to load
    await waitFor(() => {
      expect(getByRole('button', { name: '管理進度' })).toBeInTheDocument();
    });
  });

  it('calls showModal when clicking the settings trigger', async () => {
    const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const { getByRole } = render(<ProgressPage />);

    await waitFor(() => {
      const btn = getByRole('button', { name: '管理進度' });
      fireEvent.click(btn);
    });

    expect(showModalSpy).toHaveBeenCalled();
  });

  it('requires two clicks for Reset Progress (two-step confirmation)', async () => {
    const { getByRole } = render(<ProgressPage />);

    await waitFor(() => {
      const btn = getByRole('button', { name: '管理進度' });
      fireEvent.click(btn);
    });

    const resetButton = getByRole('button', { name: '🔄 重設進度' });
    expect(resetButton).toBeInTheDocument();

    // First click turns it into confirmation state
    fireEvent.click(resetButton);
    
    const confirmButton = getByRole('button', { name: '確定重設？再按一次確認' });
    expect(confirmButton).toBeInTheDocument();

    // Spy on localStorage clear/removeItem
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    // Second click triggers reload & removal
    fireEvent.click(confirmButton);
    expect(removeItemSpy).toHaveBeenCalledWith('cantoHanzi.v1');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('calls close when clicking close button in the dialog', async () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
    const { getByRole } = render(<ProgressPage />);

    await waitFor(() => {
      const btn = getByRole('button', { name: '管理進度' });
      fireEvent.click(btn);
    });

    const closeButton = getByRole('button', { name: '關閉' });
    fireEvent.click(closeButton);

    expect(closeSpy).toHaveBeenCalled();
  });
});

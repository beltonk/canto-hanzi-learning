import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PageScaffold from '@/app/components/ui/PageScaffold';
import { useViewport } from '@/lib/viewport/useViewport';

// Mock useViewport
vi.mock('@/lib/viewport/useViewport', () => ({
  useViewport: vi.fn(),
}));

const mockUseViewport = useViewport as unknown as ReturnType<typeof vi.fn>;

describe('PageScaffold', () => {
  beforeEach(() => {
    // Setup localStorage mock
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      for (const key in store) delete store[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const secondaryTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div data-testid="content1">Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div data-testid="content2">Content 2</div> },
  ];

  it('renders primary content in mobile portrait (xs)', () => {
    mockUseViewport.mockReturnValue({ width: 375, height: 667, breakpoint: 'xs' });

    const { getByText, getByTestId } = render(
      <PageScaffold
        primary={<div data-testid="primary-content">Primary</div>}
        secondary={secondaryTabs}
      />
    );

    expect(getByTestId('primary-content')).toBeInTheDocument();
    expect(getByText('Tab 1')).toBeInTheDocument();
    expect(getByText('Tab 2')).toBeInTheDocument();
  });

  it('defaults to first tab or specified defaultSelected', () => {
    mockUseViewport.mockReturnValue({ width: 375, height: 667, breakpoint: 'xs' });

    const { queryByTestId } = render(
      <PageScaffold
        primary={<div>Primary</div>}
        secondary={secondaryTabs}
        defaultSelected="tab2"
      />
    );

    const panel1 = queryByTestId('content1')?.parentElement;
    const panel2 = queryByTestId('content2')?.parentElement;

    expect(panel1).toHaveAttribute('hidden');
    expect(panel2).not.toHaveAttribute('hidden');
  });

  it('persists selected tab in localStorage when persistKey is provided', () => {
    mockUseViewport.mockReturnValue({ width: 375, height: 667, breakpoint: 'xs' });
    const key = 'test-persist-key';

    const { getByText, rerender, queryByTestId } = render(
      <PageScaffold
        primary={<div>Primary</div>}
        secondary={secondaryTabs}
        persistKey={key}
      />
    );

    // Initial render defaults to first tab
    expect(queryByTestId('content1')?.parentElement).not.toHaveAttribute('hidden');

    // Click Tab 2
    fireEvent.click(getByText('Tab 2'));
    expect(localStorage.getItem(key)).toBe('tab2');

    // Re-render should recover from localStorage
    rerender(
      <PageScaffold
        primary={<div>Primary</div>}
        secondary={secondaryTabs}
        persistKey={key}
      />
    );

    expect(queryByTestId('content2')?.parentElement).not.toHaveAttribute('hidden');
    expect(queryByTestId('content1')?.parentElement).toHaveAttribute('hidden');
  });

  it('supports keyboard navigation via ARIA arrow keys', () => {
    mockUseViewport.mockReturnValue({ width: 375, height: 667, breakpoint: 'xs' });

    const { getByRole, queryByTestId } = render(
      <PageScaffold
        primary={<div>Primary</div>}
        secondary={secondaryTabs}
      />
    );

    const tab1 = getByRole('tab', { name: 'Tab 1' });

    tab1.focus();
    expect(tab1).toHaveFocus();

    // Arrow Right to go to Tab 2
    fireEvent.keyDown(tab1, { key: 'ArrowRight' });
    expect(queryByTestId('content2')?.parentElement).not.toHaveAttribute('hidden');

    const tab2 = getByRole('tab', { name: 'Tab 2' });
    // Home key to jump back to Tab 1
    fireEvent.keyDown(tab2, { key: 'Home' });
    expect(queryByTestId('content1')?.parentElement).not.toHaveAttribute('hidden');
  });

  it('displays tabs stacked vertically in aside column on desktop (lg+)', () => {
    mockUseViewport.mockReturnValue({ width: 1200, height: 800, breakpoint: 'lg' });

    const { getByText, getByTestId, queryByRole } = render(
      <PageScaffold
        primary={<div>Primary</div>}
        secondary={secondaryTabs}
        aside={<div data-testid="custom-aside">Aside</div>}
      />
    );

    // In desktop view, role="tablist" is NOT rendered because tabs are stacked vertically
    expect(queryByRole('tablist')).toBeNull();

    // Verify all tabs are fully rendered simultaneously
    expect(getByText('Content 1')).toBeInTheDocument();
    expect(getByText('Content 2')).toBeInTheDocument();
    expect(getByTestId('custom-aside')).toBeInTheDocument();
  });

  it('sets data-allow-scroll="false" on document body by default', () => {
    mockUseViewport.mockReturnValue({ width: 375, height: 667, breakpoint: 'xs' });

    const { unmount } = render(
      <PageScaffold primary={<div>Primary</div>} />
    );

    expect(document.body.getAttribute('data-allow-scroll')).toBe('false');

    unmount();
    expect(document.body.getAttribute('data-allow-scroll')).toBeNull();
  });
});

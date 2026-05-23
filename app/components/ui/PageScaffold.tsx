'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useViewport } from '@/lib/viewport/useViewport';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface PageScaffoldProps {
  primary: React.ReactNode;
  secondary?: TabItem[];
  aside?: React.ReactNode;
  persistKey?: string;
  defaultSelected?: string;
}

export default function PageScaffold({
  primary,
  secondary = [],
  aside,
  persistKey,
  defaultSelected,
}: PageScaffoldProps) {
  const { breakpoint } = useViewport();
  const isDesktop = ['lg', 'xl', '2xl'].includes(breakpoint);

  // ARIA tablist state
  const [selectedTabId, setSelectedTabId] = useState<string>(() => {
    if (typeof window !== 'undefined' && persistKey) {
      const saved = localStorage.getItem(persistKey);
      if (saved && secondary.some(tab => tab.id === saved)) {
        return saved;
      }
    }
    return defaultSelected || (secondary[0]?.id ?? '');
  });

  const tabListRef = useRef<HTMLDivElement>(null);

  // Sync selected tab with defaultSelected when it changes
  useEffect(() => {
    if (defaultSelected && secondary.some(tab => tab.id === defaultSelected)) {
      Promise.resolve().then(() => {
        setSelectedTabId(prev => {
          // If already customized and persisted, prefer current selection
          if (persistKey && localStorage.getItem(persistKey)) {
            return prev;
          }
          return defaultSelected;
        });
      });
    }
  }, [defaultSelected, secondary, persistKey]);

  // Persist tab selection
  useEffect(() => {
    if (persistKey && selectedTabId) {
      localStorage.setItem(persistKey, selectedTabId);
    }
  }, [selectedTabId, persistKey]);

  // Disable page-level vertical scroll by default
  useEffect(() => {
    document.body.setAttribute('data-allow-scroll', 'false');
    document.documentElement.setAttribute('data-allow-scroll', 'false');
    return () => {
      document.body.removeAttribute('data-allow-scroll');
      document.documentElement.removeAttribute('data-allow-scroll');
    };
  }, []);

  // Keyboard navigation for ARIA tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (secondary.length === 0) return;

    let newIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = (index + 1) % secondary.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = (index - 1 + secondary.length) % secondary.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = secondary.length - 1;
    } else {
      return; // Let other keys propagate
    }

    e.preventDefault();
    const nextTab = secondary[newIndex];
    setSelectedTabId(nextTab.id);

    // Focus corresponding button
    const buttons = tabListRef.current?.querySelectorAll('[role="tab"]');
    if (buttons && buttons[newIndex]) {
      (buttons[newIndex] as HTMLElement).focus();
    }
  };

  // Compute scaffold height (100dvh - chrome top/bottom)
  const scaffoldStyle: React.CSSProperties = {
    height: 'calc(100dvh - var(--chrome-top, 56px) - var(--chrome-bottom, 0px))',
  };

  if (isDesktop) {
    // ═══════════════════════════════════════════════════════════════════
    // DESKTOP LAYOUT (lg+) — 2 or 3 Columns: Primary | Sidebar/Aside
    // ═══════════════════════════════════════════════════════════════════
    const hasAsideContent = aside || secondary.length > 0;

    return (
      <div
        className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0"
        style={scaffoldStyle}
      >
        {/* Left/Main Column: Primary */}
        <section
          aria-label="主要內容"
          className={`min-h-0 flex flex-col ${
            hasAsideContent ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin" style={{ overscrollBehavior: 'contain' }}>
            {primary}
          </div>
        </section>

        {/* Right Column: Sidebar / Stacked tabs & aside */}
        {hasAsideContent && (
          <aside
            aria-label="輔助內容"
            className="lg:col-span-4 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 pb-4 scrollbar-thin"
            style={{ overscrollBehavior: 'contain' }}
          >
            {secondary.map(tab => (
              <section
                key={tab.id}
                className="bg-white/85 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col min-h-0"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                  {tab.label}
                </h3>
                <div className="flex-1 min-h-0">
                  {tab.content}
                </div>
              </section>
            ))}
            {aside}
          </aside>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MOBILE / TABLET LAYOUT (<lg) — Vertical rows: Primary on top, Secondary tabs on bottom
  // ═══════════════════════════════════════════════════════════════════
  const hasSecondaryTabs = secondary.length > 0;

  return (
    <div
      className="w-full flex flex-col min-h-0 gap-3"
      style={scaffoldStyle}
    >
      {/* Top half: Primary content */}
      <section
        aria-label="主要內容"
        className={`min-h-0 flex flex-col ${hasSecondaryTabs ? 'flex-[1.2]' : 'flex-1'}`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin" style={{ overscrollBehavior: 'contain' }}>
          {primary}
        </div>
      </section>

      {/* Bottom half: Secondary tabs */}
      {hasSecondaryTabs && (
        <section
          aria-label="輔助分頁"
          className="flex-1 min-h-0 flex flex-col bg-white/70 dark:bg-slate-800/50 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden"
        >
          {/* Tab Strip */}
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="輔助內容分頁"
            className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto scrollbar-none shrink-0"
          >
            {secondary.map((tab, idx) => {
              const active = tab.id === selectedTabId;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSelectedTabId(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 text-center transition-all focus-visible:outline-2 focus-visible:outline-indigo-500 min-h-11 ${
                    active
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Panels */}
          <div className="flex-1 min-h-0 relative">
            {secondary.map(tab => {
              const active = tab.id === selectedTabId;
              return (
                <div
                  key={tab.id}
                  id={`panel-${tab.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${tab.id}`}
                  tabIndex={0}
                  hidden={!active}
                  className="absolute inset-0 overflow-y-auto p-3 sm:p-4 scrollbar-thin focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-1"
                  style={{ overscrollBehavior: 'contain' }}
                >
                  {tab.content}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

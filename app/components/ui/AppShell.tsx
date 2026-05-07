'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { loadRoot } from '@/lib/storage';
import { levelForXp } from '@/lib/gamification/levelCurve';
import { getFavoritesCount } from '@/lib/favorites';

interface AppShellProps {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  /** Custom back action; if not given, navigates to '/' */
  onBack?: () => void;
  /** If true, hides the back button (used on home page only) */
  hideBack?: boolean;
  /** Right side content (e.g. settings, filter button) */
  rightSlot?: React.ReactNode;
  /** Background gradient — defaults to indigo→purple */
  bg?: 'indigo' | 'sky' | 'rose' | 'amber' | 'emerald' | 'pink';
  /** When true, renders as a 100vh shell with no scroll */
  fillHeight?: boolean;
}

const BG_GRADIENTS: Record<NonNullable<AppShellProps['bg']>, string> = {
  indigo:  'from-indigo-50 via-white to-purple-50',
  sky:     'from-sky-50 via-white to-cyan-50',
  rose:    'from-rose-50 via-white to-pink-50',
  amber:   'from-amber-50 via-white to-orange-50',
  emerald: 'from-emerald-50 via-white to-teal-50',
  pink:    'from-pink-50 via-white to-rose-50',
};

const NAV_ITEMS: Array<{ href: string; emoji: string; label: string }> = [
  { href: '/',                  emoji: '🏠', label: '首頁' },
  { href: '/learn/explore',     emoji: '🔍', label: '查字' },
  { href: '/learn/flashcard',   emoji: '🃏', label: '字卡' },
  { href: '/learn/decompose',   emoji: '🧩', label: '拆字' },
  { href: '/learn/dictation',   emoji: '✏️', label: '默書' },
  { href: '/learn/trace',       emoji: '🖌️', label: '筆順' },
  { href: '/play',              emoji: '🎮', label: '遊戲' },
  { href: '/favorites',         emoji: '❤️', label: '我的收藏' },
  { href: '/progress',          emoji: '📊', label: '進度' },
];

export default function AppShell({
  title,
  emoji,
  children,
  onBack,
  hideBack,
  rightSlot,
  bg = 'indigo',
  fillHeight = false,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [showQuickNav, setShowQuickNav] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const root = loadRoot();
      const { level: lv } = levelForXp(root.gamification.xp);
      setLevel(lv);
      setXp(root.gamification.xp);
      setStreak(root.gamification.streak);
      setFavCount(getFavoritesCount());
    });
  }, [pathname]);

  const handleBack = () => {
    if (onBack) onBack();
    else router.push('/');
  };

  return (
    <div className={`${fillHeight ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-gradient-to-br ${BG_GRADIENTS[bg]} flex flex-col`}>
      {/*
        Sticky top app bar.
        Layout is intentionally STABLE across all pages:
          [☰ menu] [emoji + title] [pills] [right]
        The back button is rendered as a separate floating chip BELOW the bar
        on non-home pages, so the menu/title/pills never shift position.
      */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <div className="flex items-center gap-2 sm:gap-3 h-14">
            {/* Quick-nav burger — always leftmost, always present */}
            <button
              onClick={() => setShowQuickNav(!showQuickNav)}
              className={`w-10 h-10 rounded-xl active:scale-95 transition-all flex items-center justify-center text-lg shrink-0 ${
                showQuickNav ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="選單"
              aria-expanded={showQuickNav}
              title="快速導航"
            >
              ☰
            </button>

            {/* Title — clickable goes home */}
            <Link
              href="/"
              className="flex-1 min-w-0 flex items-center gap-2 truncate hover:opacity-80 transition-opacity"
              title="返回首頁"
            >
              {emoji && <span className="text-xl sm:text-2xl shrink-0">{emoji}</span>}
              <h1 className="text-base sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
            </Link>

            {/* Status pills */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href="/favorites"
                className="px-2.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-sm flex items-center gap-1.5 font-semibold text-pink-700 hover:bg-pink-100 transition-colors"
                title="我的收藏"
              >
                ❤️ <span className="tabular-nums">{favCount}</span>
              </Link>
              <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm flex items-center gap-1.5 font-semibold text-amber-700">
                ⭐ <span>Lv.{level}</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-sm flex items-center gap-1.5 font-semibold text-rose-700">
                🔥 <span>{streak}</span>
              </div>
            </div>

            {rightSlot && <div className="shrink-0">{rightSlot}</div>}
          </div>

          {/* Mobile pill row */}
          <div className="sm:hidden flex items-center gap-2 pb-2 overflow-x-auto scrollbar-thin">
            <Link
              href="/favorites"
              className="px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-xs flex items-center gap-1 font-semibold text-pink-700 shrink-0"
            >
              ❤️ {favCount}
            </Link>
            <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs flex items-center gap-1 font-semibold text-amber-700 shrink-0">
              ⭐ Lv.{level}
            </div>
            <div className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs flex items-center gap-1 font-semibold text-rose-700 shrink-0">
              🔥 {streak}
            </div>
            <div className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs flex items-center gap-1 font-semibold text-indigo-700 shrink-0">
              💎 {xp} XP
            </div>
          </div>
        </div>

        {/* Drop-down quick nav */}
        {showQuickNav && (
          <div className="border-t border-slate-200 bg-white shadow-md animate-fade-in">
            <div className="container mx-auto px-3 sm:px-4 max-w-6xl py-3">
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {NAV_ITEMS.map(item => {
                  const active = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowQuickNav(false)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all active:scale-95 ${
                        active
                          ? 'bg-indigo-100 text-indigo-700 shadow-sm font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/*
        Floating back chip — sits just below the header on non-home pages.
        Lives outside the title bar so the bar layout never changes.
      */}
      {!hideBack && (
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl pt-2 sm:pt-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-slate-200 text-slate-700 text-sm font-medium shadow-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-700 active:scale-95 transition-all"
            aria-label="返回"
          >
            <span className="text-base leading-none">←</span>
            <span>返回</span>
          </button>
        </div>
      )}

      {/* Main content area */}
      <main className={`flex-1 ${fillHeight ? 'overflow-hidden' : ''}`}>
        {children}
      </main>
    </div>
  );
}

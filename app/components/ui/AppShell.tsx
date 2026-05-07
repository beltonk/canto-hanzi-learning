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
  onBack?: () => void;
  hideBack?: boolean;
  rightSlot?: React.ReactNode;
  bg?: 'indigo' | 'sky' | 'rose' | 'amber' | 'emerald' | 'pink';
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

// Colours for each nav item active state
const NAV_ITEMS: Array<{ href: string; emoji: string; label: string; activeColor: string; activeBg: string; dot: string }> = [
  { href: '/',                emoji: '🏠', label: '首頁',    activeColor: 'text-indigo-700', activeBg: 'bg-indigo-100',  dot: 'bg-indigo-500'  },
  { href: '/learn/explore',   emoji: '🔍', label: '查字',    activeColor: 'text-sky-700',    activeBg: 'bg-sky-100',     dot: 'bg-sky-500'     },
  { href: '/learn/flashcard', emoji: '🃏', label: '字卡',    activeColor: 'text-purple-700', activeBg: 'bg-purple-100',  dot: 'bg-purple-500'  },
  { href: '/learn/decompose', emoji: '🧩', label: '拆字',    activeColor: 'text-teal-700',   activeBg: 'bg-teal-100',    dot: 'bg-teal-500'    },
  { href: '/learn/dictation', emoji: '✏️', label: '默書',    activeColor: 'text-rose-700',   activeBg: 'bg-rose-100',    dot: 'bg-rose-500'    },
  { href: '/learn/trace',     emoji: '🖌️', label: '筆順',    activeColor: 'text-fuchsia-700',activeBg: 'bg-fuchsia-100', dot: 'bg-fuchsia-500' },
  { href: '/play',            emoji: '🎮', label: '遊戲',    activeColor: 'text-orange-700', activeBg: 'bg-orange-100',  dot: 'bg-orange-500'  },
  { href: '/favorites',       emoji: '❤️', label: '我的收藏', activeColor: 'text-pink-700',   activeBg: 'bg-pink-100',    dot: 'bg-pink-500'    },
  { href: '/progress',        emoji: '📊', label: '進度',    activeColor: 'text-emerald-700',activeBg: 'bg-emerald-100', dot: 'bg-emerald-500' },
];

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

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
    /* Outer shell — on md+ we use a left sidebar so we go side-by-side */
    <div className={`${fillHeight ? 'h-dvh min-h-dvh' : 'min-h-dvh'} bg-gradient-to-br ${BG_GRADIENTS[bg]} flex flex-col lg:flex-row`}>

      {/* ─── LEFT SIDEBAR (md+) ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-dvh z-30
                        bg-white border-r border-slate-200 shadow-sm overflow-y-auto">
        {/* Logo / home link */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 hover:bg-indigo-50 transition-colors"
          title="粵語漢字學習"
        >
          <span className="text-3xl shrink-0">📖</span>
          <span className="hidden lg:block text-sm font-bold text-indigo-700 leading-tight">
            粵語漢字學習
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-3">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl font-semibold transition-all active:scale-95
                  ${active
                    ? `${item.activeBg} ${item.activeColor} shadow-sm`
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-2xl shrink-0 leading-none">{item.emoji}</span>
                <span className="hidden lg:block text-sm">{item.label}</span>
                {item.href === '/favorites' && favCount > 0 && (
                  <span className="hidden lg:flex ml-auto text-xs font-bold bg-pink-500 text-white rounded-full w-5 h-5 items-center justify-center">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status at the bottom */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-base">⭐</span>
            <span className="hidden lg:block text-xs font-bold text-amber-700">Lv.{level}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-base">🔥</span>
            <span className="hidden lg:block text-xs font-bold text-rose-700">{streak} 天連續</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="text-base">💎</span>
            <span className="hidden lg:block text-xs font-bold text-indigo-700">{xp} XP</span>
          </div>
        </div>
      </aside>

      {/* ─── RIGHT CONTENT COLUMN ───────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${fillHeight ? 'overflow-hidden' : ''}`}>

        {/* ── TOP BAR (all viewports) ─────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 h-14 px-3 sm:px-4">

            {/* Back button or left spacer */}
            {!hideBack ? (
              <button
                onClick={handleBack}
                className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center
                           bg-slate-100 text-slate-700 text-xl font-bold
                           hover:bg-indigo-100 hover:text-indigo-700 active:scale-90 transition-all"
                aria-label="返回"
              >
                ←
              </button>
            ) : (
              /* Placeholder so title stays centred on mobile */
              <div className="shrink-0 w-10 h-10 lg:hidden" />
            )}

            {/* Page title */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {emoji && <span className="text-2xl shrink-0 leading-none">{emoji}</span>}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
            </div>

            {/* Status pills — visible sm+ */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href="/favorites"
                className="px-3 py-1.5 rounded-full bg-pink-100 border border-pink-300
                           text-sm font-bold text-pink-700 flex items-center gap-1.5
                           hover:bg-pink-200 transition-colors"
                title="我的收藏"
              >
                ❤️ <span className="tabular-nums">{favCount}</span>
              </Link>
              <div className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-sm font-bold text-amber-700 flex items-center gap-1.5">
                ⭐ Lv.{level}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-rose-100 border border-rose-300 text-sm font-bold text-rose-700 flex items-center gap-1.5">
                🔥 {streak}
              </div>
            </div>

            {rightSlot && <div className="shrink-0">{rightSlot}</div>}
          </div>

          {/* Mobile status strip */}
          <div className="lg:hidden flex items-center gap-1.5 px-3 pb-2 overflow-x-auto">
            <Link
              href="/favorites"
              className="shrink-0 px-2.5 py-1 rounded-full bg-pink-100 border border-pink-300
                         text-xs font-bold text-pink-700 flex items-center gap-1"
            >
              ❤️ {favCount}
            </Link>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-bold text-amber-700">
              ⭐ Lv.{level}
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-xs font-bold text-rose-700">
              🔥 {streak}
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-xs font-bold text-indigo-700">
              💎 {xp} XP
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <main className={`flex-1 flex flex-col min-h-0 px-3 sm:px-4 pt-3 sm:pt-4 ${fillHeight ? 'overflow-hidden' : ''} pb-[156px] lg:pb-4`}>
          {children}
        </main>
      </div>

      {/* ─── BOTTOM TAB BAR (mobile only, < md) ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30
                      bg-white/95 backdrop-blur-lg border-t-2 border-slate-200
                      shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
        {/* Show 5 primary items; keep it uncluttered */}
        <div className="grid grid-cols-5 h-[72px]">
          {NAV_ITEMS.slice(0, 5).map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90
                  ${active ? item.activeColor : 'text-slate-500'}`}
              >
                <span className={`text-[28px] leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.emoji}
                </span>
                <span className={`text-[11px] font-bold leading-none ${active ? '' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {active && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.dot}`} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Second row for overflow items */}
        <div className="grid grid-cols-4 border-t border-slate-100 h-[64px]">
          {NAV_ITEMS.slice(5).map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative
                  ${active ? item.activeColor : 'text-slate-500'}`}
              >
                <span className={`text-[24px] leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.emoji}
                </span>
                <span className={`text-[11px] font-bold leading-none ${active ? '' : 'text-slate-400'}`}>
                  {item.label === '我的收藏' ? '收藏' : item.label}
                </span>
                {item.href === '/favorites' && favCount > 0 && (
                  <span className="absolute top-1 right-3 text-[10px] font-bold bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
                {active && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.dot}`} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

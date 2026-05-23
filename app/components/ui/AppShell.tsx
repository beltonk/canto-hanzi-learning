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

const NAV_ITEMS = [
  { href: '/',                emoji: '🏠', label: '首頁',  activeColor: 'text-indigo-700', activeBg: 'bg-indigo-100',  dot: 'bg-indigo-500'  },
  { href: '/learn',           emoji: '📚', label: '學習',  activeColor: 'text-sky-700',    activeBg: 'bg-sky-100',     dot: 'bg-sky-500'     },
  { href: '/play',            emoji: '🎮', label: '遊戲',  activeColor: 'text-orange-700', activeBg: 'bg-orange-100',  dot: 'bg-orange-500'  },
  { href: '/favorites',       emoji: '❤️', label: '收藏',  activeColor: 'text-pink-700',   activeBg: 'bg-pink-100',    dot: 'bg-pink-500'    },
  { href: '/progress',        emoji: '📊', label: '進度',  activeColor: 'text-emerald-700',activeBg: 'bg-emerald-100', dot: 'bg-emerald-500' },
] as const;

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href === '/progress') {
    return pathname.startsWith('/progress') || pathname.startsWith('/stickers');
  }
  return pathname.startsWith(href);
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
  const router  = useRouter();
  const pathname = usePathname();
  const [level,    setLevel]    = useState(1);
  const [xp,       setXp]       = useState(0);
  const [streak,   setStreak]   = useState(0);
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

  /* ─── bottom-tab bottom padding
     phone portrait  → single-row bar ~72 px + safe-area
     phone landscape → top-tabs, no bottom bar
     iPad portrait   → icon rail, no bottom bar
     iPad landscape+ → full sidebar, no bottom bar                         */
  const mainPb = 'pb-[92px] landscape:pb-4 md:pb-4';

  return (
    <div className={`${fillHeight ? 'h-dvh min-h-dvh' : 'min-h-dvh'} bg-gradient-to-br ${BG_GRADIENTS[bg]} flex flex-col md:flex-row`}>

      {/* ═══════════════════════════════════════════════════════════════════
          NAV VARIANT A: FULL SIDEBAR — iPad landscape + desktop (lg+)
          ═══════════════════════════════════════════════════════════════════ */}
      <aside
        aria-label="主導覽"
        className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-dvh z-30
                   bg-white border-r border-slate-200 shadow-sm overflow-y-auto"
      >
        <Link
          href="/"
          aria-label="粵語漢字學習 — 首頁"
          className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 hover:bg-indigo-50 transition-colors"
        >
          <span className="text-3xl shrink-0">📖</span>
          <span className="text-sm font-bold text-indigo-700 leading-tight">粵語漢字學習</span>
        </Link>

        <nav aria-label="學習頁面" className="flex-1 flex flex-col gap-1 p-2 pt-3">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl font-semibold transition-all active:scale-95 min-h-11
                  focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2
                  ${active
                    ? `${item.activeBg} ${item.activeColor} shadow-sm`
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-2xl shrink-0 leading-none">{item.emoji}</span>
                <span className="text-sm">{item.label}</span>
                {item.href === '/favorites' && favCount > 0 && (
                  <span className="ml-auto text-xs font-bold bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-base">⭐</span>
            <span className="text-xs font-bold text-amber-700">Lv.{level}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-base">🔥</span>
            <span className="text-xs font-bold text-rose-700">{streak} 天連續</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="text-base">💎</span>
            <span className="text-xs font-bold text-indigo-700">{xp} XP</span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          NAV VARIANT B: ICON RAIL — iPad portrait / split-view (md, not lg)
          Hidden on xs/sm (phones), hidden on lg+ (full sidebar takes over)
          ═══════════════════════════════════════════════════════════════════ */}
      <aside
        aria-label="主導覽"
        className="hidden md:flex lg:hidden flex-col w-16 shrink-0 sticky top-0 h-dvh z-30
                   bg-white border-r border-slate-200 shadow-sm overflow-y-auto"
      >
        <Link
          href="/"
          aria-label="粵語漢字學習 — 首頁"
          className="flex items-center justify-center py-4 border-b border-slate-100 hover:bg-indigo-50 transition-colors"
        >
          <span className="text-2xl">📖</span>
        </Link>

        <nav aria-label="學習頁面" className="flex-1 flex flex-col gap-1 p-1.5 pt-2">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl mx-auto transition-all active:scale-90
                  focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2
                  ${active
                    ? `${item.activeBg} ${item.activeColor} shadow-sm`
                    : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                <span className="text-[22px] leading-none">{item.emoji}</span>
                {item.href === '/favorites' && favCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-pink-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-1.5 border-t border-slate-100 flex flex-col gap-1 items-center">
          <div title={`Level ${level}`} className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-base">⭐</div>
          <div title={`${streak} 天連續`} className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-base">🔥</div>
        </div>
      </aside>

      {/* ─── RIGHT CONTENT COLUMN ─────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${fillHeight ? 'overflow-hidden' : ''}`}>

        {/* ═══════════════════════════════════════════════════════════════
            NAV VARIANT C: TOP TABS — phone landscape
            Visible only on xs/sm in landscape orientation.
            `landscape:flex` + `md:hidden` + `portrait:hidden`
            ═══════════════════════════════════════════════════════════════ */}
        <nav
          aria-label="主導覽"
          className="hidden max-md:landscape:flex
                     sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm
                     overflow-x-auto scrollbar-none"
          style={{ paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)', paddingTop: 'var(--safe-top)' }}
        >
          <div className="flex items-center gap-0.5 px-2 h-11 min-w-max">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-xl font-semibold text-xs whitespace-nowrap transition-all active:scale-90 shrink-0
                    focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-1
                    ${active
                      ? `${item.activeBg} ${item.activeColor} shadow-sm`
                      : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  <span className="text-lg leading-none">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── STICKY HEADER (all viewports) ─────────────────────────── */}
        <header
          className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm
                     landscape:top-11 md:landscape:top-0"
          style={{ paddingTop: 'var(--safe-top)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 h-14 px-3 sm:px-4" style={{ paddingLeft: 'max(12px, var(--safe-left))', paddingRight: 'max(12px, var(--safe-right))' }}>

            {!hideBack ? (
              <button
                onClick={handleBack}
                aria-label="返回"
                className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center
                           bg-slate-100 text-slate-700 text-xl font-bold
                           hover:bg-indigo-100 hover:text-indigo-700 active:scale-90 transition-all
                           focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
              >
                ←
              </button>
            ) : (
              <div className="shrink-0 w-11 h-11 lg:hidden" />
            )}

            <div className="flex-1 min-w-0 flex items-center gap-2">
              {emoji && <span className="text-2xl shrink-0 leading-none">{emoji}</span>}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
            </div>

            {/* Status pills — sm+ only (hidden on tiny phones) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href="/favorites"
                aria-label={`我的收藏，共 ${favCount} 項`}
                className="px-3 py-1.5 rounded-full bg-pink-100 border border-pink-300
                           text-sm font-bold text-pink-700 flex items-center gap-1.5
                           hover:bg-pink-200 transition-colors min-h-11"
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

          {/* Status strip — phones in portrait only (hidden in landscape where top-tabs show status) */}
          {pathname !== '/' && (
            <div
              className="hidden max-md:portrait:flex items-center gap-1.5 px-3 pb-2 overflow-x-auto"
              style={{ paddingLeft: 'max(12px, var(--safe-left))', paddingRight: 'max(12px, var(--safe-right))' }}
            >
              <Link
                href="/favorites"
                aria-label={`我的收藏 ${favCount} 項`}
                className="shrink-0 px-2.5 py-1 rounded-full bg-pink-100 border border-pink-300
                           text-xs font-bold text-pink-700 flex items-center gap-1 min-h-11
                           focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
              >
                ❤️ {favCount}
              </Link>
              <div className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-bold text-amber-700 inline-flex items-center min-h-11">
                ⭐ Lv.{level}
              </div>
              <div className="shrink-0 px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-xs font-bold text-rose-700 inline-flex items-center min-h-11">
                🔥 {streak}
              </div>
              <div className="shrink-0 px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-xs font-bold text-indigo-700 inline-flex items-center min-h-11">
                💎 {xp} XP
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className={`flex-1 flex flex-col min-h-0 px-3 sm:px-4 pt-3 sm:pt-4 ${fillHeight ? 'overflow-hidden' : ''} ${mainPb}`}>
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          NAV VARIANT D: BOTTOM TABS — phone portrait only
          Hidden on landscape (xs/sm landscape uses top tabs instead).
          Hidden on md+ (iPad uses icon rail or full sidebar).
          ═══════════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="主導覽"
        className="hidden max-md:portrait:flex flex-col fixed bottom-0 inset-x-0 z-30
                   bg-white/95 backdrop-blur-lg border-t-2 border-slate-200
                   shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {/* Row 1 — 5 primary items */}
        <div className="grid grid-cols-5 h-[72px]">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative
                  focus-visible:outline-2 focus-visible:outline-indigo-500
                  ${active ? item.activeColor : 'text-slate-500'}`}
              >
                <span className={`text-[28px] leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.emoji}
                </span>
                <span className={`text-[11px] font-bold leading-none ${active ? '' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {item.href === '/favorites' && favCount > 0 && (
                  <span className="absolute top-1.5 right-[15%] text-[10px] font-bold bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
                {active && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.dot}`} />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold from '@/app/components/ui/PageScaffold';
import { loadRoot } from '@/lib/storage';
import { getDueCharacters } from '@/lib/progress/srs';

interface HubTile {
  href: string;
  emoji: string;
  label: string;
  description: string;
  gradient: string;
  ring: string;
  text: string;
}

const BASE_TILES: HubTile[] = [
  {
    href: '/learn/explore',
    emoji: '🔍',
    label: '查字 · 認字',
    description: '搜尋字／部首／筆畫，認識漢字',
    gradient: 'from-rose-400 to-pink-500',
    ring: 'ring-rose-200',
    text: 'text-white',
  },
  {
    href: '/learn/flashcard',
    emoji: '🃏',
    label: '字卡溫習',
    description: '翻卡學習，鞏固記憶',
    gradient: 'from-sky-400 to-cyan-500',
    ring: 'ring-sky-200',
    text: 'text-white',
  },
  {
    href: '/learn/decompose',
    emoji: '🧩',
    label: '拆字遊戲',
    description: '拆解部件，理解字形',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-200',
    text: 'text-white',
  },
  {
    href: '/learn/dictation',
    emoji: '✏️',
    label: '默書練習',
    description: '聆聽發音，寫出正字',
    gradient: 'from-amber-400 to-orange-500',
    ring: 'ring-amber-200',
    text: 'text-white',
  },
  {
    href: '/learn/trace',
    emoji: '🖌️',
    label: '筆順練習',
    description: '用手指依筆順書寫',
    gradient: 'from-indigo-400 to-purple-500',
    ring: 'ring-indigo-200',
    text: 'text-white',
  },
];

export default function LearnHub() {
  const [dueChars, setDueChars] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Defer loading storage to client side
    Promise.resolve().then(() => {
      const root = loadRoot();
      const due = getDueCharacters(root.progress.characters, 12);
      setDueChars(due);
      setIsLoaded(true);
    });
  }, []);

  const dueCount = dueChars.length;

  const reviewTile: HubTile = isLoaded && dueCount > 0
    ? {
        href: `/learn/flashcard?chars=${encodeURIComponent(dueChars.join(','))}&title=${encodeURIComponent('今日要複習')}`,
        emoji: '⏰',
        label: '今日要複習',
        description: `有 ${dueCount} 個字待溫習，點擊開始！`,
        gradient: 'from-fuchsia-500 to-pink-600',
        ring: 'ring-fuchsia-200',
        text: 'text-white',
      }
    : {
        href: '/learn/explore',
        emoji: '🌟',
        label: '全部溫完',
        description: '今日無待複習字，去查新字吧！',
        gradient: 'from-slate-400 to-slate-500',
        ring: 'ring-slate-200',
        text: 'text-white',
      };

  const tiles = [...BASE_TILES, reviewTile];

  return (
    <AppShell title="學習" emoji="📚" hideBack bg="indigo">
      <PageScaffold
        primary={
          <div className="w-full h-full flex flex-col min-h-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 shrink-0">
              選擇你的學習活動 🚀
            </h2>

            <nav
              role="navigation"
              aria-label="學習活動"
              className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 gap-3 sm:gap-4"
            >
              {tiles.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  aria-label={`${tile.label} — ${tile.description}`}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.gradient} shadow-md hover:shadow-xl active:scale-95 transition-all p-4 sm:p-5 ring-4 ring-transparent hover:${tile.ring} flex flex-col justify-between min-h-[110px] sm:min-h-0`}
                >
                  {/* Decorative background emoji */}
                  <div
                    aria-hidden="true"
                    className="absolute -right-3 -bottom-4 text-7xl sm:text-8xl opacity-20 select-none pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6"
                  >
                    {tile.emoji}
                  </div>

                  <div className="relative">
                    <div className="text-3xl sm:text-4xl mb-1.5">{tile.emoji}</div>
                    <div className={`font-bold text-sm sm:text-base md:text-lg ${tile.text} leading-snug mb-0.5`}>
                      {tile.label}
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <div className="text-[11px] sm:text-xs text-white/90 leading-tight">
                      {tile.description}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        }
      />
    </AppShell>
  );
}

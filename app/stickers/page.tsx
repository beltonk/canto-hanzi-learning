'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold, { type TabItem } from '@/app/components/ui/PageScaffold';
import { loadRoot } from '@/lib/storage';
import StickerThumb from '@/app/components/ui/StickerThumb';

const ALL_STICKERS = Array.from({ length: 20 }, (_, i) => `sticker_${i + 1}`);

export default function StickersPage() {
  const [unlockedStickers, setUnlockedStickers] = useState<string[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => {
      const root = loadRoot();
      setUnlockedStickers(root.gamification.stickers);
    });
  }, []);

  const pct = Math.round((unlockedStickers.length / ALL_STICKERS.length) * 100);

  const headerPill = (
    <div className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-xs font-bold text-amber-700 flex items-center gap-1 shadow-sm">
      🏅 <span className="tabular-nums">{unlockedStickers.length}/{ALL_STICKERS.length} ({pct}%)</span>
    </div>
  );

  const secondaryTabs: TabItem[] = [
    {
      id: 'rewards',
      label: '🏅 貼紙成就',
      content: unlockedStickers.length === ALL_STICKERS.length ? (
        <div className="text-center py-4 bg-gradient-to-br from-amber-100 to-rose-100 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-amber-200 dark:border-amber-900 p-4">
          <div className="text-4xl mb-1.5">🎉</div>
          <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">恭喜！你已收集所有貼紙！</p>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">繼續學習，還有更多獎勵等你解鎖</p>
        </div>
      ) : (
        <div className="text-center py-4 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-amber-200 dark:border-amber-900 p-4">
          <div className="text-4xl mb-1.5">🔒</div>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm mb-3">完成活動、升級可解鎖更多貼紙！</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Link
              href="/play"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all min-h-8 inline-flex items-center"
            >
              🎮 去玩遊戲
            </Link>
            <Link
              href="/learn"
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 active:scale-95 transition-all min-h-8 inline-flex items-center"
            >
              📚 學習活動
            </Link>
          </div>
        </div>
      )
    }
  ];

  return (
    <AppShell title="貼紙簿" emoji="📚" bg="amber" rightSlot={headerPill}>
      <PageScaffold
        primary={
          <div className="w-full h-full flex flex-col min-h-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 shrink-0">
              我的收藏貼紙 🏆
            </h2>

            {/* Sticker grid with scroll container built into primary zone */}
            <div className="flex-1 min-h-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-amber-200 dark:border-amber-900 p-4 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 justify-items-center">
                {ALL_STICKERS.map(id => (
                  <div key={id} className="flex flex-col items-center gap-1">
                    <StickerThumb
                      id={id}
                      unlocked={unlockedStickers.includes(id)}
                      isNew={false}
                      size={56}
                    />
                    <div className="text-[10px] text-slate-500 dark:text-slate-450 font-bold">#{id.replace('sticker_', '')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        secondary={secondaryTabs}
      />
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
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

  return (
    <AppShell title="貼紙簿" emoji="📚" bg="amber">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        {/* Progress card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-white p-5 sm:p-6 shadow-lg mb-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold">我的收藏</h2>
            <div className="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur text-base font-bold">
              {unlockedStickers.length} / {ALL_STICKERS.length}
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-sm text-white/90 mt-2">完成 {pct}% — 繼續加油！</div>
        </div>

        {/* Sticker grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
            {ALL_STICKERS.map(id => (
              <div key={id} className="flex flex-col items-center gap-1">
                <StickerThumb
                  id={id}
                  unlocked={unlockedStickers.includes(id)}
                  isNew={false}
                  size={72}
                />
                <div className="text-xs text-slate-500 font-medium">#{id.replace('sticker_', '')}</div>
              </div>
            ))}
          </div>
        </div>

        {unlockedStickers.length === 0 && (
          <div className="mt-6 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-5xl mb-2">🔒</div>
            <p className="text-slate-700 mb-4 font-medium">完成活動、升級可解鎖貼紙！</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link
                href="/play"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
              >
                🎮 去玩遊戲
              </Link>
              <Link
                href="/learn/flashcard"
                className="px-5 py-2.5 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 active:scale-95 transition-all"
              >
                🃏 字卡學習
              </Link>
            </div>
          </div>
        )}

        {unlockedStickers.length === ALL_STICKERS.length && (
          <div className="mt-6 text-center bg-gradient-to-br from-amber-100 to-rose-100 rounded-2xl border border-amber-200 p-6">
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-slate-900 font-bold text-lg">恭喜！你已收集所有貼紙！</p>
            <p className="text-slate-600 text-sm mt-1">繼續學習，還有更多獎勵等你解鎖</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import { GAME_REGISTRY } from '@/app/components/games/registry';
import { loadRoot } from '@/lib/storage';

const TILE_GRADIENTS: string[] = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-emerald-500',
  'from-pink-400 to-fuchsia-500',
  'from-purple-400 to-indigo-500',
  'from-indigo-400 to-purple-500',
];

export default function PlayHub() {
  const [bestStars, setBestStars] = useState<Record<string, number>>({});
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.resolve().then(() => {
      const root = loadRoot();
      const stars: Record<string, number> = {};
      const counts: Record<string, number> = {};
      root.progress.log.forEach(e => {
        if (e.type === 'game' && e.gameId) {
          counts[e.gameId] = (counts[e.gameId] ?? 0) + 1;
          if (e.stars) stars[e.gameId] = Math.max(stars[e.gameId] ?? 0, e.stars);
        }
      });
      setBestStars(stars);
      setPlayCounts(counts);
    });
  }, []);

  const totalStars = useMemo(
    () => Object.values(bestStars).reduce((a, b) => a + b, 0),
    [bestStars],
  );
  const maxStars = GAME_REGISTRY.length * 3;

  return (
    <AppShell title="遊戲樂園" emoji="🎮" bg="pink">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-6xl">
        {/* Stars summary band */}
        <div className="mb-5 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-white p-4 sm:p-5 shadow-lg flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">收集星星 ⭐</h2>
            <p className="text-sm text-white/90">玩遊戲拿三星，學中文同時很開心！</p>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-bold">{totalStars}<span className="text-xl text-white/80">/{maxStars}</span></div>
            <div className="text-xs text-white/80 mt-0.5">已收集星星</div>
          </div>
        </div>

        {/* Game tiles - bigger, more vivid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {GAME_REGISTRY.map((game, idx) => {
            const { manifest } = game;
            const best = bestStars[manifest.id];
            const plays = playCounts[manifest.id] ?? 0;
            const grad = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];

            return (
              <Link
                key={manifest.id}
                href={`/play/${manifest.id}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all p-3 sm:p-4 min-h-[130px] sm:min-h-[150px] md:min-h-[130px] flex flex-col`}
              >
                <div className="absolute -right-3 -bottom-4 text-7xl sm:text-8xl opacity-25 select-none pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6">
                  {manifest.emoji ?? '🎮'}
                </div>
                <div className="relative flex-1">
                  <div className="text-3xl sm:text-4xl mb-2">{manifest.emoji ?? '🎮'}</div>
                  <div className="font-bold text-base sm:text-lg text-white mb-1">{manifest.title['zh-HK']}</div>
                  <div className="text-xs sm:text-sm text-white/85 leading-tight">{manifest.description['zh-HK']}</div>
                </div>
                <div className="relative flex items-center justify-between mt-3">
                  {best !== undefined ? (
                    <div className="flex gap-0.5 text-yellow-300 text-base font-bold drop-shadow">
                      {'⭐'.repeat(best)}{'☆'.repeat(3 - best)}
                    </div>
                  ) : (
                    <div className="text-xs text-white/70 font-medium">未玩過</div>
                  )}
                  {plays > 0 && (
                    <div className="text-xs text-white/80 font-medium">已玩 {plays}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

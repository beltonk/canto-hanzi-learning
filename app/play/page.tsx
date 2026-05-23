'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold from '@/app/components/ui/PageScaffold';
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

  const headerPill = (
    <div className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-xs font-bold text-amber-700 flex items-center gap-1 shadow-sm">
      ⭐ <span className="tabular-nums">{totalStars}/{maxStars}</span>
    </div>
  );

  return (
    <AppShell title="遊戲樂園" emoji="🎮" bg="pink" rightSlot={headerPill}>
      <PageScaffold
        primary={
          <div className="w-full h-full flex flex-col min-h-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 shrink-0">
              玩遊戲拿三星，學中文超開心！⭐
            </h2>

            {/* Game tiles - fit exactly to viewport via grid rows and h-full */}
            <div
              className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 grid-rows-4 sm:grid-rows-2 md:grid-rows-3 lg:grid-rows-2 gap-2 sm:gap-3"
            >
              {GAME_REGISTRY.map((game, idx) => {
                const { manifest } = game;
                const best = bestStars[manifest.id];
                const plays = playCounts[manifest.id] ?? 0;
                const grad = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];

                return (
                  <Link
                    key={manifest.id}
                    href={`/play/${manifest.id}`}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all p-3 flex flex-col justify-between`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -right-3 -bottom-4 text-6xl sm:text-7xl opacity-20 select-none pointer-events-none transition-transform group-hover:scale-105 group-hover:rotate-6"
                    >
                      {manifest.emoji ?? '🎮'}
                    </div>

                    <div className="relative">
                      <div className="text-2xl sm:text-3xl mb-1 leading-none">{manifest.emoji ?? '🎮'}</div>
                      <div className="font-bold text-xs sm:text-sm md:text-base text-white leading-tight mb-0.5">
                        {manifest.title['zh-HK']}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-white/85 leading-snug truncate sm:whitespace-normal sm:line-clamp-2">
                        {manifest.description['zh-HK']}
                      </div>
                    </div>

                    <div className="relative flex items-center justify-between mt-1 shrink-0">
                      {best !== undefined ? (
                        <div className="flex gap-0.5 text-yellow-300 text-xs sm:text-sm font-bold drop-shadow">
                          {'⭐'.repeat(best)}{'☆'.repeat(3 - best)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-white/70 font-bold">未玩過</div>
                      )}
                      {plays > 0 && (
                        <div className="text-[10px] text-white/80 font-bold bg-white/10 px-1.5 py-0.5 rounded-md">
                          玩過 {plays} 次
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        }
      />
    </AppShell>
  );
}

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/app/components/ui/AppShell';
import { getGameById, GAME_REGISTRY } from '@/app/components/games/registry';
import GameHost from '@/app/components/games/GameHost';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const gameModule = getGameById(gameId);

  if (!gameModule) {
    return (
      <AppShell title="找不到遊戲" emoji="❓" bg="rose">
        <div className="w-full h-full p-0 text-center">
          <div className="text-6xl mb-4">❓</div>
          <p className="text-slate-700 text-lg mb-6">找不到這個遊戲</p>
          <button
            onClick={() => router.push('/play')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-all"
          >
            返回樂園
          </button>
        </div>
      </AppShell>
    );
  }

  const handleNextGame = () => {
    const idx = GAME_REGISTRY.findIndex(g => g.manifest.id === gameId);
    const next = GAME_REGISTRY[(idx + 1) % GAME_REGISTRY.length];
    router.push(`/play/${next.manifest.id}`);
  };

  return (
    <AppShell
      title={gameModule.manifest.title['zh-HK']}
      emoji={gameModule.manifest.emoji ?? '🎮'}
      bg="indigo"
      onBack={() => router.push('/play')}
    >
      <div className="w-full h-full p-0">
        <GameHost
          module={gameModule}
          onExit={() => router.push('/play')}
          onNextGame={handleNextGame}
        />
      </div>
    </AppShell>
  );
}

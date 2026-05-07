'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameModule, GameItem, GameResult } from './types';
import ResultScreen from './ResultScreen';
import Mascot from '@/app/components/ui/Mascot';

type GamePhase = 'loading' | 'intro' | 'playing' | 'paused' | 'result';

interface GameHostProps {
  module: GameModule;
  onExit: () => void;
  onNextGame?: () => void;
}

export default function GameHost({ module, onExit, onNextGame }: GameHostProps) {
  const { manifest, Component } = module;
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [items, setItems] = useState<GameItem[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        // Pull a much bigger pool so each session feels fresh
        const poolSize = Math.max(60, manifest.recommendedItemCount * 6);
        const res = await fetch(
          `/api/characters?inLexicalListsHK=true&shuffle=true&limit=${poolSize}`
        );
        const json = await res.json();
        const chars = (json.characters ?? []) as Array<{
          character: string;
          jyutping: string;
          stage1Words?: Array<{ word: string }>;
          stage2Words?: Array<{ word: string }>;
          radical: string;
        }>;

        const gameItems: GameItem[] = chars.map(c => {
          const words = [
            ...(c.stage1Words ?? []).map(w => w.word),
            ...(c.stage2Words ?? []).map(w => w.word),
          ];
          return {
            character: c.character,
            jyutping: c.jyutping,
            meaning: words[0],
            radical: c.radical,
            words,
          };
        });

        // Re-shuffle locally for extra randomness
        for (let i = gameItems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [gameItems[i], gameItems[j]] = [gameItems[j], gameItems[i]];
        }

        setItems(gameItems);
        setPhase('intro');
      } catch {
        setItems([]);
        setPhase('intro');
      }
    };
    load();
  }, [manifest.recommendedItemCount, reloadTick]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setPhase('playing');
  }, []);

  const handleResult = useCallback((res: GameResult) => {
    setResult(res);
    setPhase('result');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setReloadTick(t => t + 1); // re-fetch new pool
    setSessionKey(k => k + 1);
    setPhase('loading');
  }, []);

  if (phase === 'loading') {
    return (
      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl shadow-md border-2 border-indigo-300 p-6">
        <div className="flex items-center justify-center min-h-40">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-bounce">⏳</div>
            <p className="text-indigo-700 font-medium">準備字卡中…</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-md border-2 border-indigo-200 overflow-hidden">
        <div
          className="p-4 sm:p-6 text-white text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${manifest.colorVar}, ${manifest.colorVar}dd)` }}
        >
          <div className="absolute -right-4 -top-2 text-9xl opacity-20 select-none">{manifest.emoji ?? '🎮'}</div>
          <div className="relative flex flex-col md:flex-row md:items-center md:gap-5 md:text-left">
            <Mascot id={manifest.mascot} pose="happy" size={72} className="mx-auto md:mx-0 mb-2 md:mb-0 shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">{manifest.title['zh-HK']}</h2>
              <p className="text-sm text-white/90 max-w-md">{manifest.description['zh-HK']}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 flex flex-col items-center gap-3">
          {items.length === 0 ? (
            <div className="text-center">
              <p className="text-rose-600 mb-4">暫無適合的字符，請放寬篩選條件</p>
              <button onClick={onExit} className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600 transition-all">
                返回樂園
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startGame}
                className="w-full max-w-xs px-8 py-3 rounded-2xl font-bold text-lg text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
                style={{ background: manifest.colorVar }}
              >
                ▶ 開始
              </button>
              <button
                onClick={onExit}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2"
              >
                返回樂園
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-md border-2 border-amber-200 p-5">
        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          <div className="text-5xl">⏸</div>
          <h2 className="text-2xl font-bold text-slate-900">暫停中</h2>
          <button onClick={() => setPhase('playing')} className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-md hover:bg-emerald-600">繼續遊戲</button>
          <button onClick={() => { setResult(null); setPhase('intro'); }} className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600">重新開始</button>
          <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-700 underline">離開遊戲</button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl shadow-md border-2 border-emerald-200 overflow-hidden">
        <ResultScreen
          result={result}
          manifest={manifest}
          onPlayAgain={handlePlayAgain}
          onNextGame={onNextGame}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl shadow-md border-2 border-indigo-300 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-200 bg-indigo-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">{manifest.emoji ?? '🎮'}</span>
          <h3 className="font-bold text-slate-900 text-base">{manifest.title['zh-HK']}</h3>
        </div>
        <button
          onClick={() => setPhase('paused')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          ⏸ 暫停
        </button>
      </div>
      <div>
        <Component key={sessionKey} items={items} onResult={handleResult} onPause={() => setPhase('paused')} />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold from '@/app/components/ui/PageScaffold';
import { useAudio } from '@/lib/audio/context';
import { getFavorites, removeFavorite, markReviewed } from '@/lib/favorites';
import type { FavoriteEntry } from '@/lib/storage/types';

const SOURCE_LABEL: Record<string, string> = {
  'dictation': '默書練習',
  'flashcard': '字卡溫習',
  'decompose': '拆字遊戲',
  'explore': '認識漢字',
  'trace': '筆順練習',
  'game:tone-bingo': '聲調賓果',
  'game:radical-detective': '拆字偵探',
  'game:character-rain': '落字雨',
  'game:whack-a-hanzi': '打地鼠',
  'game:match-up': '配對遊戲',
  'game:sentence-garden': '造句樂園',
  'game:stroke-racer': '太空寫字',
  'game:tone-tap': '聲調點擊',
};

export default function FavoritesPage() {
  const audio = useAudio();
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'char' | 'word' | 'mistake'>('all');

  const refresh = () => setFavorites(getFavorites());

  useEffect(() => {
    Promise.resolve().then(() => setFavorites(getFavorites()));
  }, []);

  const filtered = favorites.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'mistake') return f.reason === 'mistake';
    return f.kind === filter;
  });

  const handleSpeak = (text: string) => {
    audio.speakTTS(text, 'zh-HK', 0.5);
    markReviewed(text);
    refresh();
  };

  const handleRemove = (text: string) => {
    removeFavorite(text);
    refresh();
  };

  const counts = {
    all: favorites.length,
    char: favorites.filter(f => f.kind === 'char').length,
    word: favorites.filter(f => f.kind === 'word').length,
    mistake: favorites.filter(f => f.reason === 'mistake').length,
  };

  const reviseCharsParam = (() => {
    const chars = new Set<string>();
    filtered.forEach(f => {
      [...f.text].forEach(ch => {
        if (/[\u4e00-\u9fff]/.test(ch)) chars.add(ch);
      });
    });
    return Array.from(chars).join(',');
  })();

  const reviseTitle =
    filter === 'mistake' ? '收藏：錯題複習' :
    filter === 'char'    ? '收藏：單字複習' :
    filter === 'word'    ? '收藏：詞語複習' :
                           '收藏複習';

  return (
    <AppShell title="我的收藏" emoji="❤️" bg="pink">
      <PageScaffold
        primary={
          <div className="w-full h-full flex flex-col min-h-0 gap-3">
            {/* Shrunk Hero Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 rounded-2xl text-white p-3.5 shadow-md relative overflow-hidden shrink-0">
              <div aria-hidden="true" className="absolute -right-4 -top-4 text-6xl opacity-15 select-none pointer-events-none">❤️</div>
              <div>
                <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5 leading-none mb-1">
                  我的收藏 ❤️
                </h2>
                <p className="text-[10px] sm:text-xs text-white/90 leading-none">
                  收藏想多複習的漢字、詞語、或答錯過的題目
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold">
                  共 {counts.all} 項
                </span>
                {reviseCharsParam.length > 0 && (
                  <Link
                    href={`/learn/flashcard?chars=${encodeURIComponent(reviseCharsParam)}&title=${encodeURIComponent(reviseTitle)}`}
                    className="px-3 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-bold shadow-sm hover:bg-rose-50 active:scale-95 transition-all"
                  >
                    🃏 字卡複習
                  </Link>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {([
                { key: 'all',     label: '全部',   count: counts.all },
                { key: 'char',    label: '單字',   count: counts.char },
                { key: 'word',    label: '詞語',   count: counts.word },
                { key: 'mistake', label: '錯題',   count: counts.mistake },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-11 inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-1 ${
                    filter === f.key
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-slate-750 dark:text-rose-350 hover:bg-rose-100/50'
                  }`}
                >
                  {f.label} <span className="opacity-70 text-[10px]">({f.count})</span>
                </button>
              ))}
            </div>

            {/* Content area: Grid or Empty State */}
            <div className="flex-1 min-h-0">
              {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-950 border border-rose-100 dark:border-rose-900/50 p-6 text-center shadow-sm">
                  <div className="text-5xl mb-2">📭</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {favorites.length === 0 ? '還沒有收藏項目' : '此分類下沒有項目'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
                    在學習或玩遊戲時，看見喜歡或答錯的字，按 <span className="text-rose-600 dark:text-rose-400 font-bold">❤️ 收藏</span> 即可。
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Link href="/learn/explore" className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 active:scale-95 transition-all min-h-9 inline-flex items-center">
                      認字
                    </Link>
                    <Link href="/learn/dictation" className="px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all min-h-9 inline-flex items-center">
                      默書
                    </Link>
                    <Link href="/play" className="px-3.5 py-2 rounded-xl bg-fuchsia-500 text-white text-xs font-bold hover:bg-fuchsia-600 active:scale-95 transition-all min-h-9 inline-flex items-center">
                      遊戲
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">
                  {filtered.map(fav => (
                    <div
                      key={fav.text}
                      className="group rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-950 border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col min-h-0"
                    >
                      {/* Character display */}
                      <button
                        onClick={() => handleSpeak(fav.text)}
                        className="w-full p-4 flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 hover:from-rose-100 hover:to-fuchsia-100 dark:from-slate-950 dark:to-slate-900 transition-all cursor-pointer"
                        title="點擊播放發音"
                      >
                        <span
                          className={`hanzi-display text-slate-900 dark:text-slate-100 text-center leading-tight ${
                            fav.text.length === 1 ? 'text-5xl' : 'text-3xl'
                          }`}
                        >
                          {fav.text}
                        </span>
                      </button>

                      {/* Meta & Actions */}
                      <div className="p-3 flex flex-col gap-2 flex-1 min-h-0 justify-between">
                        <div>
                          {fav.jyutping && (
                            <div className="text-center font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate font-bold mb-1">
                              {fav.jyutping}
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 flex-wrap">
                            {fav.reason === 'mistake' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold">錯題</span>
                            )}
                            {fav.source && SOURCE_LABEL[fav.source] && (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {SOURCE_LABEL[fav.source]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100/50 dark:border-slate-800">
                          <button
                            onClick={() => handleSpeak(fav.text)}
                            className="flex-1 px-1.5 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 active:scale-95 transition-all min-h-8 cursor-pointer"
                          >
                            🔊 唸
                          </button>
                          {fav.kind === 'char' && (
                            <Link
                              href={`/learn/explore?char=${encodeURIComponent(fav.text)}`}
                              className="flex-1 px-1.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold text-center hover:bg-emerald-600 active:scale-95 transition-all min-h-8 inline-flex items-center justify-center"
                            >
                              詳情
                            </Link>
                          )}
                          <button
                            onClick={() => handleRemove(fav.text)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 active:scale-95 transition-all min-h-8 cursor-pointer"
                            title="移除"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
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
    // Defer to next microtask so React doesn't trigger cascading renders.
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

  // Build the deep-link list of single Han characters across the current
  // filter — used by the "用字卡複習" CTA. Words/phrases are split into
  // their constituent characters so the flashcard session always sees
  // single-character cards.
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
      <div className="w-full h-full p-0">
        {/* Hero */}
        <div className="mb-5 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 text-white p-5 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-9xl opacity-20 select-none">❤️</div>
          <div className="relative">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">我的收藏</h2>
            <p className="text-sm sm:text-base text-white/90 mb-3">收藏想多複習的字、詞，或答錯過的題目</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-semibold">
                共 {counts.all} 項
              </span>
              {counts.mistake > 0 && (
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-semibold">
                  錯題 {counts.mistake} 個
                </span>
              )}
              {reviseCharsParam.length > 0 && (
                <Link
                  href={`/learn/flashcard?chars=${encodeURIComponent(reviseCharsParam)}&title=${encodeURIComponent(reviseTitle)}`}
                  className="ml-auto px-4 py-1.5 rounded-full bg-white text-rose-600 text-sm font-bold shadow-md hover:bg-rose-50 active:scale-95 transition-all"
                >
                  🃏 用字卡複習
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {([
            { key: 'all',     label: '全部',   count: counts.all },
            { key: 'char',    label: '單字',   count: counts.char },
            { key: 'word',    label: '詞語',   count: counts.word },
            { key: 'mistake', label: '錯題',   count: counts.mistake },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-rose-50 border border-rose-200 text-slate-700 hover:border-rose-300 hover:bg-rose-100'
              }`}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 p-10 text-center shadow-sm">
            <div className="text-6xl mb-3">📭</div>
            <div className="text-lg font-bold text-slate-800 mb-1">
              {favorites.length === 0 ? '還沒有收藏項目' : '此分類下沒有項目'}
            </div>
            <div className="text-sm text-slate-500 mb-5">
              在學習或玩遊戲時，看到喜歡或想再練習的字 / 詞，按 <span className="text-rose-600 font-semibold">❤️ 收藏</span> 即可加入這裡。
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <Link href="/learn/explore" className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 active:scale-95 transition-all">
                認字
              </Link>
              <Link href="/learn/dictation" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:scale-95 transition-all">
                默書
              </Link>
              <Link href="/play" className="px-4 py-2 rounded-xl bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 active:scale-95 transition-all">
                遊戲
              </Link>
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(fav => (
              <div
                key={fav.text}
                className="group rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Character display */}
                <button
                  onClick={() => handleSpeak(fav.text)}
                  className="w-full p-4 flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 hover:from-rose-100 hover:to-fuchsia-100 transition-all"
                  title="點擊播放發音"
                >
                  <span
                    className={`hanzi-display text-slate-900 text-center leading-tight ${
                      fav.kind === 'char' ? 'text-6xl' : 'text-4xl'
                    }`}
                  >
                    {fav.text}
                  </span>
                </button>

                {/* Meta */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {fav.jyutping && (
                    <div className="text-center font-mono text-sm text-indigo-600 truncate">
                      {fav.jyutping}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 text-xs text-slate-500 flex-wrap">
                    {fav.reason === 'mistake' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-semibold">錯題</span>
                    )}
                    {fav.source && SOURCE_LABEL[fav.source] && (
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        來自 {SOURCE_LABEL[fav.source]}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between gap-1.5 pt-1">
                    <button
                      onClick={() => handleSpeak(fav.text)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 active:scale-95 transition-all"
                    >
                      🔊 唸
                    </button>
                    {fav.kind === 'char' && (
                      <Link
                        href={`/learn/explore?char=${encodeURIComponent(fav.text)}`}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold text-center hover:bg-emerald-600 active:scale-95 transition-all"
                      >
                        看詳情
                      </Link>
                    )}
                    <button
                      onClick={() => handleRemove(fav.text)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all"
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
    </AppShell>
  );
}

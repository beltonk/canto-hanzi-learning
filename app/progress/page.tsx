'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import { loadRoot } from '@/lib/storage';
import { levelForXp } from '@/lib/gamification/levelCurve';
import { getDueCharacters } from '@/lib/progress/srs';
import { exportProgress, importProgress } from '@/lib/progress/exportImport';
import type { CharacterMasteryRecord } from '@/lib/storage/types';
import Mascot from '@/app/components/ui/Mascot';

interface DayActivity {
  day: string;
  count: number;
}

function getLast7Days(): DayActivity[] {
  const result: DayActivity[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    result.push({ day: d.toISOString().slice(5, 10), count: 0 });
  }
  return result;
}

interface ProgressData {
  xp: number;
  level: number;
  streak: number;
  nextLevelXp: number;
  currentLevelXp: number;
  totalChars: number;
  masteredChars: number;
  practicedChars: number;
  dueCount: number;
  weekActivity: DayActivity[];
  masteryRecords: Record<string, CharacterMasteryRecord>;
  stickers: string[];
}

const STATE_COLORS: Record<string, string> = {
  mastered:   'bg-emerald-500 text-white border-emerald-600',
  practiced:  'bg-sky-200 text-sky-900 border-sky-300',
  introduced: 'bg-amber-100 text-amber-800 border-amber-200',
  unseen:     'bg-slate-100 text-slate-500 border-slate-200',
};

const STATE_LABELS: Record<string, string> = {
  mastered: '已掌握', practiced: '練習中', introduced: '初學', unseen: '未見',
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const root = loadRoot();
      const { level, nextLevelXp, currentLevelXp } = levelForXp(root.gamification.xp);
      const chars = root.progress.characters;
      const masteredChars = Object.values(chars).filter(r => r.state === 'mastered').length;
      const practicedChars = Object.values(chars).filter(r => r.state === 'practiced').length;
      const dueChars = getDueCharacters(chars, 100);

      const weekAct = getLast7Days();
      const now = Date.now();
      root.progress.log.forEach(e => {
        const daysAgo = Math.floor((now - e.at) / 86400000);
        if (daysAgo < 7) {
          const dayStr = new Date(e.at).toISOString().slice(5, 10);
          const slot = weekAct.find(d => d.day === dayStr);
          if (slot) slot.count++;
        }
      });

      setData({
        xp: root.gamification.xp,
        level,
        streak: root.gamification.streak,
        nextLevelXp,
        currentLevelXp,
        totalChars: Object.keys(chars).length,
        masteredChars,
        practicedChars,
        dueCount: dueChars.length,
        weekActivity: weekAct,
        masteryRecords: chars,
        stickers: root.gamification.stickers,
      });
    });
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('確定要匯入進度？現有進度將被取代。')) return;
    await importProgress(file);
    window.location.reload();
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    localStorage.removeItem('cantoHanzi.v1');
    window.location.reload();
  };

  if (!data) {
    return (
      <AppShell title="學習進度" emoji="📊" bg="sky">
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">載入中...</div>
        </div>
      </AppShell>
    );
  }

  const maxWeekCount = Math.max(1, ...data.weekActivity.map(d => d.count));
  const xpProgress = data.nextLevelXp === Infinity
    ? 100
    : Math.round(((data.xp - data.currentLevelXp) / (data.nextLevelXp - data.currentLevelXp)) * 100);

  return (
    <AppShell title="學習進度" emoji="📊" bg="sky">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {/* Top hero band */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-white p-5 sm:p-6 shadow-lg mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <div className="text-3xl sm:text-4xl font-bold">Lv.{data.level}</div>
              <div className="text-xs text-white/80 mt-1">等級</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${xpProgress}%` }} />
              </div>
              <div className="text-xs text-white/80 mt-1">{data.xp} XP</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">{data.streak} 🔥</div>
              <div className="text-xs text-white/80 mt-1">連續天數</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">{data.masteredChars}</div>
              <div className="text-xs text-white/80 mt-1">已掌握的字</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">{data.totalChars}</div>
              <div className="text-xs text-white/80 mt-1">學過的字</div>
            </div>
          </div>
        </div>

        {/* Due reminder */}
        {data.dueCount > 0 && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-200 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <div className="font-bold text-slate-900">有 {data.dueCount} 個字需要複習</div>
                <div className="text-xs text-slate-600">趕快趁今天的記憶複習一下！</div>
              </div>
            </div>
            <Link href="/learn/flashcard" className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md transition-all active:scale-95">
              立即複習 →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 7-day chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>📈</span> 最近 7 日活動
            </h3>
            <div className="flex items-end gap-2 h-28">
              {data.weekActivity.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-xs text-slate-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity h-4">
                    {d.count > 0 ? d.count : ''}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-400 transition-all"
                    style={{ height: `${(d.count / maxWeekCount) * 100}%`, minHeight: d.count > 0 ? '6px' : '2px' }}
                  />
                  <div className="text-xs text-slate-500 font-medium">{d.day.slice(3)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stickers preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span>📚</span> 我的貼紙
              </h3>
              <Link href="/stickers" className="text-xs text-indigo-600 font-semibold hover:underline">全部 →</Link>
            </div>
            {data.stickers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">尚未收集到貼紙</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {data.stickers.slice(0, 12).map(id => {
                  const idx = parseInt(id.replace('sticker_', '')) - 1;
                  const emojis = ['⭐', '🌟', '💫', '✨', '🎯', '🏆', '🥇', '🎪', '🎨', '🎭', '🎵', '🎁', '🪐', '🐼', '🦊', '🐯', '🐻', '🐨', '🦁', '🐹'];
                  return (
                    <div key={id} className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 border-2 border-amber-200 flex items-center justify-center text-2xl shadow-sm">
                      {emojis[idx % emojis.length]}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mastery character grid */}
        {Object.keys(data.masteryRecords).length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">學習狀態 ({Object.keys(data.masteryRecords).length})</h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATE_LABELS).map(([state, label]) => (
                  <div key={state} className="flex items-center gap-1 text-xs">
                    <span className={`inline-block w-3 h-3 rounded ${STATE_COLORS[state]?.split(' ')[0] ?? ''}`} />
                    <span className="text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.masteryRecords).slice(0, 200).map(([char, rec]) => (
                <button
                  key={char}
                  onClick={() => setHoveredChar(hoveredChar === char ? null : char)}
                  className={`w-9 h-9 rounded-lg font-chinese text-base font-semibold border transition-transform hover:scale-110 ${STATE_COLORS[rec.state] ?? ''}`}
                >
                  {char}
                </button>
              ))}
            </div>
            {hoveredChar && data.masteryRecords[hoveredChar] && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-chinese text-3xl font-bold text-slate-900">{hoveredChar}</span>
                  <span className="text-slate-700">
                    狀態：<span className="font-semibold">{STATE_LABELS[data.masteryRecords[hoveredChar].state]}</span> · 勝：{data.masteryRecords[hoveredChar].wins} 次
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Link href={`/learn/trace?char=${encodeURIComponent(hoveredChar)}`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700">
                    🖌️ 寫字
                  </Link>
                  <Link href={`/learn/flashcard?char=${encodeURIComponent(hoveredChar)}`} className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-600">
                    🃏 字卡
                  </Link>
                  <Link href={`/learn/explore?char=${encodeURIComponent(hoveredChar)}`} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600">
                    📖 詳情
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4 text-center">
            <Mascot id="panda" pose="idle" size={64} className="mx-auto mb-2" />
            <p className="text-slate-600 mb-3">開始練習，建立你的學習記錄！</p>
            <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all active:scale-95">
              開始學習
            </Link>
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mt-4">
          <h3 className="font-bold text-slate-900 mb-3">管理進度</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportProgress}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-all"
            >
              📤 匯出進度
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-sm font-semibold hover:bg-sky-100 cursor-pointer transition-all">
              📥 匯入進度
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleReset}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                confirmReset
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {confirmReset ? '確定重設？再按確認' : '🔄 重設進度'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

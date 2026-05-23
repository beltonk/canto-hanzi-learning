'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold, { type TabItem } from '@/app/components/ui/PageScaffold';
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
  dueChars: string[];
  weekActivity: DayActivity[];
  masteryRecords: Record<string, CharacterMasteryRecord>;
  stickers: string[];
}

const STATE_COLORS: Record<string, string> = {
  mastered:   'bg-emerald-500 text-white border-emerald-600',
  practiced:  'bg-sky-200 text-sky-900 border-sky-300 dark:bg-sky-900 dark:text-sky-100 dark:border-sky-850',
  introduced: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  unseen:     'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-450 dark:border-slate-700',
};

const STATE_LABELS: Record<string, string> = {
  mastered: '已掌握', practiced: '練習中', introduced: '初學', unseen: '未見',
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

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
        dueChars,
        weekActivity: weekAct,
        masteryRecords: chars,
        stickers: root.gamification.stickers,
      });
    });
  }, []);

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

  const openSettings = () => {
    dialogRef.current?.showModal();
  };

  const closeSettings = () => {
    dialogRef.current?.close();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('確定要匯入進度？現有進度將被取代。')) return;
    await importProgress(file);
    closeSettings();
    window.location.reload();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    localStorage.removeItem('cantoHanzi.v1');
    closeSettings();
    window.location.reload();
  };

  const settingsButton = (
    <button
      onClick={openSettings}
      className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xl font-bold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-indigo-500"
      aria-label="管理進度"
    >
      ⚙️
    </button>
  );

  // Secondary Tab Items
  const secondaryTabs: TabItem[] = [
    {
      id: 'mastery',
      label: '🗂 學習狀態',
      content: Object.keys(data.masteryRecords).length > 0 ? (
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              漢字庫 ({Object.keys(data.masteryRecords).length})
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATE_LABELS).map(([state, label]) => (
                <div key={state} className="flex items-center gap-1 text-[10px]">
                  <span className={`inline-block w-2.5 h-2.5 rounded ${STATE_COLORS[state]?.split(' ')[0] ?? ''}`} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.masteryRecords).slice(0, 200).map(([char, rec]) => (
              <button
                key={char}
                onClick={() => setHoveredChar(hoveredChar === char ? null : char)}
                className={`w-9 h-9 rounded-lg font-chinese text-sm font-bold border transition-transform hover:scale-110 active:scale-95 ${STATE_COLORS[rec.state] ?? ''}`}
              >
                {char}
              </button>
            ))}
          </div>

          {hoveredChar && data.masteryRecords[hoveredChar] && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-3 justify-between flex-wrap">
                <span className="font-chinese text-2xl font-bold text-slate-900 dark:text-slate-100">{hoveredChar}</span>
                <span className="text-slate-600 dark:text-slate-400">
                  狀態：<span className="font-bold">{STATE_LABELS[data.masteryRecords[hoveredChar].state]}</span> · 已對 {data.masteryRecords[hoveredChar].wins} 次
                </span>
              </div>
              <div className="flex gap-1.5">
                <Link href={`/learn/trace?char=${encodeURIComponent(hoveredChar)}`} className="flex-1 text-center py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 min-h-8 inline-flex items-center justify-center">
                  🖌️ 寫字
                </Link>
                <Link href={`/learn/flashcard?chars=${encodeURIComponent(hoveredChar)}&title=${encodeURIComponent('複習：' + hoveredChar)}`} className="flex-1 text-center py-1.5 rounded-lg bg-sky-500 text-white text-[10px] font-bold hover:bg-sky-600 min-h-8 inline-flex items-center justify-center">
                  🃏 字卡
                </Link>
                <Link href={`/learn/explore?char=${encodeURIComponent(hoveredChar)}`} className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 min-h-8 inline-flex items-center justify-center">
                  📖 詳情
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
          <Mascot id="panda" pose="idle" size={48} className="mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">開始練習，建立你的學習記錄！</p>
        </div>
      )
    },
    {
      id: 'stickers',
      label: '📚 我的貼紙',
      content: data.stickers.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
          尚未收集到貼紙
        </div>
      ) : (
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex justify-between items-center shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">已解鎖 {data.stickers.length} 張貼紙</span>
            <Link href="/stickers" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              貼紙簿 →
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
            {data.stickers.slice(0, 12).map(id => {
              const idx = parseInt(id.replace('sticker_', '')) - 1;
              const emojis = ['⭐', '🌟', '💫', '✨', '🎯', '🏆', '🥇', '🎪', '🎨', '🎭', '🎵', '🎁', '🪐', '🐼', '🦊', '🐯', '🐻', '🐨', '🦁', '🐹'];
              return (
                <div key={id} className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 border border-amber-200 flex items-center justify-center text-xl shadow-sm">
                  {emojis[idx % emojis.length]}
                </div>
              );
            })}
          </div>
        </div>
      )
    }
  ];

  return (
    <AppShell title="學習進度" emoji="📊" bg="sky" rightSlot={settingsButton}>
      <PageScaffold
        persistKey="progress.secondaryTab"
        defaultSelected="mastery"
        primary={
          <div className="w-full flex flex-col min-h-0 gap-3">
            {/* Top stats dashboard grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
              <div className="bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
                <div>
                  <div className="text-xl sm:text-2xl font-black">Lv.{data.level}</div>
                  <div className="text-[10px] text-white/80 font-bold mt-0.5">等級</div>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-white/20 overflow-hidden shrink-0">
                  <div className="h-full bg-white rounded-full" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
                <div className="text-xl sm:text-2xl font-black">{data.streak} 🔥</div>
                <div className="text-[10px] text-white/80 font-bold mt-0.5">連續天數</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
                <div className="text-xl sm:text-2xl font-black">{data.masteredChars}</div>
                <div className="text-[10px] text-white/80 font-bold mt-0.5">已掌握的字</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
                <div className="text-xl sm:text-2xl font-black">{data.totalChars}</div>
                <div className="text-[10px] text-white/80 font-bold mt-0.5">學過的字</div>
              </div>
            </div>

            {/* Spaced Repetition Due Reminder */}
            {data.dueCount > 0 && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      有 {data.dueCount} 個字需要複習
                    </div>
                  </div>
                </div>
                <Link
                  href={`/learn/flashcard?chars=${encodeURIComponent(data.dueChars.join(','))}&title=${encodeURIComponent('今日要複習')}`}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  立即複習 →
                </Link>
              </div>
            )}

            {/* 7-Day Activity Chart */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/10 dark:to-purple-950/10 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-3.5 shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                <span>📈</span> 最近 7 日活動
              </h3>
              <div className="flex items-end gap-2 h-20">
                {data.weekActivity.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400 transition-all"
                      style={{
                        height: `${(d.count / maxWeekCount) * 100}%`,
                        minHeight: d.count > 0 ? '4px' : '2px',
                      }}
                    />
                    <div className="text-[10px] text-slate-500 font-semibold">{d.day.slice(3)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        secondary={secondaryTabs}
      />

      {/* Settings Modal Dialog */}
      <dialog
        ref={dialogRef}
        className="backdrop:bg-slate-900/40 p-0 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl max-w-sm w-[90%] bg-white dark:bg-slate-800 focus-visible:outline-none"
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
              <span>⚙️</span> 管理進度
            </h3>
            <button
              onClick={closeSettings}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 min-h-8"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                exportProgress();
                closeSettings();
              }}
              className="w-full px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100/70 transition-all min-h-11 flex items-center justify-center gap-2"
            >
              📤 匯出進度
            </button>

            <label className="w-full px-4 py-3 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 text-sm font-bold hover:bg-sky-100/70 cursor-pointer transition-all min-h-11 flex items-center justify-center gap-2">
              📥 匯入進度
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>

            <button
              onClick={handleReset}
              onMouseLeave={() => setConfirmReset(false)}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all min-h-11 flex items-center justify-center gap-2 ${
                confirmReset
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100/70'
              }`}
            >
              {confirmReset ? '確定重設？再按一次確認' : '🔄 重設進度'}
            </button>
          </div>
        </div>
      </dialog>
    </AppShell>
  );
}

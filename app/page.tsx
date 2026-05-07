"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import AppShell from "@/app/components/ui/AppShell";
import GardenPanel from "@/app/components/ui/GardenPanel";
import QuestCard from "@/app/components/ui/QuestCard";
import { loadRoot } from "@/lib/storage";
import { pickDailyQuests, QUEST_POOL } from "@/lib/gamification/quests";
import { getDueCharacters } from "@/lib/progress/srs";
import { getTodayString } from "@/lib/gamification/streak";
import { levelForXp } from "@/lib/gamification/levelCurve";
import { getFavoritesCount } from "@/lib/favorites";

interface ActivityCard {
  href: string;
  emoji: string;
  label: string;
  description: string;
  gradient: string;
  ring: string;
  text: string;
}

const ACTIVITIES: ActivityCard[] = [
  { href: "/learn/explore",   emoji: "🔍", label: "查字 · 認字", description: "搜尋字／部首／筆畫，認識漢字",
    gradient: "from-rose-400 to-pink-500",     ring: "ring-rose-200",     text: "text-white" },
  { href: "/learn/flashcard", emoji: "🃏", label: "字卡溫習", description: "翻卡學習，鞏固記憶",
    gradient: "from-sky-400 to-cyan-500",      ring: "ring-sky-200",      text: "text-white" },
  { href: "/learn/decompose", emoji: "🧩", label: "拆字遊戲", description: "拆解部件，理解字形",
    gradient: "from-emerald-400 to-teal-500",  ring: "ring-emerald-200",  text: "text-white" },
  { href: "/learn/dictation", emoji: "✏️", label: "默書練習", description: "聆聽發音，寫出正字",
    gradient: "from-amber-400 to-orange-500",  ring: "ring-amber-200",    text: "text-white" },
  { href: "/learn/trace",     emoji: "🖌️", label: "筆順練習", description: "用手指依筆順書寫",
    gradient: "from-indigo-400 to-purple-500", ring: "ring-indigo-200",   text: "text-white" },
  { href: "/play",            emoji: "🎮", label: "遊戲樂園", description: "8 款小遊戲輕鬆學",
    gradient: "from-pink-400 to-fuchsia-500",  ring: "ring-pink-200",     text: "text-white" },
];

interface ActiveQuest {
  id: string;
  label: string;
  progress: number;
  target: number;
  done: boolean;
}

export default function Home() {
  const router = useRouter();
  const [plants, setPlants] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [quests, setQuests] = useState<ActiveQuest[]>([]);
  const [dueChars, setDueChars] = useState<string[]>([]);
  const [stickerCount, setStickerCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = loadRoot();
    const { level: lv } = levelForXp(root.gamification.xp);

    const today = getTodayString();
    const daily = pickDailyQuests(today);
    const activeQuests = root.gamification.quests.lastRefreshDay === today
      ? root.gamification.quests.today
      : daily.map(d => ({ id: d.id, progress: 0, target: d.target, done: false }));

    const questsWithLabels: ActiveQuest[] = activeQuests.map(q => {
      const def = QUEST_POOL.find(d => d.id === q.id);
      return { ...q, label: def?.label['zh-HK'] ?? q.id };
    });

    const due = getDueCharacters(root.progress.characters, 12);

    setTimeout(() => {
      setPlants(root.gamification.garden);
      setXp(root.gamification.xp);
      setStreak(root.gamification.streak);
      setLevel(lv);
      setQuests(questsWithLabels);
      setDueChars(due);
      setStickerCount(root.gamification.stickers.length);
      setFavCount(getFavoritesCount());
    }, 0);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    // If a single Chinese character is entered, jump straight to its detail.
    if ([...q].length === 1 && /[\u4e00-\u9fff]/.test(q)) {
      router.push(`/learn/explore?char=${encodeURIComponent(q)}`);
    } else {
      router.push(`/learn/explore?q=${encodeURIComponent(q)}`);
    }
  };

  const { nextLevelXp, currentLevelXp } = levelForXp(xp);
  const xpProgress = nextLevelXp === Infinity
    ? 100
    : Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  return (
    <AppShell title="粵語漢字學習" emoji="📖" hideBack bg="indigo">
      <div className="w-full h-full p-0">
        {/* Hero compact band */}
        <div className="mb-5 sm:mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Welcome / progress */}
          <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white p-5 sm:p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-9xl opacity-20 select-none">🐼</div>
            <div className="relative">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">準備好學中文了嗎？</h2>
              <p className="text-sm sm:text-base text-white/90 mb-4">每天進步一點點，累積大成就 🚀</p>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-semibold flex items-center gap-1.5">⭐ Lv.{level}</div>
                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-semibold flex items-center gap-1.5">💎 {xp} XP</div>
                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-semibold flex items-center gap-1.5">🔥 {streak} 天</div>
                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-semibold flex items-center gap-1.5">📚 {stickerCount} 貼紙</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
                </div>
                <span className="text-xs font-medium text-white/90 shrink-0">
                  {nextLevelXp === Infinity ? '已滿級' : `${xp - currentLevelXp}/${nextLevelXp - currentLevelXp}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/favorites" className="rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg transition-all p-4 flex flex-col items-center justify-center gap-1 active:scale-95">
              <div className="text-3xl">❤️</div>
              <div className="text-sm font-bold">我的收藏</div>
              <div className="text-xs text-white/85">{favCount} 項</div>
            </Link>
            <Link href="/progress" className="rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all p-4 flex flex-col items-center justify-center gap-1 active:scale-95">
              <div className="text-3xl">📊</div>
              <div className="text-sm font-bold">學習進度</div>
              <div className="text-xs text-white/85">📚 {stickerCount} 貼紙</div>
            </Link>
          </div>
        </div>

        {/* Search bar — primary entry point for finding a specific character */}
        <form onSubmit={submitSearch} className="mb-5 sm:mb-6">
          <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl shadow-sm focus-within:border-indigo-500 focus-within:shadow-md transition-all flex items-center gap-2 pl-4 pr-2 py-1.5">
            <span className="text-2xl">🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋漢字、部首或粵拼（例如：明、口、ming4）"
              className="flex-1 bg-transparent outline-none text-base sm:text-lg py-2 text-slate-900 placeholder:text-slate-400 hanzi-display"
              aria-label="搜尋漢字"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm sm:text-base hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
            >
              查字
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <span className="text-slate-500">熱門搜尋：</span>
            {['口', '木', '水', '心', '火', '日', '人', '手'].map(r => (
              <Link
                key={r}
                href={`/learn/explore?q=${encodeURIComponent(r)}`}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 hanzi-display"
              >
                {r} 部
              </Link>
            ))}
          </div>
        </form>

        {/* Activity Cards — compact, vivid, denser */}
        <section className="mb-5 sm:mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">學習活動</h2>
            <span className="text-xs text-slate-500">點擊開始</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIVITIES.map(act => (
              <Link
                key={act.href}
                href={act.href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${act.gradient} shadow-md hover:shadow-xl active:scale-95 transition-all p-4 sm:p-5 ring-2 ring-transparent hover:${act.ring}`}
              >
                <div className="absolute -right-2 -bottom-2 text-7xl opacity-25 select-none">{act.emoji}</div>
                <div className="relative">
                  <div className="text-3xl sm:text-4xl mb-2">{act.emoji}</div>
                  <div className={`font-bold text-base sm:text-lg ${act.text} mb-0.5`}>{act.label}</div>
                  <div className="text-xs sm:text-sm text-white/85 leading-snug">{act.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's review */}
        {dueChars.length > 0 && (
          <section className="mb-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">今日要複習</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{dueChars.length}</span>
              </div>
              <Link
                href={`/learn/flashcard?chars=${encodeURIComponent(dueChars.join(','))}&title=${encodeURIComponent('今日要複習')}`}
                className="text-xs sm:text-sm text-indigo-600 font-semibold hover:underline"
              >
                立即複習 →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {dueChars.map(char => (
                <Link
                  key={char}
                  href={`/learn/flashcard?chars=${encodeURIComponent(char)}&title=${encodeURIComponent('複習：' + char)}`}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 flex items-center justify-center font-chinese text-xl sm:text-2xl text-slate-900 hover:scale-110 hover:border-indigo-500 active:scale-95 transition-all shadow-sm"
                >
                  {char}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quests */}
        {quests.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎯</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">今日任務</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {quests.map(q => <QuestCard key={q.id} quest={q} />)}
            </div>
          </section>
        )}

        {/* Garden */}
        <GardenPanel plants={plants} className="mb-4" />
      </div>
    </AppShell>
  );
}

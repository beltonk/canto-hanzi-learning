'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import PageScaffold, { type TabItem } from '@/app/components/ui/PageScaffold';
import GardenPanel from '@/app/components/ui/GardenPanel';
import QuestCard from '@/app/components/ui/QuestCard';
import { loadRoot } from '@/lib/storage';
import { pickDailyQuests, QUEST_POOL } from '@/lib/gamification/quests';
import { getDueCharacters } from '@/lib/progress/srs';
import { getTodayString } from '@/lib/gamification/streak';
import { levelForXp } from '@/lib/gamification/levelCurve';
import { getFavoritesCount } from '@/lib/favorites';

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

  // Setup secondary tabs for PageScaffold
  const secondaryTabs: TabItem[] = [
    {
      id: 'review',
      label: `📖 複習 (${dueChars.length})`,
      content: dueChars.length > 0 ? (
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              今日有 {dueChars.length} 個字待溫習
            </span>
            <Link
              href={`/learn/flashcard?chars=${encodeURIComponent(dueChars.join(','))}&title=${encodeURIComponent('今日要複習')}`}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              用字卡複習 →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {dueChars.map(char => (
              <Link
                key={char}
                href={`/learn/flashcard?chars=${encodeURIComponent(char)}&title=${encodeURIComponent('複習：' + char)}`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-850 flex items-center justify-center font-chinese text-lg sm:text-xl text-slate-900 dark:text-slate-100 hover:scale-110 hover:border-indigo-500 active:scale-95 transition-all shadow-sm"
              >
                {char}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
          🌟 太棒了！今天所有的字都複習完畢！
        </div>
      )
    },
    {
      id: 'quests',
      label: '🎯 今日任務',
      content: quests.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 min-h-0">
          {quests.map(q => <QuestCard key={q.id} quest={q} />)}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
          🎯 今日無任何任務，休息一下吧！
        </div>
      )
    },
    {
      id: 'garden',
      label: '🌱 我的花園',
      content: (
        <div className="min-h-0">
          <GardenPanel plants={plants} />
        </div>
      )
    }
  ];

  return (
    <AppShell title="粵語漢字學習" emoji="📖" hideBack bg="indigo">
      <PageScaffold
        persistKey="home.secondaryTab"
        defaultSelected={dueChars.length > 0 ? 'review' : 'quests'}
        primary={
          <div className="w-full flex flex-col min-h-0 gap-3">
            {/* Collapsed Welcome / Stats Band */}
            <div className="flex items-center justify-between flex-wrap gap-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl text-white p-3 shadow-md relative overflow-hidden shrink-0">
              <div aria-hidden="true" className="absolute -right-4 -top-4 text-6xl opacity-15 select-none pointer-events-none">🐼</div>
              <div className="relative">
                <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5 leading-none mb-1">
                  <span>🐼</span> 你好！學中文嘍 🚀
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-white/80 shrink-0 font-medium">
                    Lv.{level}
                  </span>
                </div>
              </div>
              <div className="relative flex items-center gap-1.5 text-[10px] font-bold shrink-0">
                <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur">💎 {xp} XP</span>
                <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur">🔥 {streak} 天</span>
                <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur">📚 {stickerCount} 貼紙</span>
                <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur">❤️ {favCount}</span>
              </div>
            </div>

            {/* Search Bar with Hot Searches Inline */}
            <form onSubmit={submitSearch} className="shrink-0">
              <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-850 rounded-2xl shadow-sm focus-within:border-indigo-500 focus-within:shadow-md transition-all flex items-center gap-2 pl-3 pr-1.5 py-1 min-w-0">
                <span className="text-xl shrink-0">🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜尋漢字 / 部首 / 粵拼"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base py-1 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 hanzi-display min-h-9"
                  aria-label="搜尋漢字"
                />
                <button
                  type="submit"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm min-h-9"
                >
                  查字
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1 flex-wrap text-[10px] sm:text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">推薦：</span>
                {['口', '木', '水', '心', '火', '日'].map(r => (
                  <Link
                    key={r}
                    href={`/learn/explore?q=${encodeURIComponent(r)}`}
                    aria-label={`${r} 部`}
                    className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-900 hanzi-display inline-flex items-center"
                  >
                    {r} 部
                  </Link>
                ))}
              </div>
            </form>

            {/* Compact Activity Grid */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITIES.map(act => (
                  <Link
                    key={act.href}
                    href={act.href}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${act.gradient} shadow-sm hover:shadow-md active:scale-95 transition-all p-3 flex flex-col justify-between h-[90px] xs:h-[100px] sm:h-[90px] md:h-[95px] ring-2 ring-transparent`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -right-2 -bottom-2 text-5xl opacity-20 select-none pointer-events-none transition-transform group-hover:scale-110"
                    >
                      {act.emoji}
                    </div>
                    <div className="text-2xl leading-none">{act.emoji}</div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white mb-0.5 leading-tight">{act.label}</div>
                      <div className="text-[9px] sm:text-[10px] text-white/80 leading-none truncate">{act.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        }
        secondary={secondaryTabs}
      />
    </AppShell>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { addFavorite } from '@/lib/favorites';
import { useAudio } from '@/lib/audio/context';
import CorrectBurst from '@/app/components/ui/CorrectBurst';
import type { GameProps } from './types';

interface Sentence {
  words: string[];
  emoji: string;
}

// Significantly expanded sentence pool — over 90 unique sentences spanning
// daily life, family, school, nature, animals, food, weather, sports,
// festivals and feelings. Grammar follows written modern Chinese.
const SENTENCE_POOL: Sentence[] = [
  // Self & feelings
  { words: ['我', '愛', '學習'],            emoji: '📚' },
  { words: ['我', '喜歡', '畫畫'],          emoji: '🎨' },
  { words: ['我', '想', '長大'],            emoji: '🌱' },
  { words: ['我', '今天', '很開心'],        emoji: '😄' },
  { words: ['我', '覺得', '幸福'],          emoji: '💖' },
  { words: ['我', '不會', '放棄'],          emoji: '💪' },
  { words: ['我', '會', '努力'],            emoji: '🔥' },
  { words: ['我', '夢想', '當醫生'],        emoji: '👩\u200d⚕️' },

  // Family
  { words: ['媽媽', '買了', '水果'],        emoji: '🍎' },
  { words: ['爸爸', '駕車', '上班'],        emoji: '🚗' },
  { words: ['爺爺', '帶我', '去公園'],      emoji: '🏞️' },
  { words: ['奶奶', '煮了', '飯菜'],        emoji: '🍲' },
  { words: ['哥哥', '會', '游泳'],          emoji: '🏊' },
  { words: ['姐姐', '在', '彈琴'],          emoji: '🎹' },
  { words: ['弟弟', '想', '睡覺'],          emoji: '😴' },
  { words: ['妹妹', '畫', '一朵花'],        emoji: '🌸' },
  { words: ['表哥', '送我', '玩具'],        emoji: '🧸' },
  { words: ['全家人', '一起', '吃晚飯'],    emoji: '🥢' },

  // School & friends
  { words: ['老師', '正在', '上課'],        emoji: '👩\u200d🏫' },
  { words: ['同學', '一起', '踢足球'],      emoji: '⚽' },
  { words: ['小明', '在', '看書'],          emoji: '📖' },
  { words: ['小華', '寫字', '很整齊'],      emoji: '✍️' },
  { words: ['校長', '稱讚', '同學'],        emoji: '🏅' },
  { words: ['班長', '幫忙', '派簿'],        emoji: '📒' },
  { words: ['我們', '上', '中文課'],        emoji: '📝' },
  { words: ['小息', '我們', '玩遊戲'],      emoji: '🎲' },
  { words: ['圖書館', '裡', '很安靜'],      emoji: '📚' },
  { words: ['操場上', '同學', '在跑步'],    emoji: '🏃' },
  { words: ['朋友', '送我', '禮物'],        emoji: '🎁' },
  { words: ['同學', '互相', '幫忙'],        emoji: '🤝' },

  // Daily life
  { words: ['今天', '天氣', '很好'],        emoji: '☀️' },
  { words: ['早上', '我', '吃早餐'],        emoji: '🥐' },
  { words: ['晚上', '我們', '看電視'],      emoji: '📺' },
  { words: ['媽媽', '在', '洗衣服'],        emoji: '🧺' },
  { words: ['我', '幫忙', '做家務'],        emoji: '🧹' },
  { words: ['星期天', '我們', '去玩'],      emoji: '🎈' },
  { words: ['週末', '全家', '去郊遊'],      emoji: '🥾' },
  { words: ['書本', '放在', '桌上'],        emoji: '📚' },
  { words: ['鬧鐘', '響起', '我起床'],      emoji: '⏰' },
  { words: ['我', '每天', '刷牙'],          emoji: '🪥' },
  { words: ['睡覺前', '我', '看書'],        emoji: '🛏️' },

  // Animals
  { words: ['小狗', '很', '可愛'],          emoji: '🐶' },
  { words: ['小貓', '喜歡', '喝牛奶'],      emoji: '🐱' },
  { words: ['小鳥', '在樹上', '唱歌'],      emoji: '🐦' },
  { words: ['金魚', '在', '游泳'],          emoji: '🐟' },
  { words: ['熊貓', '正在', '吃竹'],        emoji: '🐼' },
  { words: ['蝴蝶', '飛過', '花叢'],        emoji: '🦋' },
  { words: ['蜜蜂', '採', '花蜜'],          emoji: '🐝' },
  { words: ['螞蟻', '搬運', '食物'],        emoji: '🐜' },
  { words: ['小兔', '愛', '吃紅蘿蔔'],      emoji: '🐰' },
  { words: ['長頸鹿', '吃', '高樹葉'],      emoji: '🦒' },

  // Nature & weather
  { words: ['月光', '照在', '湖面'],        emoji: '🌙' },
  { words: ['風', '輕輕', '吹過'],          emoji: '🍃' },
  { words: ['花朵', '美麗', '盛開'],        emoji: '🌺' },
  { words: ['雪人', '站在', '雪地上'],      emoji: '⛄' },
  { words: ['彩虹', '橫跨', '天空'],        emoji: '🌈' },
  { words: ['雨水', '滋潤', '大地'],        emoji: '🌧️' },
  { words: ['太陽', '照亮', '世界'],        emoji: '🌞' },
  { words: ['白雲', '飄過', '山頂'],        emoji: '☁️' },
  { words: ['樹木', '漸漸', '長大'],        emoji: '🌳' },
  { words: ['星星', '一閃一閃', '發光'],    emoji: '✨' },
  { words: ['海浪', '拍打', '沙灘'],        emoji: '🌊' },
  { words: ['秋天', '樹葉', '變黃'],        emoji: '🍂' },
  { words: ['春天', '百花', '盛開'],        emoji: '🌷' },
  { words: ['冬天', '北風', '呼呼吹'],      emoji: '🌬️' },

  // Transport & city
  { words: ['火車', '快速', '前進'],        emoji: '🚆' },
  { words: ['飛機', '飛上', '天空'],        emoji: '✈️' },
  { words: ['輪船', '駛向', '遠方'],        emoji: '🚢' },
  { words: ['巴士', '停在', '車站'],        emoji: '🚌' },
  { words: ['地鐵', '駛進', '車站'],        emoji: '🚇' },
  { words: ['街道上', '車輛', '很多'],      emoji: '🚦' },
  { words: ['行人', '小心', '過馬路'],      emoji: '🚶' },

  // Food
  { words: ['我', '喜歡', '吃飯'],          emoji: '🍚' },
  { words: ['粥', '熱熱地', '送上'],        emoji: '🥣' },
  { words: ['麵條', '又香又熱'],            emoji: '🍜' },
  { words: ['西瓜', '又紅', '又甜'],        emoji: '🍉' },
  { words: ['蘋果', '是', '紅色的'],        emoji: '🍎' },
  { words: ['我', '想', '吃壽司'],          emoji: '🍣' },
  { words: ['冰淇淋', '又冷', '又甜'],      emoji: '🍦' },
  { words: ['媽媽', '做', '叉燒包'],        emoji: '🥟' },

  // Sports & play
  { words: ['我們', '一起', '打籃球'],      emoji: '🏀' },
  { words: ['哥哥', '參加', '游泳比賽'],    emoji: '🏊' },
  { words: ['小朋友', '在', '盪鞦韆'],      emoji: '🛝' },
  { words: ['爸爸', '教我', '打羽毛球'],    emoji: '🏸' },
  { words: ['我', '會', '騎腳踏車'],        emoji: '🚴' },
  { words: ['我們', '放', '風箏'],          emoji: '🪁' },

  // Festivals & special
  { words: ['新年', '我們', '吃團圓飯'],    emoji: '🧧' },
  { words: ['中秋節', '我們', '賞月'],      emoji: '🥮' },
  { words: ['端午節', '我們', '吃粽子'],    emoji: '🥢' },
  { words: ['生日', '蛋糕', '很美味'],      emoji: '🎂' },
  { words: ['我', '收到', '生日禮物'],      emoji: '🎁' },
  { words: ['煙花', '在夜空', '綻放'],      emoji: '🎆' },

  // Helping & values
  { words: ['做人', '要', '誠實'],          emoji: '🌟' },
  { words: ['我們', '應該', '愛護環境'],    emoji: '🌍' },
  { words: ['不要', '亂', '丟垃圾'],        emoji: '🗑️' },
  { words: ['遇到', '困難', '不要怕'],      emoji: '💪' },
  { words: ['幫助別人', '令人', '快樂'],    emoji: '🤗' },
];

const ROUND_COUNT = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FLOWERS = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '💐'];

export default function SentenceGarden({ onResult }: GameProps) {
  const audio = useAudio();
  const sentences = useMemo(() => shuffle(SENTENCE_POOL).slice(0, ROUND_COUNT), []);
  const [roundIdx, setRoundIdx] = useState(0);
  const [tray, setTray] = useState<string[]>([]);
  const [arranged, setArranged] = useState<string[]>([]);
  const [flowers, setFlowers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [burst, setBurst] = useState(false);
  const startRef = useRef(0);
  const scoreRef = useRef(0);

  const current = sentences[roundIdx];

  useEffect(() => {
    Promise.resolve().then(() => {
      if (startRef.current === 0) startRef.current = Date.now();
      if (!current) return;
      setTray(shuffle(current.words));
      setArranged([]);
      setFeedback('idle');
    });
  }, [roundIdx, current]);

  const moveToSlot = useCallback((word: string) => {
    if (feedback !== 'idle') return;
    const nextArranged = [...arranged, word];
    const newTray = [...tray];
    const idx = newTray.indexOf(word);
    if (idx >= 0) newTray.splice(idx, 1);
    setTray(newTray);
    setArranged(nextArranged);

    if (nextArranged.length === current.words.length) {
      const correct = nextArranged.join('') === current.words.join('');
      if (correct) {
        setFeedback('correct');
        setBurst(true);
        audio.playCorrect();
        setFlowers(f => [...f, FLOWERS[Math.floor(Math.random() * FLOWERS.length)]]);
        scoreRef.current += 1;
        const newScore = scoreRef.current;
        setTimeout(() => {
          const r = roundIdx + 1;
          setBurst(false);
          if (r >= ROUND_COUNT) {
            const stars: 1 | 2 | 3 = newScore >= ROUND_COUNT ? 3 : newScore >= Math.ceil(ROUND_COUNT * 0.6) ? 2 : 1;
            onResult({ stars, correctCount: newScore, totalCount: ROUND_COUNT, durationMs: Date.now() - startRef.current });
          } else {
            setRoundIdx(r);
          }
        }, 1100);
      } else {
        setFeedback('wrong');
        audio.playIncorrect();
        // Auto-save the correct sentence as a "word" favorite so the user can revisit it.
        addFavorite({
          text: current.words.join(''),
          kind: 'word',
          source: 'game:sentence-garden',
          reason: 'mistake',
        });
        setTimeout(() => {
          setTray(shuffle(current.words));
          setArranged([]);
          setFeedback('idle');
        }, 900);
      }
    }
  }, [arranged, tray, roundIdx, current, feedback, onResult, audio]);

  const moveBack = useCallback((word: string) => {
    if (feedback !== 'idle') return;
    setArranged(prev => {
      const n = [...prev];
      n.splice(n.lastIndexOf(word), 1);
      return n;
    });
    setTray(prev => [...prev, word]);
  }, [feedback]);

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
      {/* HUD */}
      <div className="w-full max-w-md flex items-center justify-between text-sm">
        <span className="text-slate-700">第 <strong>{roundIdx + 1}</strong> / {ROUND_COUNT} 句</span>
        <div className="flex items-center gap-1 text-xl">
          <span className="text-xs text-slate-500 mr-1">花園</span>
          {flowers.length === 0 ? <span className="text-slate-400 text-base">尚未開花</span> : flowers.map((f, i) => <span key={i}>{f}</span>)}
        </div>
      </div>

      {/* Scene — wider on iPad+ */}
      <div className="w-full max-w-md md:max-w-2xl rounded-2xl bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 border-2 border-emerald-200 p-4 text-center relative overflow-hidden min-h-[100px]">
        <div className="absolute top-2 right-2 text-2xl">☀️</div>
        <div className="absolute top-2 left-2 text-xl opacity-60">☁️</div>
        <div className="text-5xl sm:text-6xl mb-1 animate-float inline-block">{current?.emoji ?? '🌳'}</div>
        <div className="text-sm text-slate-600">把詞語拼成一句話：</div>
        <CorrectBurst show={burst} />
      </div>

      {/* Assembly area — stacked on portrait, side-by-side on phone landscape & iPad+ landscape */}
      <div className="w-full max-w-md md:max-w-3xl flex flex-col max-md:landscape:flex-row md:landscape:flex-row gap-3 items-stretch justify-center">
        {/* Slots */}
        <div className={`flex-1 flex gap-1.5 sm:gap-2 min-h-14 sm:min-h-16 flex-wrap justify-center items-center p-3 rounded-2xl border-2 border-dashed transition-colors ${
          feedback === 'correct' ? 'bg-emerald-100 border-emerald-400' :
          feedback === 'wrong'   ? 'bg-rose-100 border-rose-400 animate-wiggle' :
          'bg-indigo-50 border-indigo-300'
        }`}>
          {arranged.length === 0 && (
            <div className="text-slate-400 text-sm">↓ 從下方/旁邊點擊詞語</div>
          )}
          {arranged.map((w, i) => (
            <button
              key={i}
              onClick={() => moveBack(w)}
              disabled={feedback !== 'idle'}
              aria-label={`移走「${w}」`}
              className={`px-3 py-2 min-h-11 inline-flex items-center rounded-xl border-2 font-chinese font-bold text-base sm:text-lg shadow-sm hover:opacity-80 disabled:cursor-not-allowed
                focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 ${
                feedback === 'correct' ? 'bg-emerald-500 border-emerald-600 text-white' :
                feedback === 'wrong'   ? 'bg-rose-500 border-rose-600 text-white' :
                'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Tray */}
        <div className="flex-1 flex gap-2 flex-wrap justify-center content-center p-3 rounded-2xl bg-amber-50/40 border-2 border-amber-200">
          {tray.map((w, i) => (
            <button
              key={i}
              onClick={() => moveToSlot(w)}
              disabled={feedback !== 'idle'}
              aria-label={`加入「${w}」`}
              className="px-3 py-2 min-h-11 inline-flex items-center rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 border-2 border-amber-400 font-chinese font-bold text-base sm:text-lg text-amber-900 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all shadow-md
                focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

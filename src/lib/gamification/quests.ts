export interface QuestDefinition {
  id: string;
  action: string; // activity type that satisfies the quest
  target: number;
  label: { 'zh-HK': string; en: string };
}

export const QUEST_POOL: QuestDefinition[] = [
  { id: 'trace_5',     action: 'trace',      target: 5,  label: { 'zh-HK': '寫5個字', en: 'Trace 5 characters' } },
  { id: 'trace_10',    action: 'trace',      target: 10, label: { 'zh-HK': '寫10個字', en: 'Trace 10 characters' } },
  { id: 'flashcard_10',action: 'flashcard',  target: 10, label: { 'zh-HK': '溫習10張字卡', en: 'Review 10 flashcards' } },
  { id: 'flashcard_20',action: 'flashcard',  target: 20, label: { 'zh-HK': '溫習20張字卡', en: 'Review 20 flashcards' } },
  { id: 'game_1',      action: 'game',       target: 1,  label: { 'zh-HK': '玩1個遊戲', en: 'Play 1 mini-game' } },
  { id: 'game_3',      action: 'game',       target: 3,  label: { 'zh-HK': '玩3個遊戲', en: 'Play 3 mini-games' } },
  { id: 'dictation_5', action: 'dictation',  target: 5,  label: { 'zh-HK': '完成5題默書', en: '5 dictation answers' } },
  { id: 'explore_5',   action: 'explore',    target: 5,  label: { 'zh-HK': '認識5個新字', en: 'Explore 5 characters' } },
];

// Simple deterministic pick using date as seed
function dateHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickDailyQuests(dateStr: string): QuestDefinition[] {
  const seed = dateHash(dateStr);
  const pool = [...QUEST_POOL];
  const result: QuestDefinition[] = [];
  let s = seed;
  while (result.length < 3 && pool.length > 0) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % pool.length;
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export interface ActiveQuest {
  id: string;
  progress: number;
  target: number;
  done: boolean;
}

export function completeQuestAction(
  quests: ActiveQuest[],
  action: string
): { quests: ActiveQuest[]; justCompleted: string[] } {
  const justCompleted: string[] = [];
  const updated = quests.map(q => {
    const def = QUEST_POOL.find(d => d.id === q.id);
    if (!def || q.done || def.action !== action) return q;
    const progress = Math.min(q.progress + 1, q.target);
    const done = progress >= q.target;
    if (done && !q.done) justCompleted.push(q.id);
    return { ...q, progress, done };
  });
  return { quests: updated, justCompleted };
}

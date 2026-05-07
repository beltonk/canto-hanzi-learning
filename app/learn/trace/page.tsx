'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FullCharacterData, IndexEntry } from '@/types/fullCharacter';
import AppShell from '@/app/components/ui/AppShell';
import StrokeTracing from '@/app/components/learning/StrokeTracing';
import FavoriteButton from '@/app/components/ui/FavoriteButton';
import { useAudio } from '@/lib/audio/context';
import EndOfSessionSummary from '@/app/components/ui/EndOfSessionSummary';
import { useSessionSummary } from '@/lib/activity/useSessionSummary';
import { recordActivity } from '@/lib/activity/recordActivity';

const STROKE_RANGES = [
  { label: '全部', min: 1, max: 32 },
  { label: '1-5', min: 1, max: 5 },
  { label: '6-10', min: 6, max: 10 },
  { label: '11-15', min: 11, max: 15 },
  { label: '16+', min: 16, max: 32 },
];

function TracePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audio = useAudio();
  const { initSession, requestExit, summary, dismissSummary } = useSessionSummary();
  const [characterList, setCharacterList] = useState<IndexEntry[]>([]);
  const [strokeRange, setStrokeRange] = useState(STROKE_RANGES[1]);
  const [filterRadical, setFilterRadical] = useState<string>('');
  const [showCharList, setShowCharList] = useState(false);
  const [currentChar, setCurrentChar] = useState<string>('');
  const [data, setData] = useState<FullCharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastStars, setLastStars] = useState<1 | 2 | 3 | null>(null);
  const [canvasSize, setCanvasSize] = useState(360);

  useEffect(() => { initSession(); }, [initSession]);

  useEffect(() => {
    fetch('/api/characters?indexOnly=true&inLexicalListsHK=true')
      .then(r => r.json())
      .then(json => {
        const entries: IndexEntry[] = (json.entries ?? []).filter((e: IndexEntry) => (e.strokeCount ?? 0) > 0);
        setCharacterList(entries);
        const initial = searchParams.get('char') ?? entries[0]?.character ?? '';
        setCurrentChar(initial);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Responsive canvas size
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // 360 default, fits cleanly on iPad/desktop; mobile uses (width - 32px padding - 4px border)
      if (w >= 1024) setCanvasSize(380);
      else if (w >= 768) setCanvasSize(320); // iPad portrait: side-by-side, so less width
      else if (w >= 640) setCanvasSize(340);
      else setCanvasSize(Math.min(w - 48, 320));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filteredList = useMemo(() => {
    return characterList.filter(e => {
      if (e.strokeCount < strokeRange.min || e.strokeCount > strokeRange.max) return false;
      if (filterRadical && e.radical !== filterRadical) return false;
      return true;
    });
  }, [characterList, strokeRange, filterRadical]);

  const radicals = useMemo(() => {
    const set = new Set<string>();
    characterList.forEach(e => { if (e.radical) set.add(e.radical); });
    return Array.from(set).sort();
  }, [characterList]);

  const loadChar = useCallback(async (char: string) => {
    setLoading(true);
    setLastStars(null);
    try {
      const r = await fetch(`/api/characters?char=${encodeURIComponent(char)}`);
      const json = await r.json();
      setData(json.character ?? null);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentChar) {
      setTimeout(() => loadChar(currentChar), 0);
    }
  }, [currentChar, loadChar]);

  const handleComplete = useCallback((stars: 1 | 2 | 3) => {
    setLastStars(stars);
    const action = stars === 3 ? 'trace_3star' : stars === 2 ? 'trace_2star' : 'trace_1star';
    recordActivity(
      { type: 'trace', char: currentChar, stars, at: Date.now() },
      action,
      stars >= 2,
    );
    if (stars >= 2) {
      audio.play('success.chime');
    }
  }, [currentChar, audio]);

  const goPrev = () => {
    const idx = filteredList.findIndex(e => e.character === currentChar);
    if (idx > 0) setCurrentChar(filteredList[idx - 1].character);
  };
  const goNext = () => {
    const idx = filteredList.findIndex(e => e.character === currentChar);
    if (idx >= 0 && idx < filteredList.length - 1) setCurrentChar(filteredList[idx + 1].character);
  };
  const goRandom = () => {
    if (filteredList.length === 0) return;
    const pick = filteredList[Math.floor(Math.random() * filteredList.length)];
    setCurrentChar(pick.character);
  };

  const currentIdx = filteredList.findIndex(e => e.character === currentChar);

  return (
    <AppShell title="筆順練習" emoji="🖌️" bg="indigo" onBack={() => requestExit(() => router.push('/'))}>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-5xl">
        {/* Compact filters in single row */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm border-2 border-indigo-200 p-3 sm:p-4 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 shrink-0">筆畫</span>
            <div className="flex gap-1 flex-wrap">
              {STROKE_RANGES.map(r => (
                <button
                  key={r.label}
                  onClick={() => setStrokeRange(r)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    strokeRange === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-700 ml-2">部首</span>
            <select
              value={filterRadical}
              onChange={e => setFilterRadical(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-indigo-200 bg-white/80 text-slate-700 focus:border-indigo-500 focus:outline-none font-chinese"
            >
              <option value="">全部</option>
              {radicals.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filteredList.length} 個字</span>
          </div>
        </div>

        {/* Side-by-side from md (iPad portrait) up */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-3">
          {/* Tracing area */}
          <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-50 rounded-2xl shadow-sm border-2 border-indigo-300 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentIdx <= 0}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg"
                  aria-label="上一個"
                >
                  ←
                </button>
                <div className="text-center min-w-[110px]">
                  <div className="font-chinese text-4xl sm:text-5xl text-slate-900 leading-none font-medium">{currentChar}</div>
                  {data && (
                    <div className="text-sm text-indigo-600 mt-1.5 font-mono">{data.jyutping}</div>
                  )}
                </div>
                <button
                  onClick={goNext}
                  disabled={currentIdx >= filteredList.length - 1}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg"
                  aria-label="下一個"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => audio.speakTTS(currentChar, 'zh-HK', 0.8)}
                  className="w-11 h-11 rounded-full bg-indigo-600 text-white text-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
                  aria-label="播放發音"
                >
                  🔊
                </button>
                <button
                  onClick={goRandom}
                  className="w-11 h-11 rounded-full bg-amber-500 text-white text-lg shadow-md hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center"
                  aria-label="隨機"
                  title="隨機選一個字"
                >
                  🎲
                </button>
                {currentChar && (
                  <FavoriteButton
                    text={currentChar}
                    kind="char"
                    jyutping={data?.jyutping}
                    source="trace"
                    variant="icon"
                    size="md"
                  />
                )}
                {lastStars != null && (
                  <div className="text-2xl">{'⭐'.repeat(lastStars)}</div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              {loading ? (
                <div className="py-16 text-slate-500">載入中...</div>
              ) : (
                <StrokeTracing
                  strokeVectors={data?.strokeVectors}
                  character={currentChar}
                  size={canvasSize}
                  onComplete={handleComplete}
                />
              )}
            </div>
          </div>

          {/* Character picker — sidebar on desktop, below on mobile */}
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-sky-200 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">選字 ({filteredList.length})</span>
              {filteredList.length > 60 && (
                <button
                  onClick={() => setShowCharList(!showCharList)}
                  className="text-xs text-indigo-600 font-medium"
                >
                  {showCharList ? '收起' : '展開'}
                </button>
              )}
            </div>
            <div className={`grid grid-cols-7 sm:grid-cols-8 md:grid-cols-5 lg:grid-cols-5 gap-1.5 ${!showCharList && filteredList.length > 60 ? 'max-h-[180px] overflow-hidden' : 'max-h-[360px] overflow-y-auto scrollbar-thin'}`}>
              {filteredList.map(e => (
                <button
                  key={e.character}
                  onClick={() => setCurrentChar(e.character)}
                  className={`aspect-square rounded-lg font-chinese text-lg sm:text-xl flex items-center justify-center transition-all border ${
                    e.character === currentChar
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                      : 'bg-white/70 border-sky-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  {e.character}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <EndOfSessionSummary
          xpEarned={summary.xpEarned}
          charsCount={summary.charsCount}
          streak={summary.streak}
          onClose={dismissSummary}
        />
      )}
    </AppShell>
  );
}

export default function TracePage() {
  return (
    <Suspense fallback={
      <AppShell title="筆順練習" emoji="🖌️" bg="indigo">
        <div className="flex items-center justify-center py-20 text-slate-500">載入中...</div>
      </AppShell>
    }>
      <TracePageContent />
    </Suspense>
  );
}

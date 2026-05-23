'use client';

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FullCharacterData, IndexEntry } from '@/types/fullCharacter';
import AppShell from '@/app/components/ui/AppShell';
import StrokeTracing from '@/app/components/learning/StrokeTracing';
import FavoriteButton from '@/app/components/ui/FavoriteButton';
import { useAudio } from '@/lib/audio/context';
import EndOfSessionSummary from '@/app/components/ui/EndOfSessionSummary';
import { useSessionSummary } from '@/lib/activity/useSessionSummary';
import { recordActivity } from '@/lib/activity/recordActivity';
import { useElementSize } from '@/lib/viewport';

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
  const [currentChar, setCurrentChar] = useState<string>('');
  const [data, setData] = useState<FullCharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastStars, setLastStars] = useState<1 | 2 | 3 | null>(null);

  // Container-driven canvas sizing via ResizeObserver — no manual resize listeners needed.
  const tracingContainerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useElementSize(tracingContainerRef);
  // Canvas is a square that fits inside the container, padded 24px each side, clamped 200–420px.
  const canvasSize = Math.round(Math.min(Math.max(containerWidth - 48, 200), 420));

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
    <AppShell title="筆順練習" emoji="🖌️" bg="indigo" fillHeight onBack={() => requestExit(() => router.push('/'))}>
      <div className="flex-1 flex flex-col min-h-0 w-full h-full p-0">
        {/* Compact filters in single row */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm border-2 border-indigo-200 p-3 sm:p-4 mb-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 shrink-0">筆畫</span>
            <div className="flex gap-1 flex-wrap">
              {STROKE_RANGES.map(r => (
                <button
                  key={r.label}
                  onClick={() => setStrokeRange(r)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all min-h-11 min-w-11 inline-flex items-center justify-center
                    focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 ${
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
              className="px-3 py-1.5 rounded-lg text-sm border border-indigo-200 bg-white/80 text-slate-700 focus:border-indigo-500 focus:outline-none font-chinese h-11"
              aria-label="按部首篩選"
            >
              <option value="">全部</option>
              {radicals.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filteredList.length} 個字</span>
          </div>
        </div>

        {/* Side-by-side from md (iPad portrait) up — fills remaining vertical space */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-3 min-h-0">
          {/* Tracing area */}
          <div ref={tracingContainerRef} className="bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-50 rounded-2xl shadow-sm border-2 border-indigo-300 p-3 sm:p-4 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentIdx <= 0}
                  className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
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
                  className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                  aria-label="下一個"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => audio.speakTTS(currentChar, 'zh-HK', 0.5)}
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

          {/* Character picker — sidebar on iPad/desktop, below on mobile.
              Fills the entire vertical space and scrolls internally when
              there are more characters than fit. */}
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-sky-200 p-3 sm:p-4
                          flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-sm font-semibold text-slate-700">選字 ({filteredList.length})</span>
              {currentChar && (
                <span className="font-chinese text-lg text-indigo-600 font-bold">{currentChar}</span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1
                            scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                {filteredList.map(e => (
                  <button
                    key={e.character}
                    onClick={() => setCurrentChar(e.character)}
                    aria-label={e.character}
                    aria-current={e.character === currentChar ? 'true' : undefined}
                    className={`aspect-square min-h-11 min-w-11 rounded-lg font-chinese text-lg sm:text-xl flex items-center justify-center transition-all border
                      focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 ${
                      e.character === currentChar
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                        : 'bg-white/70 border-sky-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    {e.character}
                  </button>
                ))}
                {filteredList.length === 0 && (
                  <div className="col-span-full text-center text-sm text-slate-400 py-6">
                    沒有符合條件的字
                  </div>
                )}
              </div>
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

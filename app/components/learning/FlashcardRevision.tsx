"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullCharacterData, IndexSummary } from "@/types/fullCharacter";
import { CompactWordList } from "./RelatedWords";
import NavArrow from "@/app/components/ui/NavArrow";
import Mascot from "@/app/components/ui/Mascot";
import Button from "@/app/components/ui/Button";
import StrokeAnimation from "./StrokeAnimation";
import FavoriteButton from "@/app/components/ui/FavoriteButton";
import { useLanguage } from "@/lib/i18n/context";
import { useAudio } from "@/lib/audio/context";
import { useMotionClass } from "@/lib/motion";
import { recordActivity } from "@/lib/activity/recordActivity";

const STROKE_RANGES = [
  { labelKey: "all" as const, label: "全部", min: 1, max: 32 },
  { labelKey: null, label: "1-5", min: 1, max: 5 },
  { labelKey: null, label: "6-10", min: 6, max: 10 },
  { labelKey: null, label: "11-15", min: 11, max: 15 },
  { labelKey: null, label: "16+", min: 16, max: 32 },
];

interface FlashcardRevisionProps {
  /** Optional explicit list of characters to revise. When provided, the
   *  setup screen is skipped and the cards are loaded immediately. */
  initialCharList?: string[];
  /** Optional friendly title shown when an external char list is loaded. */
  initialTitle?: string;
}

export default function FlashcardRevision({
  initialCharList,
  initialTitle,
}: FlashcardRevisionProps = {}) {
  const { t, language } = useLanguage();
  const audio = useAudio();
  // Card transitions go through the shared motion primitive so the global
  // prefers-reduced-motion preference disables the float-in animation.
  const cardEnterClass = useMotionClass('floatIn');
  
  // Filter state
  const [strokeRange, setStrokeRange] = useState(STROKE_RANGES[0]);
  const [summary, setSummary] = useState<IndexSummary | null>(null);
  
  // Session state
  const [characters, setCharacters] = useState<FullCharacterData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Tracks whether the current session was started from a deep link
   *  (so the back button returns to the previous page rather than the
   *  setup screen). */
  const [externalListLabel, setExternalListLabel] = useState<string | null>(null);
  
  // Card state
  const [showFilters, setShowFilters] = useState(false);
  const [showStrokeAnimation, setShowStrokeAnimation] = useState(false);

  // Load summary stats on mount
  useEffect(() => {
    fetch("/api/characters?meta=summary")
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Failed to load summary:", err));
  }, []);

  // Load saved filters from session storage
  useEffect(() => {
    const savedStrokeIndex = sessionStorage.getItem("flashcard-stroke-index");
    
    if (savedStrokeIndex) {
      const index = parseInt(savedStrokeIndex, 10);
      if (!isNaN(index) && index >= 0 && index < STROKE_RANGES.length) {
        setStrokeRange(STROKE_RANGES[index]);
      }
    }
  }, []);

  // Save filters to session storage
  useEffect(() => {
    sessionStorage.setItem("flashcard-stroke-index", STROKE_RANGES.indexOf(strokeRange).toString());
  }, [strokeRange]);

  // Fetch characters with current filters using index-based API
  const fetchCharacters = useCallback(async (newStrokeRange?: typeof STROKE_RANGES[0]) => {
    const currentStrokeRange = newStrokeRange ?? strokeRange;
    
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("minStrokes", currentStrokeRange.min.toString());
      params.set("maxStrokes", currentStrokeRange.max.toString());
      params.set("shuffle", "true");
      params.set("inLexicalListsHK", "true"); // Only HK lexical list chars
      params.set("limit", "100"); // Limit for performance

      const response = await fetch(`/api/characters?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("loadFailed"));
      }

      if (!data.characters || data.characters.length === 0) {
        setError(t("noMatchingChars"));
        setCharacters([]);
      } else {
        setCharacters(data.characters);
        setCurrentIndex(0);
        setShowStrokeAnimation(false);
        setIsStarted(true);
        setExternalListLabel(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [strokeRange, t]);

  // Fetch a focused list of characters by exact match (used by deep links
  // such as 今日要複習 / 立即複習 / 學習狀態).
  const fetchByCharList = useCallback(async (chars: string[], label?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        chars.map(c =>
          fetch(`/api/characters?char=${encodeURIComponent(c)}`)
            .then(res => (res.ok ? res.json() : null))
            .catch(() => null),
        ),
      );
      const loaded = results
        .map(r => r?.character as FullCharacterData | undefined)
        .filter((c): c is FullCharacterData => Boolean(c));

      if (loaded.length === 0) {
        setError(t("noMatchingChars"));
        setCharacters([]);
      } else {
        setCharacters(loaded);
        setCurrentIndex(0);
        setShowStrokeAnimation(false);
        setIsStarted(true);
        setExternalListLabel(label ?? `共 ${loaded.length} 字`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // When initialCharList is provided, auto-start the session with that list.
  useEffect(() => {
    if (initialCharList && initialCharList.length > 0 && !isStarted && !isLoading) {
      fetchByCharList(initialCharList, initialTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCharList, initialTitle]);

  // Handle filter change while viewing cards
  const handleFilterChange = (newStrokeRange: typeof STROKE_RANGES[0]) => {
    setStrokeRange(newStrokeRange);
    fetchCharacters(newStrokeRange);
    setShowFilters(false);
  };

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < characters.length - 1) {
      const nextChar = characters[currentIndex + 1];
      if (nextChar) {
          recordActivity(
          { type: 'flashcard', char: nextChar.character, at: Date.now() },
          'flashcard_card',
        );
      }
      setCurrentIndex(currentIndex + 1);
      setShowStrokeAnimation(false);
    }
  }, [currentIndex, characters]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowStrokeAnimation(false);
    }
  }, [currentIndex]);

  // Play pronunciation via AudioEngine (respects mute + ducks music)
  const playPronunciation = useCallback((text?: string) => {
    const current = characters[currentIndex];
    if (!current && !text) return;
    audio.speakTTS(text || current.character, "zh-HK", 0.5);
  }, [characters, currentIndex, audio]);

  // Keyboard navigation
  useEffect(() => {
    if (!isStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case " ":
          e.preventDefault();
          playPronunciation();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStarted, goToNext, goToPrevious, playPronunciation]);

  // Get estimated count based on filters
  const getEstimatedCount = () => {
    if (!summary) return t("loadingData");
    
    // Use lexical lists HK count as base
    let count = summary.lexicalListsHKCount;
    
    // Stroke filter approximation
    if (strokeRange !== STROKE_RANGES[0]) {
      const strokesInRange = summary.strokeCounts
        .filter(s => s.strokes >= strokeRange.min && s.strokes <= strokeRange.max)
        .reduce((sum, s) => sum + s.count, 0);
      // Rough proportion based on total characters
      count = Math.round((strokesInRange / summary.totalCharacters) * count);
    }
    
    return language === "en" ? `~${count} chars` : `約 ${count} 字`;
  };
  
  // Get stroke range label
  const getStrokeRangeLabel = (range: typeof STROKE_RANGES[0]) => {
    if (range.labelKey === "all") return t("all");
    return range.label;
  };

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100
                        rounded-3xl shadow-xl border-2 border-sky-300 p-6 md:p-8">
          {/* Header row */}
          <div className="flex items-center gap-4 mb-6">
            <Mascot type="rabbit" size={64} message={t("selectRange")} />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{t("flashcardSettings")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("usingHkWordList")}</p>
            </div>
          </div>

          {/* Stroke range buttons — all in one row */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t("strokeCountLabel")}</label>
            <div className="flex gap-2 flex-wrap">
              {STROKE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => setStrokeRange(range)}
                  className={`flex-1 min-w-[60px] px-3 py-3 rounded-2xl font-bold text-base transition-all active:scale-95
                    ${strokeRange === range
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                      : 'bg-white border-2 border-sky-200 text-slate-600 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                >
                  {getStrokeRangeLabel(range)}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-slate-500 mt-2">{getEstimatedCount()}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-300 text-rose-700 rounded-2xl text-center text-sm">
              {error}
            </div>
          )}

          <Button onClick={() => fetchCharacters()} disabled={isLoading} variant="primary" size="xl" fullWidth>
            {isLoading ? t("loadingData") : `${t("startRevision")} 🎯`}
          </Button>

          <p className="mt-3 text-xs text-slate-400 text-center">{t("keyboardHints")}</p>
        </div>
      </div>
    );
  }

  // ── SESSION ────────────────────────────────────────────────────────────────
  const current = characters[currentIndex];
  if (!current) return null;

  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === characters.length - 1;
  const progress = ((currentIndex + 1) / characters.length) * 100;
  const hasWords = (current.stage1Words?.length || 0) + (current.stage2Words?.length || 0) > 0;
  const hasStrokeData = current.strokeVectors && current.strokeVectors.length > 0;

  return (
    /* Full-height landscape layout: [← nav] [left col] [right col] [→ nav] */
    <div className="flex-1 flex flex-col min-h-0">

      {/* ── Top bar: progress + filter toggle ── */}
      <div className="flex items-center gap-3 px-2 py-1.5 shrink-0">
        {/* External list label (e.g. "今日要複習") */}
        {externalListLabel && (
          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold
                           bg-gradient-to-r from-amber-200 to-orange-200
                           border-2 border-amber-400 text-amber-900">
            📌 {externalListLabel}
          </span>
        )}

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
            {currentIndex + 1}/{characters.length}
          </span>
          <div className="flex-1 h-2.5 bg-sky-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Filter pill — hidden when we're in a deep-linked focused list */}
        {!externalListLabel && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
              ${showFilters ? 'bg-sky-500 text-white border-sky-500' : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'}`}
          >
            📐 {getStrokeRangeLabel(strokeRange)}
            <span className="opacity-60">{showFilters ? '▲' : '▼'}</span>
          </button>
        )}

        {/* Back to settings */}
        <button
          onClick={() => {
            setIsStarted(false);
            setExternalListLabel(null);
          }}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border-2 border-slate-200 hover:bg-slate-200 transition-all"
        >
          ⚙️ 選字
        </button>
      </div>

      {/* Inline filter panel */}
      {showFilters && (
        <div className="mx-2 mb-2 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200 rounded-2xl flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-xs font-semibold text-slate-600 shrink-0">筆畫：</span>
          {STROKE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() => handleFilterChange(range)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all
                ${strokeRange === range ? 'bg-sky-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-sky-200 hover:bg-sky-50'}`}
            >
              {getStrokeRangeLabel(range)}
            </button>
          ))}
        </div>
      )}

      {/* ── Main area: nav arrows + two-column card ── */}
      <div className="flex-1 flex items-stretch gap-1 min-h-0 px-1 pb-1">

        {/* Left arrow */}
        <div className="flex items-center shrink-0">
          <NavArrow direction="left" onClick={goToPrevious} disabled={isFirst} size="md" />
        </div>

        {/* Card — two columns */}
        <div
          key={current.character}
          className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0 overflow-hidden
                      bg-gradient-to-br from-sky-100 via-white to-purple-100
                      rounded-3xl shadow-xl border-2 border-sky-300 ${cardEnterClass}`}
        >
          {/* LEFT: Character display */}
          <div className="flex flex-col items-center justify-center p-4 md:p-6
                          md:border-r-2 border-sky-200 bg-gradient-to-br from-sky-100 to-indigo-100">
            {/* Big stroke animation */}
            <div
              onClick={() => hasStrokeData && setShowStrokeAnimation(!showStrokeAnimation)}
              className={`${hasStrokeData ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''} mb-3`}
              title={hasStrokeData ? t("clickForAnimation") : ""}
            >
              <StrokeAnimation
                strokeVectors={current.strokeVectors}
                character={current.character}
                size={200}
                showAnimation={showStrokeAnimation}
                onAnimationEnd={() => setShowStrokeAnimation(false)}
              />
            </div>

            {hasStrokeData && (
              <p className="text-xs text-indigo-400 mb-2">{t("clickForAnimation")}</p>
            )}

            {/* Jyutping */}
            <div className="text-center mb-3">
              <div className="jyutping text-sky-600 text-2xl md:text-3xl font-bold">
                {current.jyutping}
              </div>
              {current.pinyin && (
                <div className="text-sm text-slate-400 mt-0.5">({current.pinyin})</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => playPronunciation()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full
                           bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-bold text-sm
                           shadow-md shadow-sky-200 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                🔊 {t("playPronunciation")}
              </button>
              <FavoriteButton
                text={current.character}
                kind="char"
                jyutping={current.jyutping}
                source="flashcard"
                variant="chip"
              />
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="flex flex-col p-4 md:p-6 min-h-0 overflow-y-auto gap-3">
            {/* Radical + stroke count pills */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div className="bg-rose-100 border border-rose-200 rounded-2xl p-3 text-center">
                <div className="text-xs text-rose-600 font-semibold mb-1">{t("radical")}</div>
                <div className="text-2xl hanzi-display font-bold text-rose-800">
                  {current.radical || '—'}
                </div>
              </div>
              <div className="bg-teal-100 border border-teal-200 rounded-2xl p-3 text-center">
                <div className="text-xs text-teal-600 font-semibold mb-1">{t("strokeCount")}</div>
                <div className="text-2xl font-bold text-teal-800">
                  {current.strokeCount}<span className="text-sm ml-0.5">{t("strokesUnit")}</span>
                </div>
              </div>
            </div>

            {/* Divider with section header */}
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-sm font-bold text-sky-700">📚 詞語</span>
              <div className="flex-1 border-t-2 border-sky-100" />
            </div>

            {/* Words section — always visible, scrolls internally */}
            {hasWords ? (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1
                              scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
                {current.stage1Words && current.stage1Words.length > 0 && (
                  <CompactWordList words={current.stage1Words} title={t("stage1")} icon="📗" />
                )}
                {current.stage2Words && current.stage2Words.length > 0 && (
                  <CompactWordList words={current.stage2Words} title={t("stage2")} icon="📘" />
                )}
                {current.fourCharacterPhrases && current.fourCharacterPhrases.length > 0 && (
                  <CompactWordList words={current.fourCharacterPhrases} title={t("fourCharPhrases")} icon="✨" />
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-400 text-center">暫無詞語資料</p>
              </div>
            )}

            {/* Keyboard hint */}
            <p className="shrink-0 text-center text-xs text-slate-400 mt-auto pt-2">
              ← → 切換 · 空白鍵 發音
            </p>
          </div>
        </div>

        {/* Right arrow */}
        <div className="flex items-center shrink-0">
          <NavArrow direction="right" onClick={goToNext} disabled={isLast} size="md" />
        </div>
      </div>
    </div>
  );
}

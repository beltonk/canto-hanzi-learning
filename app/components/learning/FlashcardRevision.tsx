"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullCharacterData, IndexSummary } from "@/types/fullCharacter";
import { CompactWordList } from "./RelatedWords";
import NavArrow from "@/app/components/ui/NavArrow";
import Mascot from "@/app/components/ui/Mascot";
import Button from "@/app/components/ui/Button";
import StrokeAnimation from "./StrokeAnimation";
import { useLanguage } from "@/lib/i18n/context";

const STROKE_RANGES = [
  { labelKey: "all" as const, label: "全部", min: 1, max: 32 },
  { labelKey: null, label: "1-5", min: 1, max: 5 },
  { labelKey: null, label: "6-10", min: 6, max: 10 },
  { labelKey: null, label: "11-15", min: 11, max: 15 },
  { labelKey: null, label: "16+", min: 16, max: 32 },
];

export default function FlashcardRevision() {
  const { t, language } = useLanguage();
  
  // Filter state
  const [strokeRange, setStrokeRange] = useState(STROKE_RANGES[0]);
  const [summary, setSummary] = useState<IndexSummary | null>(null);
  
  // Session state
  const [characters, setCharacters] = useState<FullCharacterData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Card state
  const [showDetails, setShowDetails] = useState(false);
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
        setShowDetails(false);
        setShowStrokeAnimation(false);
        setIsStarted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [strokeRange, t]);

  // Handle filter change while viewing cards
  const handleFilterChange = (newStrokeRange: typeof STROKE_RANGES[0]) => {
    setStrokeRange(newStrokeRange);
    fetchCharacters(newStrokeRange);
    setShowFilters(false);
  };

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
      setShowStrokeAnimation(false);
    }
  }, [currentIndex, characters.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowDetails(false);
      setShowStrokeAnimation(false);
    }
  }, [currentIndex]);

  // Play pronunciation using Web Speech API
  const playPronunciation = useCallback((text?: string) => {
    const current = characters[currentIndex];
    if (!current && !text) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text || current.character);
      utterance.lang = "zh-HK";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [characters, currentIndex]);

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
        case "Enter":
          e.preventDefault();
          setShowDetails(!showDetails);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStarted, goToNext, goToPrevious, playPronunciation, showDetails]);

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

  // Render filter selection panel
  if (!isStarted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-[var(--card-bg)] rounded-3xl shadow-[0_8px_32px_var(--card-shadow)] p-8 md:p-10">
          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <Mascot type="rabbit" size="lg" message={t("selectRange")} />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-8 text-center">
            {t("flashcardSettings")}
          </h2>

          {/* Stroke Count Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-[var(--color-charcoal)] mb-3">
              {t("strokeCountLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STROKE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => setStrokeRange(range)}
                  className={`px-4 py-4 rounded-2xl border-3 transition-all text-xl font-medium
                    min-h-[56px]
                    ${strokeRange === range
                      ? "border-[var(--color-sky)] bg-[var(--color-sky)]/10 text-[var(--color-sky-dark)]"
                      : "border-[var(--color-peach)] bg-[var(--card-bg)] text-[var(--color-gray)] hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/5"
                    }`}
                >
                  {getStrokeRangeLabel(range)}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Count */}
          <div className="mb-6 text-center text-[var(--color-gray)]">
            {getEstimatedCount()}
          </div>

          {/* Info */}
          <div className="mb-6 p-4 bg-[var(--color-sky)]/10 rounded-xl text-sm text-[var(--color-sky-dark)]">
            📚 {t("usingHkWordList")}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-5 bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] text-[var(--color-coral-dark)] rounded-2xl text-center text-lg">
              {error}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={() => fetchCharacters()}
            disabled={isLoading}
            variant="primary"
            size="xl"
            fullWidth
          >
            {isLoading ? t("loadingData") : `${t("startRevision")} 🎯`}
          </Button>

          <p className="mt-6 text-base text-[var(--color-gray)] text-center">
            {t("keyboardHints")}
          </p>
        </div>
      </div>
    );
  }

  // Current character
  const current = characters[currentIndex];
  if (!current) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === characters.length - 1;
  const progress = ((currentIndex + 1) / characters.length) * 100;

  // Word counts for current character
  const hasWords = (current.stage1Words?.length || 0) + (current.stage2Words?.length || 0) > 0;
  const hasStrokeData = current.strokeVectors && current.strokeVectors.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4 bg-[var(--card-bg)] rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-gray)]">{t("range")}:</span>
          <span className="px-3 py-1 bg-[var(--color-mint)]/10 rounded-full text-sm font-medium text-[var(--color-mint-dark)]">
            {getStrokeRangeLabel(strokeRange)}
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1.5 text-sm font-medium text-[var(--color-coral)] hover:bg-[var(--color-coral)]/5 rounded-lg transition-colors"
        >
          {showFilters ? t("cancel") : t("changeRange")}
        </button>
      </div>

      {/* Inline Filter Panel */}
      {showFilters && (
        <div className="mb-4 bg-[var(--card-bg)] rounded-2xl p-4 shadow-[0_4px_16px_var(--card-shadow)]">
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray)] mb-2">{t("strokeCountLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {STROKE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setStrokeRange(range)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${strokeRange === range
                      ? "bg-[var(--color-sky)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--color-gray)] hover:bg-[var(--color-sky)]/10"
                    }`}
                >
                  {getStrokeRangeLabel(range)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleFilterChange(strokeRange)}
            disabled={isLoading}
            className="mt-3 w-full py-2 bg-[var(--color-coral)] text-white rounded-xl font-medium
                     hover:bg-[var(--color-coral-dark)] disabled:opacity-50 transition-colors"
          >
            {isLoading ? t("loadingData") : t("applyAndRestart")}
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-[var(--color-gray)]">
          {currentIndex + 1} / {characters.length}
        </span>
        <div className="mt-3 h-4 bg-[var(--color-peach)] rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[var(--color-sky)] to-[var(--color-sky-dark)] transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative flex items-center justify-center">
        {/* Previous Button */}
        <div className="absolute left-0 md:-left-20 z-10">
          <NavArrow
            direction="left"
            onClick={goToPrevious}
            disabled={isFirst}
          />
        </div>

        {/* Card */}
        <div className="bg-[var(--card-bg)] rounded-[32px] shadow-[0_12px_40px_var(--card-shadow)] p-6 md:p-10 mx-16 md:mx-0 w-full max-w-xl">
          {/* Character rendered using strokes - clickable */}
          <div className="flex justify-center mb-4">
            <div 
              onClick={() => hasStrokeData && setShowStrokeAnimation(!showStrokeAnimation)}
              className={`${hasStrokeData ? 'cursor-pointer' : ''}`}
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
          </div>


          {/* Jyutping & Pinyin */}
          <div className="text-center mb-4">
            <span className="jyutping text-[var(--color-sky)]">
              {current.jyutping}
            </span>
            {current.pinyin && (
              <span className="text-sm text-[var(--color-gray-light)] ml-2">
                ({current.pinyin})
              </span>
            )}
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => playPronunciation()}
              className="px-6 py-3 bg-gradient-to-br from-[var(--color-sky)] to-[var(--color-sky-dark)] 
                       text-white text-lg font-semibold rounded-full
                       shadow-[0_4px_16px_rgba(126,200,227,0.4)]
                       hover:scale-105 active:scale-95
                       transition-all flex items-center gap-2
                       min-h-[48px]"
            >
              <span className="text-xl">🔊</span>
              {t("playPronunciation")}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[var(--color-peach)] my-4" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[var(--color-coral)]/10 rounded-2xl p-4">
              <div className="text-sm text-[var(--color-coral)] mb-1 font-medium">{t("radical")}</div>
              <div className="text-2xl hanzi-display text-[var(--color-charcoal)]">
                {current.radical || "—"}
              </div>
            </div>
            <div className="bg-[var(--color-mint)]/10 rounded-2xl p-4">
              <div className="text-sm text-[var(--color-mint-dark)] mb-1 font-medium">{t("strokeCount")}</div>
              <div className="text-2xl text-[var(--color-charcoal)] font-bold">
                {current.strokeCount} {t("strokesUnit")}
              </div>
            </div>
          </div>

          {/* Toggle Details Button */}
          {hasWords && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 w-full py-2.5 rounded-xl border-2 border-[var(--color-peach)] 
                       text-[var(--color-gray)] font-medium
                       hover:bg-[var(--color-coral)]/5 hover:border-[var(--color-coral-light)] transition-all"
            >
              {showDetails ? `${t("hideDetails")} ↑` : `${t("showDetails")} ↓`}
            </button>
          )}

          {/* Related Words (expandable) - Show ALL */}
          {showDetails && hasWords && (
            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
              {current.stage1Words && current.stage1Words.length > 0 && (
                <CompactWordList
                  words={current.stage1Words}
                  title={t("stage1")}
                  icon="📗"
                />
              )}
              {current.stage2Words && current.stage2Words.length > 0 && (
                <CompactWordList
                  words={current.stage2Words}
                  title={t("stage2")}
                  icon="📘"
                />
              )}
              {current.fourCharacterPhrases && current.fourCharacterPhrases.length > 0 && (
                <CompactWordList
                  words={current.fourCharacterPhrases}
                  title={t("fourCharPhrases")}
                  icon="✨"
                />
              )}
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="absolute right-0 md:-right-20 z-10">
          <NavArrow
            direction="right"
            onClick={goToNext}
            disabled={isLast}
          />
        </div>
      </div>

      {/* Back to Settings */}
      <div className="text-center mt-8">
        <button
          onClick={() => setIsStarted(false)}
          className="text-lg text-[var(--color-sky)] hover:text-[var(--color-sky-dark)] font-medium
                   underline underline-offset-4 transition-colors"
        >
          {t("backToSettings")}
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-4 text-base text-[var(--color-gray)]">
        {t("keyboardHints")}
      </div>
    </div>
  );
}

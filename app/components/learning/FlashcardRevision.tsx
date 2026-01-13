"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullCharacterData, IndexSummary } from "@/types/fullCharacter";
import { CompactWordList } from "./RelatedWords";
import NavArrow from "@/app/components/ui/NavArrow";
import Mascot from "@/app/components/ui/Mascot";
import Button from "@/app/components/ui/Button";
import StrokeAnimation from "./StrokeAnimation";

const STROKE_RANGES = [
  { label: "全部", min: 1, max: 32 },
  { label: "1-5 劃", min: 1, max: 5 },
  { label: "6-10 劃", min: 6, max: 10 },
  { label: "11-15 劃", min: 11, max: 15 },
  { label: "16+ 劃", min: 16, max: 32 },
];

export default function FlashcardRevision() {
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
        throw new Error(data.error || "無法載入字卡資料");
      }

      if (!data.characters || data.characters.length === 0) {
        setError("沒有符合條件的漢字，請嘗試其他篩選條件");
        setCharacters([]);
      } else {
        setCharacters(data.characters);
        setCurrentIndex(0);
        setShowDetails(false);
        setShowStrokeAnimation(false);
        setIsStarted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setIsLoading(false);
    }
  }, [strokeRange]);

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
    if (!summary) return "載入中...";
    
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
    
    return `約 ${count} 字`;
  };

  // Render filter selection panel
  if (!isStarted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 md:p-10">
          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <Mascot type="rabbit" size="lg" message="選擇學習範圍！" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#2D3436] mb-8 text-center">
            字卡設定
          </h2>

          {/* Stroke Count Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-[#2D3436] mb-3">
              筆劃數目
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STROKE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => setStrokeRange(range)}
                  className={`px-4 py-4 rounded-2xl border-3 transition-all text-xl font-medium
                    min-h-[56px]
                    ${strokeRange === range
                      ? "border-[#7EC8E3] bg-[#F0F9FF] text-[#5BB8D8]"
                      : "border-[#FFE5B4] bg-white text-[#636E72] hover:border-[#FF8E8E] hover:bg-[#FFF5F5]"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Count */}
          <div className="mb-6 text-center text-[#7A8288]">
            {getEstimatedCount()}
          </div>

          {/* Info */}
          <div className="mb-6 p-4 bg-[#F0F9FF] rounded-xl text-sm text-[#5BB8D8]">
            📚 使用《香港小學學習字詞表》收錄的漢字
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-5 bg-[#FFF5F5] border-2 border-[#FF6B6B] text-[#E55555] rounded-2xl text-center text-lg">
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
            {isLoading ? "載入中..." : "開始温習 🎯"}
          </Button>

          <p className="mt-6 text-base text-[#7A8288] text-center">
            ← → 切換字卡 | 空白鍵播放讀音 | Enter 顯示詳情
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
      <div className="flex items-center justify-between mb-4 bg-white rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#7A8288]">範圍：</span>
          <span className="px-3 py-1 bg-[#F0FFF4] rounded-full text-sm font-medium text-[#7BC88E]">
            {strokeRange.label}
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1.5 text-sm font-medium text-[#FF6B6B] hover:bg-[#FFF5F5] rounded-lg transition-colors"
        >
          {showFilters ? "取消" : "更改範圍"}
        </button>
      </div>

      {/* Inline Filter Panel */}
      {showFilters && (
        <div className="mb-4 bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div>
            <label className="block text-sm font-medium text-[#636E72] mb-2">筆劃數目</label>
            <div className="grid grid-cols-3 gap-2">
              {STROKE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setStrokeRange(range)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${strokeRange === range
                      ? "bg-[#7EC8E3] text-white"
                      : "bg-[#F5F5F5] text-[#636E72] hover:bg-[#E0F0FF]"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleFilterChange(strokeRange)}
            disabled={isLoading}
            className="mt-3 w-full py-2 bg-[#FF6B6B] text-white rounded-xl font-medium
                     hover:bg-[#E55555] disabled:opacity-50 transition-colors"
          >
            {isLoading ? "載入中..." : "套用並重新開始"}
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-[#636E72]">
          {currentIndex + 1} / {characters.length}
        </span>
        <div className="mt-3 h-4 bg-[#FFE5B4] rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#7EC8E3] to-[#5BB8D8] transition-all duration-300 rounded-full"
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
        <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-6 md:p-10 mx-16 md:mx-0 w-full max-w-xl">
          {/* Character rendered using strokes - clickable */}
          <div className="flex justify-center mb-4">
            <div 
              onClick={() => hasStrokeData && setShowStrokeAnimation(!showStrokeAnimation)}
              className={`${hasStrokeData ? 'cursor-pointer' : ''}`}
              title={hasStrokeData ? "點擊顯示筆順動畫" : ""}
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
            <span className="jyutping text-[#7EC8E3]">
              {current.jyutping}
            </span>
            {current.pinyin && (
              <span className="text-sm text-[#B2BEC3] ml-2">
                ({current.pinyin})
              </span>
            )}
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => playPronunciation()}
              className="px-6 py-3 bg-gradient-to-br from-[#7EC8E3] to-[#5BB8D8] 
                       text-white text-lg font-semibold rounded-full
                       shadow-[0_4px_16px_rgba(126,200,227,0.4)]
                       hover:scale-105 active:scale-95
                       transition-all flex items-center gap-2
                       min-h-[48px]"
            >
              <span className="text-xl">🔊</span>
              播放讀音
            </button>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[#FFE5B4] my-4" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#FFF5F5] rounded-2xl p-4">
              <div className="text-sm text-[#FF6B6B] mb-1 font-medium">部首</div>
              <div className="text-2xl hanzi-display text-[#2D3436]">
                {current.radical || "—"}
              </div>
            </div>
            <div className="bg-[#F0FFF4] rounded-2xl p-4">
              <div className="text-sm text-[#7BC88E] mb-1 font-medium">筆劃</div>
              <div className="text-2xl text-[#2D3436] font-bold">
                {current.strokeCount} 劃
              </div>
            </div>
          </div>

          {/* Toggle Details Button */}
          {hasWords && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 w-full py-2.5 rounded-xl border-2 border-[#FFE5B4] 
                       text-[#636E72] font-medium
                       hover:bg-[#FFF5F5] hover:border-[#FF8E8E] transition-all"
            >
              {showDetails ? "隱藏詞語 ↑" : "顯示詞語 ↓"}
            </button>
          )}

          {/* Related Words (expandable) - Show ALL */}
          {showDetails && hasWords && (
            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
              {current.stage1Words && current.stage1Words.length > 0 && (
                <CompactWordList
                  words={current.stage1Words}
                  title="第一學習階段"
                  icon="📗"
                />
              )}
              {current.stage2Words && current.stage2Words.length > 0 && (
                <CompactWordList
                  words={current.stage2Words}
                  title="第二學習階段"
                  icon="📘"
                />
              )}
              {current.fourCharacterPhrases && current.fourCharacterPhrases.length > 0 && (
                <CompactWordList
                  words={current.fourCharacterPhrases}
                  title="四字詞語"
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
          className="text-lg text-[#7EC8E3] hover:text-[#5BB8D8] font-medium
                   underline underline-offset-4 transition-colors"
        >
          ← 返回設定
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-4 text-base text-[#7A8288]">
        ← → 切換字卡 | 空白鍵播放讀音 | Enter 顯示詳情
      </div>
    </div>
  );
}

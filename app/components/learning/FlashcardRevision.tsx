"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition, Example, LearningStage } from "@/types/character";

interface CharacterData {
  character: Character;
  decomposition?: Decomposition;
  examples: Example[];
}

interface FlashcardRevisionProps {
  initialGrade?: LearningStage | "ALL";
}

const STROKE_RANGES = [
  { label: "全部", min: 1, max: 30 },
  { label: "1-5 劃", min: 1, max: 5 },
  { label: "6-10 劃", min: 6, max: 10 },
  { label: "11-15 劃", min: 11, max: 15 },
  { label: "16+ 劃", min: 16, max: 30 },
];

export default function FlashcardRevision({ initialGrade = "ALL" }: FlashcardRevisionProps) {
  // Filter state
  const [grade, setGrade] = useState<LearningStage | "ALL">(initialGrade);
  const [strokeRange, setStrokeRange] = useState(STROKE_RANGES[0]);
  
  // Session state
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved filters from session storage
  useEffect(() => {
    const savedGrade = sessionStorage.getItem("flashcard-grade");
    const savedStrokeIndex = sessionStorage.getItem("flashcard-stroke-index");
    
    if (savedGrade) {
      setGrade(savedGrade as LearningStage | "ALL");
    }
    if (savedStrokeIndex) {
      const index = parseInt(savedStrokeIndex, 10);
      if (!isNaN(index) && index >= 0 && index < STROKE_RANGES.length) {
        setStrokeRange(STROKE_RANGES[index]);
      }
    }
  }, []);

  // Save filters to session storage
  useEffect(() => {
    sessionStorage.setItem("flashcard-grade", grade);
    sessionStorage.setItem("flashcard-stroke-index", STROKE_RANGES.indexOf(strokeRange).toString());
  }, [grade, strokeRange]);

  // Fetch characters with current filters
  const fetchCharacters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (grade !== "ALL") {
        params.set("grade", grade);
      }
      params.set("minStrokes", strokeRange.min.toString());
      params.set("maxStrokes", strokeRange.max.toString());
      params.set("shuffle", "true");

      const response = await fetch(`/api/characters?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "無法載入字卡資料");
      }

      if (data.characters.length === 0) {
        setError("沒有符合條件的漢字，請嘗試其他篩選條件");
        setCharacters([]);
      } else {
        setCharacters(data.characters);
        setCurrentIndex(0);
        setIsStarted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, characters.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Play pronunciation using Web Speech API
  const playPronunciation = useCallback(() => {
    const current = characters[currentIndex];
    if (!current) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.character.character);
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStarted, goToNext, goToPrevious, playPronunciation]);

  // Render filter selection panel
  if (!isStarted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            字卡設定
          </h2>

          {/* Learning Stage Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              學習階段
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as LearningStage | "ALL")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-lg"
            >
              <option value="ALL">全部</option>
              <option value="KS1">第一學習階段（小一至小三）</option>
              <option value="KS2">第二學習階段（小四至小六）</option>
            </select>
          </div>

          {/* Stroke Count Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              筆劃數目
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STROKE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => setStrokeRange(range)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-lg
                    ${strokeRange === range
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={fetchCharacters}
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                     text-white font-bold text-xl rounded-xl transition-colors
                     shadow-lg hover:shadow-xl"
          >
            {isLoading ? "載入中..." : "開始温習"}
          </button>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            按 ← → 鍵切換字卡，按空白鍵播放讀音
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="text-center mb-4">
        <span className="text-lg text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {characters.length}
        </span>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / characters.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          disabled={isFirst}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16
                    w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg
                    flex items-center justify-center text-3xl md:text-4xl
                    transition-all z-10
                    ${isFirst 
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110"
                    }`}
          aria-label="上一張"
        >
          ←
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mx-8 md:mx-0">
          {/* Character */}
          <div className="text-center mb-6">
            <span className="hanzi-display text-[120px] md:text-[160px] leading-none text-gray-900 dark:text-white">
              {current.character.character}
            </span>
          </div>

          {/* Jyutping */}
          <div className="text-center mb-6">
            <span className="text-3xl md:text-4xl text-blue-600 dark:text-blue-400 font-mono">
              {current.character.jyutping}
            </span>
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={playPronunciation}
              className="px-6 py-3 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900
                       text-blue-700 dark:text-blue-300 rounded-full transition-colors
                       flex items-center gap-2 text-lg"
            >
              <span className="text-2xl">🔊</span>
              播放讀音
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">部首</div>
              <div className="text-2xl hanzi-display text-gray-900 dark:text-white">
                {current.character.radical || "—"}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">筆劃</div>
              <div className="text-2xl text-gray-900 dark:text-white">
                {current.character.strokeCount} 劃
              </div>
            </div>
          </div>

          {/* Meanings */}
          {current.character.meanings.length > 0 && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">意思</div>
              <div className="text-lg text-gray-900 dark:text-white">
                {current.character.meanings.join("、")}
              </div>
            </div>
          )}

          {/* Example Sentence */}
          {current.examples.length > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">例句</div>
              <div className="text-lg hanzi-sentence text-gray-900 dark:text-white">
                {current.examples[0].sentence}
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={isLast}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16
                    w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg
                    flex items-center justify-center text-3xl md:text-4xl
                    transition-all z-10
                    ${isLast 
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110"
                    }`}
          aria-label="下一張"
        >
          →
        </button>
      </div>

      {/* Back to Settings */}
      <div className="text-center mt-6">
        <button
          onClick={() => setIsStarted(false)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                   underline transition-colors"
        >
          返回設定
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-4 text-sm text-gray-400 dark:text-gray-500">
        ← → 切換字卡 | 空白鍵播放讀音
      </div>
    </div>
  );
}

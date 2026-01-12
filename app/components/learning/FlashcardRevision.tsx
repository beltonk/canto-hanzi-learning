"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition, Example, LearningStage } from "@/types/character";
import Button from "@/app/components/ui/Button";
import NavArrow from "@/app/components/ui/NavArrow";
import Mascot from "@/app/components/ui/Mascot";

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
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 md:p-10">
          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <Mascot type="rabbit" size="lg" message="選擇學習範圍！" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#2D3436] mb-8 text-center">
            字卡設定
          </h2>

          {/* Learning Stage Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-[#2D3436] mb-3">
              學習階段
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as LearningStage | "ALL")}
              className="w-full px-5 py-4 rounded-2xl border-3 border-[#FFE5B4] 
                       bg-white text-[#2D3436] text-xl
                       focus:ring-4 focus:ring-[#7EC8E3]/30 focus:border-[#7EC8E3]
                       transition-all cursor-pointer"
            >
              <option value="ALL">全部</option>
              <option value="KS1">第一學習階段（小一至小三）</option>
              <option value="KS2">第二學習階段（小四至小六）</option>
            </select>
          </div>

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

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-5 bg-[#FFF5F5] border-2 border-[#FF6B6B] text-[#E55555] rounded-2xl text-center text-lg">
              {error}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={fetchCharacters}
            disabled={isLoading}
            variant="primary"
            size="xl"
            fullWidth
          >
            {isLoading ? "載入中..." : "開始温習 🎯"}
          </Button>

          <p className="mt-6 text-base text-[#7A8288] text-center">
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
  const progress = ((currentIndex + 1) / characters.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4">
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
        <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-8 md:p-12 mx-16 md:mx-0 w-full max-w-xl">
          {/* Character */}
          <div className="text-center mb-6">
            <span className="hanzi-display text-[140px] md:text-[180px] leading-none text-[#2D3436]">
              {current.character.character}
            </span>
          </div>

          {/* Jyutping */}
          <div className="text-center mb-6">
            <span className="jyutping text-[#7EC8E3]">
              {current.character.jyutping}
            </span>
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={playPronunciation}
              className="px-8 py-4 bg-gradient-to-br from-[#7EC8E3] to-[#5BB8D8] 
                       text-white text-xl font-semibold rounded-full
                       shadow-[0_4px_16px_rgba(126,200,227,0.4)]
                       hover:scale-105 active:scale-95
                       transition-all flex items-center gap-3
                       min-h-[56px]"
            >
              <span className="text-2xl">🔊</span>
              播放讀音
            </button>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[#FFE5B4] my-6" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-[#FFF5F5] rounded-2xl p-5">
              <div className="text-base text-[#FF6B6B] mb-2 font-medium">部首</div>
              <div className="text-3xl hanzi-display text-[#2D3436]">
                {current.character.radical || "—"}
              </div>
            </div>
            <div className="bg-[#F0FFF4] rounded-2xl p-5">
              <div className="text-base text-[#7BC88E] mb-2 font-medium">筆劃</div>
              <div className="text-3xl text-[#2D3436] font-bold">
                {current.character.strokeCount} 劃
              </div>
            </div>
          </div>

          {/* Meanings */}
          {current.character.meanings.length > 0 && (
            <div className="mt-5 bg-[#F0F9FF] rounded-2xl p-5">
              <div className="text-base text-[#5BB8D8] mb-2 font-medium">意思</div>
              <div className="text-xl text-[#2D3436]">
                {current.character.meanings.join("、")}
              </div>
            </div>
          )}

          {/* Example Sentence */}
          {current.examples.length > 0 && (
            <div className="mt-4 bg-[#FFFBEB] rounded-2xl p-5 border-2 border-[#FFE566]">
              <div className="text-base text-[#F5C800] mb-2 font-medium">例句</div>
              <div className="text-xl hanzi-sentence text-[#2D3436]">
                {current.examples[0].sentence}
              </div>
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
        ← → 切換字卡 | 空白鍵播放讀音
      </div>
    </div>
  );
}

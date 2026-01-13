"use client";

import { useState, useEffect, useRef } from "react";
import type { Word, Phrase } from "@/types/fullCharacter";

interface RelatedWordsProps {
  /** Stage 1 (KS1) words */
  stage1Words?: Word[];
  /** Stage 2 (KS2) words */
  stage2Words?: Word[];
  /** Four-character phrases */
  fourCharacterPhrases?: Phrase[];
  /** Classical phrases */
  classicalPhrases?: Phrase[];
  /** Multi-character idioms */
  multiCharacterIdioms?: Phrase[];
  /** Proper nouns */
  properNouns?: Phrase[];
  /** Compact mode (shows less) */
  compact?: boolean;
}

type WordCategory = 
  | "stage1" 
  | "stage2" 
  | "fourChar" 
  | "classical" 
  | "idioms" 
  | "properNouns";

const CATEGORIES: { key: WordCategory; label: string; icon: string }[] = [
  { key: "stage1", label: "第一學習階段", icon: "📗" },
  { key: "stage2", label: "第二學習階段", icon: "📘" },
  { key: "fourChar", label: "四字詞語", icon: "✨" },
  { key: "idioms", label: "成語", icon: "📜" },
  { key: "classical", label: "文言詞語", icon: "📿" },
  { key: "properNouns", label: "專有名詞", icon: "🏷️" },
];

/**
 * RelatedWords Component
 * 
 * Displays related vocabulary words and phrases organized by category.
 * Supports pronunciation playback and compact/expanded views.
 */
export default function RelatedWords({
  stage1Words = [],
  stage2Words = [],
  fourCharacterPhrases = [],
  classicalPhrases = [],
  multiCharacterIdioms = [],
  properNouns = [],
  compact = false,
}: RelatedWordsProps) {
  const [activeCategory, setActiveCategory] = useState<WordCategory>("stage1");

  // Get words for active category
  const getActiveWords = (): (Word | Phrase)[] => {
    switch (activeCategory) {
      case "stage1":
        return stage1Words;
      case "stage2":
        return stage2Words;
      case "fourChar":
        return fourCharacterPhrases;
      case "classical":
        return classicalPhrases;
      case "idioms":
        return multiCharacterIdioms;
      case "properNouns":
        return properNouns;
      default:
        return [];
    }
  };

  // Get count for each category
  const getCategoryCount = (key: WordCategory): number => {
    switch (key) {
      case "stage1":
        return stage1Words.length;
      case "stage2":
        return stage2Words.length;
      case "fourChar":
        return fourCharacterPhrases.length;
      case "classical":
        return classicalPhrases.length;
      case "idioms":
        return multiCharacterIdioms.length;
      case "properNouns":
        return properNouns.length;
      default:
        return 0;
    }
  };

  // Filter categories that have words
  const availableCategories = CATEGORIES.filter(cat => getCategoryCount(cat.key) > 0);

  // Play word pronunciation
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "zh-HK";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // If no words at all, return null
  const totalWords = availableCategories.reduce((sum, cat) => sum + getCategoryCount(cat.key), 0);
  if (totalWords === 0) {
    return null;
  }

  // Set initial active category to one with words
  useEffect(() => {
    if (getCategoryCount(activeCategory) === 0 && availableCategories.length > 0) {
      setActiveCategory(availableCategories[0].key);
    }
  }, [activeCategory, availableCategories]);

  const activeWords = getActiveWords();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Check if content overflows and show scroll hint
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      setShowScrollHint(hasOverflow);
      
      // Hide hint when user scrolls to bottom
      const handleScroll = () => {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        setShowScrollHint(!isNearBottom && container.scrollHeight > container.clientHeight);
      };
      
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [activeWords, activeCategory]);

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#FFF5F5] to-[#FFF9F5] border-b border-[#FFE5E5]">
        <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
          <span className="text-lg">📚</span> 相關詞語
          <span className="text-sm text-[#7A8288] font-normal">
            （共 {totalWords} 個）
          </span>
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="px-3 py-2 border-b border-[#F0F0F0] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {availableCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${activeCategory === cat.key
                  ? "bg-[#FF6B6B] text-white shadow-md"
                  : "bg-[#F5F5F5] text-[#636E72] hover:bg-[#FFE5E5] hover:text-[#FF6B6B]"
                }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
              <span className="ml-1 opacity-75">({getCategoryCount(cat.key)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Words Grid - Show ALL words */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="p-3 max-h-[400px] overflow-y-auto"
        >
          {activeWords.length === 0 ? (
            <p className="text-center text-[#7A8288] py-4">
              此分類暫無詞語
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeWords.map((item, idx) => {
                const word = "word" in item ? item.word : (item as Word).word;
                const jyutping = "jyutping" in item ? (item as Word).jyutping : undefined;
                
                return (
                  <button
                    key={`${word}-${idx}`}
                    onClick={() => speakWord(word)}
                    className="group p-3 rounded-xl border-2 border-[#FFE5B4] bg-[#FFFBF5]
                             hover:border-[#FF8E8E] hover:bg-[#FFF5F5] transition-all
                             text-left"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="hanzi-display text-lg text-[#2D3436] leading-tight">
                        {word}
                      </span>
                      <span className="text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                        🔊
                      </span>
                    </div>
                    {jyutping && (
                      <span className="text-xs text-[#7EC8E3] font-mono mt-1 block truncate">
                        {jyutping}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Scroll hint */}
        {showScrollHint && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex items-end justify-center pb-1">
            <span className="text-xs text-[#7A8288] flex items-center gap-1 animate-bounce">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              向下捲動查看更多
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact word list for flashcards - shows ALL words
 */
export function CompactWordList({
  words,
  title,
  icon,
}: {
  words: (Word | Phrase)[];
  title: string;
  icon: string;
}) {
  if (words.length === 0) return null;

  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "zh-HK";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-[#FFFBF5] rounded-xl p-3 border border-[#FFE5B4]">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm font-medium text-[#636E72]">{title}</span>
        <span className="text-xs text-[#B2BEC3]">({words.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((item, idx) => {
          const word = "word" in item ? item.word : (item as Word).word;
          return (
            <button
              key={`${word}-${idx}`}
              onClick={() => speakWord(word)}
              className="px-2 py-1 bg-white rounded-lg border border-[#FFE5B4] 
                       text-sm hanzi-display text-[#2D3436]
                       hover:border-[#FF8E8E] hover:bg-[#FFF5F5] transition-colors"
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

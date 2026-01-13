"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Word, Phrase } from "@/types/fullCharacter";
import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

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

const CATEGORY_KEYS: { key: WordCategory; labelKey: TranslationKey; icon: string }[] = [
  { key: "stage1", labelKey: "stage1", icon: "📗" },
  { key: "stage2", labelKey: "stage2", icon: "📘" },
  { key: "fourChar", labelKey: "fourCharPhrases", icon: "✨" },
  { key: "idioms", labelKey: "idioms", icon: "📜" },
  { key: "classical", labelKey: "classicalPhrases", icon: "📿" },
  { key: "properNouns", labelKey: "properNouns", icon: "🏷️" },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compact = false,
}: RelatedWordsProps) {
  const [activeCategory, setActiveCategory] = useState<WordCategory>("stage1");
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Get count for each category
  const getCategoryCount = useCallback((key: WordCategory): number => {
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
  }, [stage1Words, stage2Words, fourCharacterPhrases, classicalPhrases, multiCharacterIdioms, properNouns]);

  // Filter categories that have words
  const availableCategories = CATEGORY_KEYS.filter(cat => getCategoryCount(cat.key) > 0);

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

  // Set initial active category to one with words
  useEffect(() => {
    if (getCategoryCount(activeCategory) === 0 && availableCategories.length > 0) {
      // Schedule state update to avoid synchronous setState in effect
      setTimeout(() => {
        setActiveCategory(availableCategories[0].key);
      }, 0);
    }
  }, [activeCategory, availableCategories, getCategoryCount]);

  const activeWords = getActiveWords();

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

  // If no words at all, return null
  const totalWords = availableCategories.reduce((sum, cat) => sum + getCategoryCount(cat.key), 0);
  if (totalWords === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-coral)]/5 to-[var(--color-peach)]/20 border-b border-[var(--color-coral)]/10">
        <h3 className="text-base font-bold text-[var(--color-charcoal)] flex items-center gap-2">
          <span className="text-lg">📚</span> {t("relatedWords")}
          <span className="text-sm text-[var(--color-gray)] font-normal">
            ({totalWords})
          </span>
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="px-3 py-2 border-b border-[var(--card-border)] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {availableCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${activeCategory === cat.key
                  ? "bg-[var(--color-coral)] text-white shadow-md"
                  : "bg-[var(--input-bg)] text-[var(--color-gray)] hover:bg-[var(--color-coral)]/10 hover:text-[var(--color-coral)]"
                }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {t(cat.labelKey)}
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
            <p className="text-center text-[var(--color-gray)] py-4">
              {t("noPhrases")}
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
                    className="group p-3 rounded-xl border-2 border-[var(--color-peach)] bg-[var(--color-peach)]/10
                             hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/5 transition-all
                             text-left"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="hanzi-display text-lg text-[var(--color-charcoal)] leading-tight">
                        {word}
                      </span>
                      <span className="text-[var(--color-coral)] opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                        🔊
                      </span>
                    </div>
                    {jyutping && (
                      <span className="text-xs text-[var(--color-sky)] font-mono mt-1 block truncate">
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
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/90 to-transparent pointer-events-none flex items-end justify-center pb-1">
            <span className="text-xs text-[var(--color-gray)] flex items-center gap-1 animate-bounce">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {t("scrollDown")}
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
    <div className="bg-[var(--color-peach)]/10 rounded-xl p-3 border border-[var(--color-peach)]">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm font-medium text-[var(--color-gray)]">{title}</span>
        <span className="text-xs text-[var(--color-gray-light)]">({words.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((item, idx) => {
          const word = "word" in item ? item.word : (item as Word).word;
          return (
            <button
              key={`${word}-${idx}`}
              onClick={() => speakWord(word)}
              className="px-2 py-1 bg-[var(--card-bg)] rounded-lg border border-[var(--color-peach)] 
                       text-sm hanzi-display text-[var(--color-charcoal)]
                       hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/5 transition-colors"
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

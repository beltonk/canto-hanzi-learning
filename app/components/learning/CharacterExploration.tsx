"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { FullCharacterData, IndexEntry } from "@/types/fullCharacter";
import { useLanguage } from "@/lib/i18n/context";
import StrokeAnimation from "./StrokeAnimation";
import RelatedWords from "./RelatedWords";

interface CharacterExplorationProps {
  /** Initial character to display */
  character?: string;
  /** Callback when character changes */
  onCharacterChange?: (char: string) => void;
}

/**
 * CharacterExploration Component
 * 
 * Full-featured character exploration with:
 * - Character display using stroke rendering (clickable for animation)
 * - Character info (radical, stroke count, jyutping, pinyin)
 * - Related words and phrases
 * - Character navigation with search/filter
 */
export default function CharacterExploration({ 
  character, 
  onCharacterChange 
}: CharacterExplorationProps) {
  // Data state
  const [data, setData] = useState<FullCharacterData | null>(null);
  const [characterList, setCharacterList] = useState<IndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showCharList, setShowCharList] = useState(false);
  const [showStrokeAnimation, setShowStrokeAnimation] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter state
  const [filterRadical, setFilterRadical] = useState("");
  const [filterStrokeCount, setFilterStrokeCount] = useState<number | "">("");
  const [filterJyutping, setFilterJyutping] = useState("");

  // Translations
  const { t } = useLanguage();

  // Load character list (index entries for navigation)
  const loadCharacterList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("indexOnly", "true");
      params.set("inLexicalListsHK", "true"); // Only show HK lexical list characters
      
      const response = await fetch(`/api/characters?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t("loadFailed"));
      }
      
      const result = await response.json();
      setCharacterList(result.entries || []);
      
      // If no character specified, use first one
      if (!character && result.entries.length > 0) {
        onCharacterChange?.(result.entries[0].character);
      }
    } catch (err) {
      console.error("Error loading character list:", err);
    }
  }, [character, onCharacterChange]);

  // Load full character data
  const loadCharacterData = useCallback(async (char: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/characters?char=${encodeURIComponent(char)}`);
      if (!response.ok) {
        throw new Error("Character not found");
      }

      const result = await response.json();
      setData(result.character);
      setShowStrokeAnimation(false); // Reset animation state when character changes
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load character list on mount/stage change
  useEffect(() => {
    loadCharacterList();
  }, [loadCharacterList]);

  // Load character data when character changes
  useEffect(() => {
    if (character) {
      loadCharacterData(character);
    }
  }, [character, loadCharacterData]);

  // Speak character using TTS (Cantonese)
  const speakCantonese = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-HK";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak character using TTS (Mandarin)
  const speakMandarin = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get unique radicals for filter dropdown
  const uniqueRadicals = useMemo(() => {
    const radicals = new Set<string>();
    characterList.forEach(entry => {
      if (entry.radical) radicals.add(entry.radical);
    });
    return Array.from(radicals).sort();
  }, [characterList]);

  // Get unique stroke counts for filter dropdown
  const uniqueStrokeCounts = useMemo(() => {
    const counts = new Set<number>();
    characterList.forEach(entry => {
      if (entry.strokeCount) counts.add(entry.strokeCount);
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [characterList]);

  // Filter character list based on search criteria
  const filteredCharacterList = useMemo(() => {
    return characterList.filter(entry => {
      // Filter by radical
      if (filterRadical && entry.radical !== filterRadical) {
        return false;
      }
      // Filter by stroke count
      if (filterStrokeCount !== "" && entry.strokeCount !== filterStrokeCount) {
        return false;
      }
      // Filter by jyutping (partial match)
      if (filterJyutping && !entry.jyutping?.toLowerCase().includes(filterJyutping.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [characterList, filterRadical, filterStrokeCount, filterJyutping]);

  // Check if any filters are active
  const hasActiveFilters = filterRadical || filterStrokeCount !== "" || filterJyutping;

  // Clear all filters
  const clearFilters = () => {
    setFilterRadical("");
    setFilterStrokeCount("");
    setFilterJyutping("");
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-float">🐼</div>
        <div className="text-xl text-[#636E72]">{t("loading")}</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">😢</div>
        <div className="text-xl text-[#E55555]">{t("error")}: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate word counts
  const totalWords = 
    (data.stage1Words?.length || 0) + 
    (data.stage2Words?.length || 0) +
    (data.fourCharacterPhrases?.length || 0) +
    (data.multiCharacterIdioms?.length || 0);

  const hasStrokeData = data.strokeVectors && data.strokeVectors.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Character Navigation */}
      {characterList.length > 1 && (
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] overflow-hidden">
          <div className="px-4 py-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--color-gray)]">
                  {t("selectCharacter")}
                </span>
                <span className="text-xs text-[var(--color-gray-light)]">
                  {hasActiveFilters ? `${filteredCharacterList.length} / ${characterList.length}` : `${t("total")} ${characterList.length}`} {t("characters")}
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                    showFilters 
                      ? "text-[var(--color-coral)] hover:bg-[var(--color-coral)]/10" 
                      : "text-[var(--color-gray-light)] hover:text-[var(--color-coral)]"
                  }`}
                  title={showFilters ? t("hideFilter") : t("filter")}
                >
                  {showFilters ? `▲ ${t("hideFilter")}` : `▼ ${t("filter")}`}
                </button>
              </div>
              {characterList.length > 20 && (
                <button
                  onClick={() => setShowCharList(!showCharList)}
                  className="text-xs text-[var(--color-coral)] hover:text-[var(--color-coral-dark)] font-medium flex items-center gap-1"
                >
                  {showCharList ? t("collapseList") : t("expandList")}
                  <span className={`transition-transform ${showCharList ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
              )}
            </div>

            {/* Filter Panel - Compact inline layout */}
            {showFilters && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                {/* Radical filter */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-[var(--color-gray)] whitespace-nowrap">{t("radical")}</label>
                  <select
                    value={filterRadical}
                    onChange={(e) => setFilterRadical(e.target.value)}
                    className="px-2 py-1 text-sm border border-[var(--input-border)] rounded-lg 
                             bg-[var(--input-bg)] text-[var(--color-charcoal)] focus:border-[var(--color-coral)] focus:outline-none hanzi-display"
                  >
                    <option value="">{t("all")}</option>
                    {uniqueRadicals.map(radical => (
                      <option key={radical} value={radical}>{radical}</option>
                    ))}
                  </select>
                </div>
                
                {/* Stroke count filter */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-[var(--color-gray)] whitespace-nowrap">{t("strokeCount")}</label>
                  <select
                    value={filterStrokeCount}
                    onChange={(e) => setFilterStrokeCount(e.target.value ? Number(e.target.value) : "")}
                    className="px-2 py-1 text-sm border border-[var(--input-border)] rounded-lg 
                             bg-[var(--input-bg)] text-[var(--color-charcoal)] focus:border-[var(--color-coral)] focus:outline-none"
                  >
                    <option value="">{t("all")}</option>
                    {uniqueStrokeCounts.map(count => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>
                
                {/* Jyutping filter */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-[var(--color-gray)] whitespace-nowrap">{t("jyutping")}</label>
                  <input
                    type="text"
                    value={filterJyutping}
                    onChange={(e) => setFilterJyutping(e.target.value)}
                    placeholder="jat1"
                    className="w-20 px-2 py-1 text-sm border border-[var(--input-border)] rounded-lg 
                             bg-[var(--input-bg)] text-[var(--color-charcoal)] focus:border-[var(--color-coral)] focus:outline-none jyutping"
                  />
                </div>
                
                {/* Clear filters button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[var(--color-coral)] hover:text-[var(--color-coral-dark)] font-medium ml-1"
                  >
                    ✕ {t("clear")}
                  </button>
                )}
              </div>
            )}

            {/* Character Grid - Scrollable */}
            <div 
              className={`flex gap-2 flex-wrap overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-peach)] scrollbar-track-transparent ${
                showCharList ? "max-h-[300px]" : "max-h-[120px]"
              }`}
            >
              {filteredCharacterList.length > 0 ? (
                filteredCharacterList.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onCharacterChange?.(entry.character)}
                    className={`text-2xl px-3 py-2 rounded-xl border-2 transition-all hanzi-display ${
                      entry.character === character
                        ? "bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-md"
                        : "bg-[var(--card-bg)] border-[var(--color-peach)] text-[var(--color-charcoal)] hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/10"
                    }`}
                  >
                    {entry.character}
                  </button>
                ))
              ) : (
                <div className="w-full text-center py-4 text-[var(--color-gray-light)]">
                  {t("noResults")}
                </div>
              )}
            </div>
            
            {/* Scroll hint */}
            {filteredCharacterList.length > 15 && !showCharList && (
              <div className="text-center text-xs text-[var(--color-gray-light)] mt-1">
                ↕ {t("scrollHint")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Character Display */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 md:p-6 shadow-[0_4px_16px_var(--card-shadow)]">
        <div className="flex flex-col items-center">
          {/* Character rendered using strokes - clickable */}
          <div 
            onClick={() => hasStrokeData && setShowStrokeAnimation(!showStrokeAnimation)}
            className={`${hasStrokeData ? 'cursor-pointer' : ''}`}
            title={hasStrokeData ? t("clickForAnimation") : ""}
          >
            <StrokeAnimation
              strokeVectors={data.strokeVectors}
              character={data.character}
              size={220}
              showAnimation={showStrokeAnimation}
              onAnimationEnd={() => setShowStrokeAnimation(false)}
            />
          </div>


          {/* Character Info */}
          <div className="mt-4 text-center">
            <div className="jyutping text-[var(--color-sky)] text-2xl">{data.jyutping}</div>
            {data.pinyin && (
              <button
                onClick={() => speakMandarin(data.character)}
                className="text-sm text-[var(--color-gray-light)] mt-1 hover:text-[var(--color-gray)] transition-colors
                         inline-flex items-center gap-1 group"
                title={t("mandarinPronunciation")}
              >
                <span className="text-xs opacity-60 group-hover:opacity-100">🔊</span>
                {t("mandarinPronunciation")}: {data.pinyin}
              </button>
            )}
          </div>

          {/* Character Details Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="text-base text-[var(--color-gray)]">
              {data.strokeCount} {t("strokes")} • {t("radical")}: 
              <span className="hanzi-display text-xl ml-1">{data.radical}</span>
            </div>
            <button
              onClick={() => speakCantonese(data.character)}
              className="px-6 py-2 bg-gradient-to-br from-[var(--color-coral)] to-[var(--color-coral-dark)] text-white 
                       rounded-full text-base font-semibold
                       shadow-[0_4px_12px_rgba(255,107,107,0.3)]
                       hover:scale-105 active:scale-95 transition-all
                       flex items-center gap-2"
            >
              <span className="text-lg">🔊</span> {t("listenPronunciation")}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Word Preview */}
      {totalWords > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="text-base font-bold mb-3 text-[#2D3436] flex items-center gap-2">
            <span className="text-lg">📝</span> {t("commonWords")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              ...(data.stage1Words?.slice(0, 6) || []),
              ...(data.stage2Words?.slice(0, 4) || []),
            ].map((word, idx) => (
              <button
                key={`${word.word}-${idx}`}
                onClick={() => speakCantonese(word.word)}
                className="px-3 py-2 bg-[#FFFBF5] border-2 border-[#FFE5B4] rounded-xl
                         text-lg hanzi-display text-[#2D3436]
                         hover:border-[#FF8E8E] hover:bg-[#FFF5F5] transition-colors"
              >
                {word.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Words Full Section */}
      <RelatedWords
        stage1Words={data.stage1Words}
        stage2Words={data.stage2Words}
        fourCharacterPhrases={data.fourCharacterPhrases}
        classicalPhrases={data.classicalPhrases}
        multiCharacterIdioms={data.multiCharacterIdioms}
        properNouns={data.properNouns}
      />
    </div>
  );
}

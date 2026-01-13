"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullCharacterData, IndexEntry } from "@/types/fullCharacter";
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
 * - Character navigation
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

  // Load character list (index entries for navigation)
  const loadCharacterList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("indexOnly", "true");
      params.set("inLexicalListsHK", "true"); // Only show HK lexical list characters
      
      const response = await fetch(`/api/characters?${params.toString()}`);
      if (!response.ok) {
        throw new Error("載入字表失敗");
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
        throw new Error(`找不到「${char}」這個字`);
      }

      const result = await response.json();
      setData(result.character);
      setShowStrokeAnimation(false); // Reset animation state when character changes
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入資料失敗");
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

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-float">🐼</div>
        <div className="text-xl text-[#636E72]">正在載入...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">😢</div>
        <div className="text-xl text-[#E55555]">錯誤：{error}</div>
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
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-[#636E72]">
                揀選漢字
                <span className="text-sm text-[#B2BEC3] ml-2">
                  （共 {characterList.length} 字）
                </span>
              </span>
              {characterList.length > 20 && (
                <button
                  onClick={() => setShowCharList(!showCharList)}
                  className="text-sm text-[#FF6B6B] hover:text-[#E55555] font-medium flex items-center gap-1"
                >
                  {showCharList ? "收起" : "展開全部"}
                  <span className={`transition-transform ${showCharList ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
              )}
            </div>
            <div className={`flex gap-2 flex-wrap ${
              !showCharList && characterList.length > 20 ? "max-h-[100px] overflow-hidden" : ""
            }`}>
              {characterList.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onCharacterChange?.(entry.character)}
                  className={`text-2xl px-3 py-2 rounded-xl border-2 transition-all hanzi-display ${
                    entry.character === character
                      ? "bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-md"
                      : "bg-white border-[#FFE5B4] text-[#2D3436] hover:border-[#FF8E8E] hover:bg-[#FFF5F5]"
                  }`}
                >
                  {entry.character}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Character Display */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center">
          {/* Character rendered using strokes - clickable */}
          <div 
            onClick={() => hasStrokeData && setShowStrokeAnimation(!showStrokeAnimation)}
            className={`${hasStrokeData ? 'cursor-pointer' : ''}`}
            title={hasStrokeData ? "點擊顯示筆順動畫" : ""}
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
            <div className="jyutping text-[#7EC8E3] text-2xl">{data.jyutping}</div>
            {data.pinyin && (
              <button
                onClick={() => speakMandarin(data.character)}
                className="text-sm text-[#B2BEC3] mt-1 hover:text-[#7A8288] transition-colors
                         inline-flex items-center gap-1 group"
                title="聽普通話發音"
              >
                <span className="text-xs opacity-60 group-hover:opacity-100">🔊</span>
                普通話：{data.pinyin}
              </button>
            )}
          </div>

          {/* Character Details Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="text-base text-[#636E72]">
              {data.strokeCount} 筆 • 部首：
              <span className="hanzi-display text-xl">{data.radical}</span>
            </div>
            <button
              onClick={() => speakCantonese(data.character)}
              className="px-6 py-2 bg-gradient-to-br from-[#FF6B6B] to-[#E55555] text-white 
                       rounded-full text-base font-semibold
                       shadow-[0_4px_12px_rgba(255,107,107,0.3)]
                       hover:scale-105 active:scale-95 transition-all
                       flex items-center gap-2"
            >
              <span className="text-lg">🔊</span> 聽發音
            </button>
          </div>
        </div>
      </div>

      {/* Quick Word Preview */}
      {totalWords > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="text-base font-bold mb-3 text-[#2D3436] flex items-center gap-2">
            <span className="text-lg">📝</span> 常用詞語
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

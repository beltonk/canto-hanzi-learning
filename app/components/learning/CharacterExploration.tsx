"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition, Example } from "@/types/character";
import Button from "@/app/components/ui/Button";
import Mascot from "@/app/components/ui/Mascot";

interface CharacterExplorationProps {
  character: string;
  grade?: "KS1" | "KS2";
  onCharacterChange?: (char: string) => void;
}

interface CharacterData {
  character: Character;
  decomposition?: Decomposition;
  examples: Example[];
}

export default function CharacterExploration({ character, grade, onCharacterChange }: CharacterExplorationProps) {
  const [data, setData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [showCharList, setShowCharList] = useState(false);

  const loadCharacterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (grade) {
        params.set("grade", grade);
      }

      const response = await fetch(`/api/characters?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`載入失敗: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store all characters for navigation
      const chars = result.characters.map((item: { character: Character }) => item.character);
      setAllCharacters(chars);

      const charData = result.characters.find(
        (item: { character: { character: string } }) => item.character.character === character
      );

      if (!charData) {
        // If character not found, try to load the first one
        if (result.characters.length > 0) {
          setData(result.characters[0]);
          onCharacterChange?.(result.characters[0].character.character);
        } else {
          throw new Error(`找不到「${character}」這個字`);
        }
      } else {
        setData(charData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入資料失敗");
    } finally {
      setLoading(false);
    }
  }, [character, grade, onCharacterChange]);

  useEffect(() => {
    loadCharacterData();
  }, [loadCharacterData]);

  function speakCantonese(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-HK';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-float">🐼</div>
        <div className="text-xl text-[#636E72]">正在載入...</div>
      </div>
    );
  }

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

  const { character: char, decomposition, examples } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Character Navigation - Show 2 rows by default, expand for all */}
      {allCharacters.length > 1 && (
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-[#636E72]">
                揀選漢字
                <span className="text-sm text-[#B2BEC3] ml-2">（共 {allCharacters.length} 字）</span>
              </span>
              {allCharacters.length > 20 && (
                <button
                  onClick={() => setShowCharList(!showCharList)}
                  className="text-sm text-[#FF6B6B] hover:text-[#E55555] font-medium flex items-center gap-1"
                >
                  {showCharList ? "收起" : "展開全部"}
                  <span className={`transition-transform ${showCharList ? 'rotate-180' : ''}`}>▼</span>
                </button>
              )}
            </div>
            <div className={`flex gap-2 flex-wrap ${!showCharList && allCharacters.length > 20 ? 'max-h-[100px] overflow-hidden' : ''}`}>
              {allCharacters.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => onCharacterChange?.(c.character)}
                  className={`text-2xl px-3 py-2 rounded-xl border-2 transition-all hanzi-display ${
                    c.character === character
                      ? "bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-md"
                      : "bg-white border-[#FFE5B4] text-[#2D3436] hover:border-[#FF8E8E] hover:bg-[#FFF5F5]"
                  }`}
                >
                  {c.character}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Character Display - Compact */}
      <div className="text-center bg-white rounded-2xl p-4 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Character */}
          <div className="text-[100px] md:text-[120px] hanzi-display leading-none text-[#2D3436]">
            {char.character}
          </div>
          
          {/* Info */}
          <div className="text-center md:text-left space-y-2">
            <div className="jyutping text-[#7EC8E3] text-xl">{char.jyutping}</div>
            <div className="text-base text-[#636E72]">
              {char.strokeCount} 筆 • 部首：<span className="hanzi-display text-xl">{char.radical}</span>
            </div>
            <button
              onClick={() => speakCantonese(char.character)}
              className="px-6 py-2 bg-gradient-to-br from-[#FF6B6B] to-[#E55555] text-white 
                       rounded-full text-base font-semibold
                       shadow-[0_4px_12px_rgba(255,107,107,0.3)]
                       hover:scale-105 active:scale-95 transition-all
                       flex items-center gap-2 mx-auto md:mx-0"
            >
              <span className="text-lg">🔊</span> 聽發音
            </button>
          </div>
        </div>
      </div>

      {/* Meanings & Tags - Combined row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="text-base font-bold mb-2 text-[#2D3436] flex items-center gap-2">
            <span className="text-lg">📖</span> 意思
          </h3>
          <ul className="space-y-1">
            {char.meanings.map((meaning, idx) => (
              <li key={idx} className="text-base text-[#4A4A4A] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full flex-shrink-0"></span>
                {meaning}
              </li>
            ))}
          </ul>
        </div>

        {char.tags.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <h3 className="text-base font-bold mb-2 text-[#2D3436] flex items-center gap-2">
              <span className="text-lg">🏷️</span> 分類
            </h3>
            <div className="flex flex-wrap gap-2">
              {char.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-[#F0F9FF] text-[#5BB8D8] rounded-full text-sm font-medium border border-[#A5DBF0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Components/Decomposition & Examples - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {decomposition && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <h3 className="text-base font-bold mb-2 text-[#2D3436] flex items-center gap-2">
              <span className="text-lg">🧩</span> 部件拆解
            </h3>
            <div className="flex gap-2 flex-wrap items-center justify-center">
              {decomposition.components.map((component, idx) => (
                <span key={idx} className="flex items-center">
                  <span className="text-2xl px-3 py-2 bg-[#FFFBEB] rounded-xl border-2 border-[#FFE566] hanzi-display">
                    {component}
                  </span>
                  {idx < decomposition.components.length - 1 && (
                    <span className="text-xl text-[#7A8288] mx-1">+</span>
                  )}
                </span>
              ))}
              <span className="text-xl text-[#7A8288] mx-1">=</span>
              <span className="text-2xl px-3 py-2 bg-[#F0FFF4] rounded-xl border-2 border-[#B8E8C4] hanzi-display">
                {char.character}
              </span>
            </div>
            <div className="text-sm text-[#636E72] text-center mt-2">
              結構：<span className="font-semibold text-[#98D8AA]">{decomposition.structureType}</span>
            </div>
          </div>
        )}

        {examples.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <h3 className="text-base font-bold mb-2 text-[#2D3436] flex items-center gap-2">
              <span className="text-lg">✏️</span> 例句
            </h3>
            <div className="space-y-2">
              {examples.slice(0, 2).map((example, idx) => (
                <div key={idx} className="p-3 bg-[#FFF5F5] rounded-xl border border-[#FFE5E5]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-lg text-[#2D3436] hanzi-sentence truncate">{example.sentence}</div>
                      <div className="text-[#7EC8E3] text-sm font-mono truncate">{example.jyutping}</div>
                    </div>
                    <button
                      onClick={() => speakCantonese(example.sentence)}
                      className="px-3 py-2 bg-[#7EC8E3] text-white rounded-full
                               hover:bg-[#5BB8D8] transition-colors flex-shrink-0"
                    >
                      🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

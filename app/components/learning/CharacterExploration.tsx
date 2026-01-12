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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Character Navigation */}
      {allCharacters.length > 1 && (
        <div className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-lg font-semibold mb-3 text-[#636E72]">揀選漢字：</h3>
          <div className="flex gap-3 flex-wrap">
            {allCharacters.map((c, idx) => (
              <button
                key={idx}
                onClick={() => onCharacterChange?.(c.character)}
                className={`text-3xl px-4 py-3 rounded-2xl border-3 transition-all hanzi-display min-h-[56px] ${
                  c.character === character
                    ? "bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-lg"
                    : "bg-white border-[#FFE5B4] text-[#2D3436] hover:border-[#FF8E8E] hover:bg-[#FFF5F5]"
                }`}
              >
                {c.character}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Character Display */}
      <div className="text-center bg-white rounded-3xl p-10 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {/* Mascot */}
        <div className="mb-4">
          <Mascot type="panda" size="sm" message="一起學習漢字！" />
        </div>
        
        <div className="text-[180px] hanzi-display leading-none text-[#2D3436] mb-6">
          {char.character}
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="jyutping text-[#7EC8E3]">{char.jyutping}</div>
          <div className="text-lg text-[#636E72]">
            {char.strokeCount} 筆 • 部首：<span className="hanzi-display text-2xl">{char.radical}</span>
          </div>
        </div>
        
        <button
          onClick={() => speakCantonese(char.character)}
          className="px-8 py-4 bg-gradient-to-br from-[#FF6B6B] to-[#E55555] text-white 
                   rounded-full text-xl font-semibold
                   shadow-[0_4px_16px_rgba(255,107,107,0.4)]
                   hover:scale-105 active:scale-95 transition-all
                   flex items-center gap-3 mx-auto min-h-[56px]"
        >
          <span className="text-2xl">🔊</span> 聽發音
        </button>
      </div>

      {/* Meanings */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <h3 className="text-xl font-bold mb-4 text-[#2D3436] flex items-center gap-2">
          <span className="text-2xl">📖</span> 意思
        </h3>
        <ul className="space-y-2">
          {char.meanings.map((meaning, idx) => (
            <li key={idx} className="text-xl text-[#4A4A4A] flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF6B6B] rounded-full flex-shrink-0"></span>
              {meaning}
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {char.tags.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-xl font-bold mb-4 text-[#2D3436] flex items-center gap-2">
            <span className="text-2xl">🏷️</span> 分類
          </h3>
          <div className="flex flex-wrap gap-3">
            {char.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-5 py-3 bg-[#F0F9FF] text-[#5BB8D8] rounded-full text-lg font-medium border-2 border-[#A5DBF0]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Components/Decomposition */}
      {decomposition && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-xl font-bold mb-4 text-[#2D3436] flex items-center gap-2">
            <span className="text-2xl">🧩</span> 部件拆解
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap items-center justify-center">
              {decomposition.components.map((component, idx) => (
                <span key={idx} className="flex items-center">
                  <span className="text-4xl px-5 py-4 bg-[#FFFBEB] rounded-2xl border-3 border-[#FFE566] inline-block hanzi-display">
                    {component}
                  </span>
                  {idx < decomposition.components.length - 1 && (
                    <span className="text-3xl text-[#B2BEC3] mx-3">+</span>
                  )}
                </span>
              ))}
              <span className="text-3xl text-[#B2BEC3] mx-3">=</span>
              <span className="text-4xl px-5 py-4 bg-[#F0FFF4] rounded-2xl border-3 border-[#B8E8C4] hanzi-display">
                {char.character}
              </span>
            </div>
            <div className="text-lg text-[#636E72] text-center">
              結構：<span className="font-semibold text-[#98D8AA]">{decomposition.structureType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Example Sentences */}
      {examples.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-xl font-bold mb-4 text-[#2D3436] flex items-center gap-2">
            <span className="text-2xl">✏️</span> 例句
          </h3>
          <div className="space-y-4">
            {examples.map((example, idx) => (
              <div key={idx} className="p-5 bg-[#FFF5F5] rounded-2xl border-2 border-[#FFE5E5]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-2xl mb-2 text-[#2D3436] hanzi-sentence">{example.sentence}</div>
                    <div className="text-[#7EC8E3] text-base font-mono">{example.jyutping}</div>
                  </div>
                  <button
                    onClick={() => speakCantonese(example.sentence)}
                    className="px-4 py-3 bg-[#7EC8E3] text-white rounded-full
                             hover:bg-[#5BB8D8] transition-colors min-h-[48px] min-w-[48px]
                             flex items-center justify-center text-xl"
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
  );
}

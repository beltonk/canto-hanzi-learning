"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition, Example } from "@/types/character";

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
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600 dark:text-gray-300">正在載入...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">錯誤：{error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { character: char, decomposition, examples } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Character Navigation */}
      {allCharacters.length > 1 && (
        <div className="border-b pb-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">揀選漢字：</h3>
          <div className="flex gap-2 flex-wrap">
            {allCharacters.map((c, idx) => (
              <button
                key={idx}
                onClick={() => onCharacterChange?.(c.character)}
                className={`text-2xl px-3 py-2 rounded border transition-colors hanzi-display ${
                  c.character === character
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {c.character}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Character Display */}
      <div className="text-center space-y-4 bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
        <div className="text-9xl hanzi-display mb-4">{char.character}</div>
        <div className="space-y-2">
          <div className="text-2xl text-blue-600 dark:text-blue-400 font-mono">{char.jyutping}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {char.strokeCount} 筆 • 部首：{char.radical}
          </div>
        </div>
        <button
          onClick={() => speakCantonese(char.character)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
        >
          🔊 聽發音
        </button>
      </div>

      {/* Meanings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">意思</h3>
        <ul className="list-disc list-inside space-y-1">
          {char.meanings.map((meaning, idx) => (
            <li key={idx} className="text-gray-700 dark:text-gray-300 text-lg">
              {meaning}
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {char.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">分類</h3>
          <div className="flex flex-wrap gap-2">
            {char.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Components/Decomposition */}
      {decomposition && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">部件拆解</h3>
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              {decomposition.components.map((component, idx) => (
                <span key={idx}>
                  <span className="text-3xl px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 rounded border-2 border-yellow-200 dark:border-yellow-700 inline-block hanzi-display">
                    {component}
                  </span>
                  {idx < decomposition.components.length - 1 && (
                    <span className="text-2xl text-gray-400 mx-2">+</span>
                  )}
                </span>
              ))}
              <span className="text-2xl text-gray-400 mx-2">=</span>
              <span className="text-3xl px-4 py-3 bg-green-50 dark:bg-green-900/30 rounded border-2 border-green-200 dark:border-green-700 hanzi-display">
                {char.character}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              結構：<span className="font-semibold">{decomposition.structureType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Example Sentences */}
      {examples.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">例句</h3>
          <div className="space-y-4">
            {examples.map((example, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xl mb-2 text-gray-900 dark:text-white hanzi-sentence">{example.sentence}</div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-mono">{example.jyutping}</div>
                  </div>
                  <button
                    onClick={() => speakCantonese(example.sentence)}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
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

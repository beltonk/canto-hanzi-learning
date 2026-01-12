"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition } from "@/types/character";

interface DecompositionPlayProps {
  character: string;
  grade?: "KS1" | "KS2";
  onCharacterChange?: (char: string) => void;
}

interface PuzzleState {
  components: string[];
  arranged: string[];
  structureType: string;
  correct: boolean | null;
}

export default function DecompositionPlay({ character, grade, onCharacterChange }: DecompositionPlayProps) {
  const [data, setData] = useState<Decomposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const loadDecompositionData = useCallback(async () => {
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

      // Store all characters (only those with multi-component decomposition)
      const chars = result.characters
        .filter((item: { decomposition?: Decomposition }) => 
          item.decomposition && item.decomposition.components.length > 1
        )
        .map((item: { character: Character }) => item.character);
      setAllCharacters(chars);

      const charData = result.characters.find(
        (item: { character: { character: string }; decomposition?: Decomposition }) =>
          item.character.character === character
      );

      if (!charData || !charData.decomposition) {
        // Find first character with decomposition
        const firstWithDecomp = result.characters.find(
          (item: { decomposition?: Decomposition }) => 
            item.decomposition && item.decomposition.components.length > 1
        );
        if (firstWithDecomp) {
          setData(firstWithDecomp.decomposition);
          onCharacterChange?.(firstWithDecomp.character.character);
          initPuzzle(firstWithDecomp.decomposition);
        } else {
          throw new Error(`找不到適合的拆字遊戲`);
        }
      } else {
        setData(charData.decomposition);
        initPuzzle(charData.decomposition);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入資料失敗");
    } finally {
      setLoading(false);
    }
  }, [character, grade, onCharacterChange]);

  useEffect(() => {
    loadDecompositionData();
  }, [loadDecompositionData]);

  function initPuzzle(decomp: Decomposition) {
    const shuffled = [...decomp.components].sort(() => Math.random() - 0.5);
    setPuzzle({
      components: shuffled,
      arranged: [],
      structureType: decomp.structureType,
      correct: null,
    });
    setShowHint(false);
  }

  function moveComponent(component: string, fromArranged: boolean) {
    if (!puzzle) return;

    if (fromArranged) {
      const idx = puzzle.arranged.indexOf(component);
      if (idx > -1) {
        const newArranged = [...puzzle.arranged];
        newArranged.splice(idx, 1);
        setPuzzle({
          ...puzzle,
          arranged: newArranged,
          components: [...puzzle.components, component],
          correct: null,
        });
      }
    } else {
      const idx = puzzle.components.indexOf(component);
      if (idx > -1) {
        const newComponents = [...puzzle.components];
        newComponents.splice(idx, 1);
        setPuzzle({
          ...puzzle,
          components: newComponents,
          arranged: [...puzzle.arranged, component],
          correct: null,
        });
      }
    }
  }

  function checkAnswer() {
    if (!puzzle || !data) return;

    const isCorrect = JSON.stringify(puzzle.arranged) === JSON.stringify(data.components);
    setPuzzle({
      ...puzzle,
      correct: isCorrect,
    });
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  }

  function reset() {
    if (!data) return;
    initPuzzle(data);
  }

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

  if (!data || !puzzle) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Score */}
      {score.total > 0 && (
        <div className="text-center text-gray-600 dark:text-gray-400">
          得分：{score.correct} / {score.total}
        </div>
      )}

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

      <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">拆字遊戲</h2>
        <p className="text-gray-600 dark:text-gray-400">將部件排列成：</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="text-7xl hanzi-display">{character}</div>
          <button
            onClick={() => speakCantonese(character)}
            className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowHint(!showHint)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {showHint ? "隱藏提示" : "顯示提示"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          重新開始
        </button>
      </div>

      {showHint && (
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            結構類型：<strong>{puzzle.structureType}</strong>
          </p>
        </div>
      )}

      {/* Arranged Components Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">將部件放到這裏：</div>
        </div>
        <div className="p-6 min-h-[120px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg m-4">
          <div className="flex gap-3 flex-wrap justify-center items-center min-h-[80px]">
            {puzzle.arranged.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-500">按下面的部件</div>
            ) : (
              puzzle.arranged.map((component, idx) => (
                <button
                  key={idx}
                  onClick={() => moveComponent(component, true)}
                  className="text-4xl px-5 py-4 bg-blue-100 dark:bg-blue-900 rounded-lg border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-colors hanzi-display"
                >
                  {component}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Available Components */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">可用部件：</div>
        <div className="flex gap-3 flex-wrap justify-center">
          {puzzle.components.map((component, idx) => (
            <button
              key={idx}
              onClick={() => moveComponent(component, false)}
              className="text-4xl px-5 py-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 cursor-pointer transition-colors hanzi-display"
            >
              {component}
            </button>
          ))}
        </div>
      </div>

      {/* Validation */}
      <div className="flex justify-center">
        <button
          onClick={checkAnswer}
          disabled={puzzle.arranged.length !== data.components.length}
          className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-semibold transition-colors"
        >
          檢查答案
        </button>
      </div>

      {/* Feedback */}
      {puzzle.correct !== null && (
        <div
          className={`text-center p-6 rounded-lg ${
            puzzle.correct ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }`}
        >
          {puzzle.correct ? (
            <div>
              <div className="text-4xl mb-2">✓ 全對！</div>
              <div className="text-lg">你成功將部件排列正確！</div>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-2">✗ 不對</div>
              <div className="text-lg">正確答案是：{data.components.join(" + ")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

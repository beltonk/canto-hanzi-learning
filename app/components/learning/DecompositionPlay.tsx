"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition } from "@/types/character";
import Button from "@/app/components/ui/Button";
import Mascot, { MascotCelebration } from "@/app/components/ui/Mascot";

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
  const [showCharList, setShowCharList] = useState(false);

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
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-float">🐵</div>
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

  if (!data || !puzzle) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Score */}
      {score.total > 0 && (
        <div className="text-center text-base font-semibold text-[#636E72]">
          得分：<span className="text-[#98D8AA]">{score.correct}</span> / {score.total}
        </div>
      )}

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
                      ? "bg-[#98D8AA] text-white border-[#98D8AA] shadow-md"
                      : "bg-white border-[#FFE5B4] text-[#2D3436] hover:border-[#B8E8C4] hover:bg-[#F0FFF4]"
                  }`}
                >
                  {c.character}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target Character + Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[60px] md:text-[80px] hanzi-display text-[#2D3436] leading-none">{character}</div>
            <button
              onClick={() => speakCantonese(character)}
              className="px-3 py-2 bg-[#98D8AA] text-white rounded-full hover:bg-[#7BC88E] transition-colors"
            >
              🔊
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-2 bg-white border-2 border-[#FFE5B4] text-[#636E72] 
                       rounded-xl text-sm font-medium hover:border-[#7EC8E3] hover:bg-[#F0F9FF] transition-all"
            >
              {showHint ? "隱藏提示" : "提示 💡"}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 bg-white border-2 border-[#FFE5B4] text-[#636E72] 
                       rounded-xl text-sm font-medium hover:border-[#FF8E8E] hover:bg-[#FFF5F5] transition-all"
            >
              🔄
            </button>
          </div>
        </div>
        {showHint && (
          <div className="mt-2 text-center p-2 bg-[#F0F9FF] border border-[#A5DBF0] rounded-xl">
            <span className="text-sm text-[#2D3436]">結構：<strong className="text-[#5BB8D8]">{puzzle.structureType}</strong></span>
          </div>
        )}
      </div>

      {/* Game Area - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Drop Zone */}
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4">
          <div className="text-sm font-medium text-[#636E72] mb-2 text-center">放到這裏：</div>
          <div className="min-h-[80px] border-3 border-dashed border-[#B8E8C4] rounded-xl bg-[#F0FFF4]/50 p-3">
            <div className="flex gap-2 flex-wrap justify-center items-center min-h-[60px]">
              {puzzle.arranged.length === 0 ? (
                <div className="text-base text-[#7A8288]">按部件</div>
              ) : (
                puzzle.arranged.map((component, idx) => (
                  <button
                    key={idx}
                    onClick={() => moveComponent(component, true)}
                    className="text-3xl px-4 py-3 bg-[#98D8AA] text-white rounded-xl 
                             border-2 border-[#7BC88E] hover:bg-[#7BC88E] cursor-pointer 
                             hanzi-display shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {component}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Available Components */}
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4">
          <div className="text-sm font-medium text-[#636E72] mb-2 text-center">可用部件：</div>
          <div className="flex gap-2 flex-wrap justify-center min-h-[80px] items-center">
            {puzzle.components.map((component, idx) => (
              <button
                key={idx}
                onClick={() => moveComponent(component, false)}
                className="text-3xl px-4 py-3 bg-[#FFFBEB] rounded-xl 
                         border-2 border-[#FFD93D] hover:bg-[#FFE566] cursor-pointer 
                         hanzi-display shadow-md hover:scale-105 active:scale-95 transition-all text-[#2D3436]"
              >
                {component}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Check Button */}
      <div className="flex justify-center">
        <Button
          onClick={checkAnswer}
          disabled={puzzle.arranged.length !== data.components.length}
          variant="mint"
          size="lg"
        >
          檢查答案 ✓
        </Button>
      </div>

      {/* Feedback - Compact */}
      {puzzle.correct !== null && (
        <div
          className={`text-center p-4 rounded-2xl ${
            puzzle.correct 
              ? "bg-[#F0FFF4] border-2 border-[#98D8AA]" 
              : "bg-[#FFF5F5] border-2 border-[#FF8E8E]"
          }`}
        >
          {puzzle.correct ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🎉</span>
              <span className="text-lg text-[#7BC88E] font-bold">答對了！</span>
            </div>
          ) : (
            <div>
              <div className="text-lg text-[#E55555] font-bold mb-1">再試一次 😅</div>
              <div className="text-base text-[#636E72]">
                正確：<span className="hanzi-display text-lg">{data.components.join(" + ")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

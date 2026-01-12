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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score */}
      {score.total > 0 && (
        <div className="text-center text-xl font-semibold text-[#636E72]">
          得分：<span className="text-[#98D8AA]">{score.correct}</span> / {score.total}
        </div>
      )}

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
                    ? "bg-[#98D8AA] text-white border-[#98D8AA] shadow-lg"
                    : "bg-white border-[#FFE5B4] text-[#2D3436] hover:border-[#B8E8C4] hover:bg-[#F0FFF4]"
                }`}
              >
                {c.character}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center bg-white rounded-3xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {/* Mascot */}
        <div className="mb-4">
          <Mascot type="monkey" size="md" message="拆字真有趣！" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-[#2D3436]">拆字遊戲</h2>
        <p className="text-lg text-[#636E72]">將部件排列成：</p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="text-[100px] hanzi-display text-[#2D3436]">{character}</div>
          <button
            onClick={() => speakCantonese(character)}
            className="px-4 py-4 bg-[#98D8AA] text-white rounded-full 
                     hover:bg-[#7BC88E] transition-colors
                     min-h-[56px] min-w-[56px] text-2xl"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={() => setShowHint(!showHint)}
          className="px-6 py-3 bg-white border-3 border-[#FFE5B4] text-[#636E72] 
                   rounded-2xl text-lg font-medium min-h-[56px]
                   hover:border-[#7EC8E3] hover:bg-[#F0F9FF] transition-all"
        >
          {showHint ? "隱藏提示 👀" : "顯示提示 💡"}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-white border-3 border-[#FFE5B4] text-[#636E72] 
                   rounded-2xl text-lg font-medium min-h-[56px]
                   hover:border-[#FF8E8E] hover:bg-[#FFF5F5] transition-all"
        >
          重新開始 🔄
        </button>
      </div>

      {showHint && (
        <div className="text-center p-5 bg-[#F0F9FF] border-2 border-[#A5DBF0] rounded-2xl">
          <p className="text-lg text-[#2D3436]">
            結構類型：<strong className="text-[#5BB8D8]">{puzzle.structureType}</strong>
          </p>
        </div>
      )}

      {/* Arranged Components Area */}
      <div className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="p-5 border-b border-[#FFE5B4]">
          <div className="text-center text-lg font-medium text-[#636E72]">將部件放到這裏：</div>
        </div>
        <div className="p-6 min-h-[140px] border-4 border-dashed border-[#B8E8C4] rounded-2xl m-5 bg-[#F0FFF4]/50">
          <div className="flex gap-4 flex-wrap justify-center items-center min-h-[100px]">
            {puzzle.arranged.length === 0 ? (
              <div className="text-xl text-[#B2BEC3]">按下面的部件</div>
            ) : (
              puzzle.arranged.map((component, idx) => (
                <button
                  key={idx}
                  onClick={() => moveComponent(component, true)}
                  className="text-5xl px-6 py-5 bg-[#98D8AA] text-white rounded-2xl 
                           border-3 border-[#7BC88E] 
                           hover:bg-[#7BC88E] cursor-pointer transition-all 
                           hanzi-display shadow-lg hover:scale-105 active:scale-95
                           min-h-[80px]"
                >
                  {component}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Available Components */}
      <div className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-8">
        <div className="text-center text-lg font-medium text-[#636E72] mb-5">可用部件：</div>
        <div className="flex gap-4 flex-wrap justify-center">
          {puzzle.components.map((component, idx) => (
            <button
              key={idx}
              onClick={() => moveComponent(component, false)}
              className="text-5xl px-6 py-5 bg-[#FFFBEB] rounded-2xl 
                       border-3 border-[#FFD93D] 
                       hover:bg-[#FFE566] cursor-pointer transition-all 
                       hanzi-display shadow-lg hover:scale-105 active:scale-95
                       min-h-[80px] text-[#2D3436]"
            >
              {component}
            </button>
          ))}
        </div>
      </div>

      {/* Validation */}
      <div className="flex justify-center">
        <Button
          onClick={checkAnswer}
          disabled={puzzle.arranged.length !== data.components.length}
          variant="mint"
          size="xl"
        >
          檢查答案 ✓
        </Button>
      </div>

      {/* Feedback */}
      {puzzle.correct !== null && (
        <div
          className={`text-center p-8 rounded-3xl ${
            puzzle.correct 
              ? "bg-[#F0FFF4] border-3 border-[#98D8AA]" 
              : "bg-[#FFF5F5] border-3 border-[#FF8E8E]"
          }`}
        >
          {puzzle.correct ? (
            <div>
              <MascotCelebration type="monkey" message="全對！太棒了！" />
              <div className="text-xl text-[#7BC88E] mt-4">你成功將部件排列正確！</div>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-3">😅</div>
              <div className="text-3xl mb-2 text-[#E55555] font-bold">再試一次</div>
              <div className="text-xl text-[#636E72]">
                正確答案是：<span className="hanzi-display text-2xl">{data.components.join(" + ")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

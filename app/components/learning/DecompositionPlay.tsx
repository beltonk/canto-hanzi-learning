"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character, Decomposition } from "@/types/character";
import Button from "@/app/components/ui/Button";
import Mascot, { MascotCelebration } from "@/app/components/ui/Mascot";
import { useLanguage } from "@/lib/i18n/context";

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
  const { t, language } = useLanguage();
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
        throw new Error(`${t("loadFailed")}: ${response.statusText}`);
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
          throw new Error(t("noQuestions"));
        }
      } else {
        setData(charData.decomposition);
        initPuzzle(charData.decomposition);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [character, grade, onCharacterChange, t]);

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
        <div className="text-xl text-[var(--color-gray)]">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">😢</div>
        <div className="text-xl text-[var(--color-coral-dark)]">{t("error")}: {error}</div>
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
        <div className="text-center text-base font-semibold text-[var(--color-gray)]">
          {t("score")}: <span className="text-[var(--color-mint)]">{score.correct}</span> / {score.total}
        </div>
      )}

      {/* Character Navigation - Show 2 rows by default, expand for all */}
      {allCharacters.length > 1 && (
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-[var(--color-gray)]">
                {t("selectCharacterToPlay")}
                <span className="text-sm text-[var(--color-gray-light)] ml-2">({allCharacters.length})</span>
              </span>
              {allCharacters.length > 20 && (
                <button
                  onClick={() => setShowCharList(!showCharList)}
                  className="text-sm text-[var(--color-coral)] hover:text-[var(--color-coral-dark)] font-medium flex items-center gap-1"
                >
                  {showCharList ? t("collapse") : t("expandAll")}
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
                      ? "bg-[var(--color-mint)] text-white border-[var(--color-mint)] shadow-md"
                      : "bg-[var(--card-bg)] border-[var(--color-peach)] text-[var(--color-charcoal)] hover:border-[var(--color-mint)]/50 hover:bg-[var(--color-mint)]/10"
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
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 shadow-[0_4px_16px_var(--card-shadow)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[60px] md:text-[80px] hanzi-display text-[var(--color-charcoal)] leading-none">{character}</div>
            <button
              onClick={() => speakCantonese(character)}
              className="px-3 py-2 bg-[var(--color-mint)] text-white rounded-full hover:bg-[var(--color-mint-dark)] transition-colors"
            >
              🔊
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-2 bg-[var(--card-bg)] border-2 border-[var(--color-peach)] text-[var(--color-gray)] 
                       rounded-xl text-sm font-medium hover:border-[var(--color-sky)] hover:bg-[var(--color-sky)]/10 transition-all"
            >
              {showHint ? t("hideHint") : `${t("hint")} 💡`}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 bg-[var(--card-bg)] border-2 border-[var(--color-peach)] text-[var(--color-gray)] 
                       rounded-xl text-sm font-medium hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/5 transition-all"
            >
              🔄
            </button>
          </div>
        </div>
        {showHint && (
          <div className="mt-2 text-center p-2 bg-[var(--color-sky)]/10 border border-[var(--color-sky)]/30 rounded-xl">
            <span className="text-sm text-[var(--color-charcoal)]">{t("structure")}: <strong className="text-[var(--color-sky-dark)]">{puzzle.structureType}</strong></span>
          </div>
        )}
      </div>

      {/* Game Area - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Drop Zone */}
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] p-4">
          <div className="text-sm font-medium text-[var(--color-gray)] mb-2 text-center">{t("dropHere")}</div>
          <div className="min-h-[80px] border-3 border-dashed border-[var(--color-mint)]/50 rounded-xl bg-[var(--color-mint)]/5 p-3">
            <div className="flex gap-2 flex-wrap justify-center items-center min-h-[60px]">
              {puzzle.arranged.length === 0 ? (
                <div className="text-base text-[var(--color-gray)]">{t("byComponent")}</div>
              ) : (
                puzzle.arranged.map((component, idx) => (
                  <button
                    key={idx}
                    onClick={() => moveComponent(component, true)}
                    className="text-3xl px-4 py-3 bg-[var(--color-mint)] text-white rounded-xl 
                             border-2 border-[var(--color-mint-dark)] hover:bg-[var(--color-mint-dark)] cursor-pointer 
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
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] p-4">
          <div className="text-sm font-medium text-[var(--color-gray)] mb-2 text-center">{t("availableComponents")}</div>
          <div className="flex gap-2 flex-wrap justify-center min-h-[80px] items-center">
            {puzzle.components.map((component, idx) => (
              <button
                key={idx}
                onClick={() => moveComponent(component, false)}
                className="text-3xl px-4 py-3 bg-[var(--color-golden)]/10 rounded-xl 
                         border-2 border-[var(--color-golden)] hover:bg-[var(--color-golden)]/30 cursor-pointer 
                         hanzi-display shadow-md hover:scale-105 active:scale-95 transition-all text-[var(--color-charcoal)]"
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
          {t("checkAnswer")} ✓
        </Button>
      </div>

      {/* Feedback - Compact */}
      {puzzle.correct !== null && (
        <div
          className={`text-center p-4 rounded-2xl ${
            puzzle.correct 
              ? "bg-[var(--color-mint)]/10 border-2 border-[var(--color-mint)]" 
              : "bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral-light)]"
          }`}
        >
          {puzzle.correct ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🎉</span>
              <span className="text-lg text-[var(--color-mint-dark)] font-bold">{t("correctAnswer")}</span>
            </div>
          ) : (
            <div>
              <div className="text-lg text-[var(--color-coral-dark)] font-bold mb-1">{t("tryAgainAnswer")} 😅</div>
              <div className="text-base text-[var(--color-gray)]">
                {t("correctIs")}: <span className="hanzi-display text-lg">{data.components.join(" + ")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

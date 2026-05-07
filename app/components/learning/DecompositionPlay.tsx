/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useAudio } from "@/lib/audio/context";
import { useMotionClass } from "@/lib/motion";
import { recordActivity } from "@/lib/activity/recordActivity";
import FavoriteButton from "@/app/components/ui/FavoriteButton";

interface DecompositionPlayProps {
  character?: string;
  onCharacterChange?: (char: string) => void;
}

interface DecompEntry {
  character: string;
  components: string[];
  structureType: string;
}

interface PuzzleState {
  components: string[];
  arranged: string[];
  structureType: string;
  correct: boolean | null;
}

export default function DecompositionPlay({ character, onCharacterChange }: DecompositionPlayProps) {
  const { t } = useLanguage();
  const audio = useAudio();
  // Use the shared motion primitives so prefers-reduced-motion uniformly
  // disables our feedback bounce / pop animations.
  const popClass = useMotionClass('pop');
  const cheerClass = useMotionClass('cheer');
  const [allEntries, setAllEntries] = useState<DecompEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DecompEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showCharList, setShowCharList] = useState(false);

  const initPuzzle = useCallback((entry: DecompEntry) => {
    const shuffled = [...entry.components].sort(() => Math.random() - 0.5);
    setPuzzle({
      components: shuffled,
      arranged: [],
      structureType: entry.structureType,
      correct: null,
    });
    setShowHint(false);
  }, []);

  // Load decomposition data once
  useEffect(() => {
    let cancelled = false;
    fetch('/api/decomposition')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const entries = (data.characters || []) as DecompEntry[];
        setAllEntries(entries);
        const target = character ? entries.find(e => e.character === character) : entries[0];
        if (target) {
          setCurrentEntry(target);
          if (!character && target) onCharacterChange?.(target.character);
          initPuzzle(target);
        } else if (entries.length > 0) {
          setCurrentEntry(entries[0]);
          onCharacterChange?.(entries[0].character);
          initPuzzle(entries[0]);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : '載入失敗');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [character, initPuzzle, onCharacterChange]);

  // When external `character` prop changes, switch puzzle
  useEffect(() => {
    if (!character || allEntries.length === 0) return;
    const target = allEntries.find(e => e.character === character);
    if (target && target.character !== currentEntry?.character) {
      setCurrentEntry(target);
      initPuzzle(target);
    }
  }, [character, allEntries, currentEntry?.character, initPuzzle]);

  function moveComponent(component: string, fromArranged: boolean) {
    if (!puzzle) return;
    if (fromArranged) {
      const idx = puzzle.arranged.indexOf(component);
      if (idx > -1) {
        const newArranged = [...puzzle.arranged];
        newArranged.splice(idx, 1);
        setPuzzle({ ...puzzle, arranged: newArranged, components: [...puzzle.components, component], correct: null });
      }
    } else {
      const idx = puzzle.components.indexOf(component);
      if (idx > -1) {
        const newComponents = [...puzzle.components];
        newComponents.splice(idx, 1);
        setPuzzle({ ...puzzle, components: newComponents, arranged: [...puzzle.arranged, component], correct: null });
      }
    }
  }

  function checkAnswer() {
    if (!puzzle || !currentEntry) return;
    const isCorrect = JSON.stringify(puzzle.arranged) === JSON.stringify(currentEntry.components);
    setPuzzle({ ...puzzle, correct: isCorrect });
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    recordActivity(
      { type: 'decompose', char: currentEntry.character, at: Date.now() },
      isCorrect ? 'decompose_correct' : undefined,
      isCorrect,
    );
  }

  function reset() {
    if (currentEntry) initPuzzle(currentEntry);
  }

  function nextCharacter() {
    if (allEntries.length === 0 || !currentEntry) return;
    const idx = allEntries.findIndex(e => e.character === currentEntry.character);
    const next = allEntries[(idx + 1) % allEntries.length];
    setCurrentEntry(next);
    onCharacterChange?.(next.character);
    initPuzzle(next);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-bounce">🐵</div>
        <div className="text-lg text-slate-500">{t("loading")}</div>
      </div>
    );
  }

  if (error || !currentEntry || !puzzle) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">😢</div>
        <div className="text-lg text-rose-600">{error || '尚未準備好'}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {score.total > 0 && (
        <div className="flex items-center justify-center gap-2 text-base font-medium text-slate-600">
          <span>分數</span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
            {score.correct} / {score.total}
          </span>
        </div>
      )}

      {allEntries.length > 1 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm border-2 border-indigo-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              選擇字符 ({allEntries.length})
            </span>
            {allEntries.length > 24 && (
              <button
                onClick={() => setShowCharList(!showCharList)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {showCharList ? '收起' : '展開全部'}
                <span className={`transition-transform ${showCharList ? 'rotate-180' : ''}`}>▼</span>
              </button>
            )}
          </div>
          <div className={`flex gap-2 flex-wrap ${!showCharList && allEntries.length > 24 ? 'max-h-[120px] overflow-hidden' : ''}`}>
            {allEntries.map((e, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentEntry(e);
                  onCharacterChange?.(e.character);
                  initPuzzle(e);
                }}
                className={`text-2xl px-3 py-2 rounded-xl border transition-all hanzi-display font-medium min-w-[48px] ${
                  e.character === currentEntry.character
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-indigo-50/70 border-indigo-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-100"
                }`}
              >
                {e.character}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Character Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-[96px] hanzi-display text-slate-900 leading-none font-medium">
              {currentEntry.character}
            </div>
            <button
              onClick={() => audio.speakTTS(currentEntry.character, 'zh-HK', 0.5)}
              className="w-12 h-12 rounded-full bg-indigo-600 text-white text-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center"
              aria-label="播放發音"
            >
              🔊
            </button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <FavoriteButton
              text={currentEntry.character}
              kind="char"
              source="decompose"
              variant="chip"
              size="sm"
            />
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-all"
            >
              {showHint ? '隱藏提示' : '提示 💡'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
            >
              重置 🔄
            </button>
          </div>
        </div>
        {showHint && (
          <div className="mt-3 p-3 bg-indigo-100 rounded-xl border border-indigo-300">
            <span className="text-sm text-slate-700">
              結構：<strong className="text-indigo-700">{puzzle.structureType}</strong>
              <span className="ml-3">部件數量：<strong className="text-indigo-700">{currentEntry.components.length}</strong></span>
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drop Zone */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border-2 border-emerald-200 p-4">
          <div className="text-sm font-semibold text-slate-600 mb-3 text-center">放置區（按順序）</div>
          <div className="min-h-[100px] border-2 border-dashed border-emerald-400 rounded-xl bg-emerald-100/60 p-4">
            <div className="flex gap-2 flex-wrap justify-center items-center min-h-[64px]">
              {puzzle.arranged.length === 0 ? (
                <div className="text-sm text-slate-400">點擊下方部件</div>
              ) : (
                puzzle.arranged.map((component, idx) => (
                  <button
                    key={idx}
                    onClick={() => moveComponent(component, true)}
                    className="text-3xl px-4 py-3 bg-emerald-500 text-white rounded-xl shadow hover:bg-emerald-600 active:scale-95 transition-all hanzi-display font-medium"
                  >
                    {component}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Available Components */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border-2 border-amber-200 p-4">
          <div className="text-sm font-semibold text-slate-600 mb-3 text-center">可用部件</div>
          <div className="flex gap-2 flex-wrap justify-center min-h-[100px] items-center p-2">
            {puzzle.components.length === 0 ? (
              <div className="text-sm text-slate-400">已全部放入</div>
            ) : (
              puzzle.components.map((component, idx) => (
                <button
                  key={idx}
                  onClick={() => moveComponent(component, false)}
                  className="text-3xl px-4 py-3 bg-amber-100 rounded-xl border-2 border-amber-300 text-slate-800 hover:bg-amber-200 hover:scale-105 active:scale-95 transition-all hanzi-display font-medium"
                >
                  {component}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={checkAnswer}
          disabled={puzzle.arranged.length !== currentEntry.components.length}
          className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-base font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          檢查答案 ✓
        </button>
        {puzzle.correct && (
          <button
            onClick={nextCharacter}
            className="px-8 py-3 rounded-xl bg-emerald-500 text-white text-base font-semibold shadow-md hover:bg-emerald-600 hover:shadow-lg active:scale-95 transition-all"
          >
            下一個 →
          </button>
        )}
      </div>

      {puzzle.correct !== null && (
        <div
          className={`text-center p-5 rounded-2xl border-2 ${
            puzzle.correct
              ? "bg-emerald-100 border-emerald-400"
              : "bg-rose-100 border-rose-400"
          } ${popClass}`}
        >
          {puzzle.correct ? (
            <div className={`flex items-center justify-center gap-3 ${cheerClass}`}>
              <span className="text-3xl">🎉</span>
              <span className="text-lg text-emerald-700 font-bold">答對了！</span>
            </div>
          ) : (
            <div>
              <div className="text-lg text-rose-700 font-bold mb-2">再試一次 😅</div>
              <div className="text-base text-slate-700">
                正確答案：<span className="hanzi-display text-xl font-medium">{currentEntry.components.join(" + ")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

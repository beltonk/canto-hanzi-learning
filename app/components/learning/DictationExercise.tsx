"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FullCharacterData } from "@/types/fullCharacter";
import { useAudio } from "@/lib/audio/context";
import { recordActivity } from "@/lib/activity/recordActivity";
import FavoriteButton from "@/app/components/ui/FavoriteButton";
import { addFavorite } from "@/lib/favorites";

interface DictationExerciseProps {
  /** Optional: limit by stroke range (defaults to all) */
  minStrokes?: number;
  maxStrokes?: number;
  /** Number of questions per session */
  count?: number;
}

interface Question {
  character: string;
  jyutping: string;
  pinyin?: string;
  radical: string;
  strokeCount: number;
}

const STROKE_RANGES = [
  { label: '簡單 (1-5筆)', min: 1, max: 5 },
  { label: '中等 (6-10筆)', min: 6, max: 10 },
  { label: '較難 (11-15筆)', min: 11, max: 15 },
  { label: '困難 (16+筆)', min: 16, max: 32 },
];

export default function DictationExercise(props: DictationExerciseProps) {
  const audio = useAudio();
  const [strokeRange, setStrokeRange] = useState(STROKE_RANGES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenIdxRef = useRef<number>(-1);

  const loadQuestions = useCallback(async (range: typeof strokeRange) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("minStrokes", String(props.minStrokes ?? range.min));
      params.set("maxStrokes", String(props.maxStrokes ?? range.max));
      params.set("inLexicalListsHK", "true");
      params.set("shuffle", "true");
      params.set("limit", String(props.count ?? 20));

      const response = await fetch(`/api/characters?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`載入失敗：${response.statusText}`);
      }

      const result = await response.json();
      const chars = (result.characters ?? []) as FullCharacterData[];

      const newQuestions: Question[] = chars.map(c => ({
        character: c.character,
        jyutping: c.jyutping,
        pinyin: c.pinyin,
        radical: c.radical,
        strokeCount: c.strokeCount,
      }));

      setQuestions(newQuestions);
      setCurrentIndex(0);
      setSubmitted(false);
      setUserAnswer("");
      setShowHint(false);
      setScore({ correct: 0, total: 0 });
      lastSpokenIdxRef.current = -1;
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [props.minStrokes, props.maxStrokes, props.count]);

  useEffect(() => {
    loadQuestions(strokeRange);
  }, [loadQuestions, strokeRange]);

  // Auto-pronounce when question changes
  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (lastSpokenIdxRef.current === currentIndex) return;
    const q = questions[currentIndex];
    if (!q) return;
    lastSpokenIdxRef.current = currentIndex;
    // Slight delay so audio context is ready and UI has settled
    const t = setTimeout(() => {
      audio.speakTTS(q.character, 'zh-HK', 0.7);
    }, 250);
    inputRef.current?.focus();
    return () => clearTimeout(t);
  }, [currentIndex, questions, loading, audio]);

  function speak() {
    const q = questions[currentIndex];
    if (q) audio.speakTTS(q.character, 'zh-HK', 0.7);
  }

  function handleSubmit() {
    if (!userAnswer.trim()) return;
    const q = questions[currentIndex];
    const isCorrect = userAnswer.trim() === q.character;
    setSubmitted(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    recordActivity(
      { type: 'dictation', char: q.character, at: Date.now() },
      isCorrect ? 'dictation_correct' : undefined,
      isCorrect,
    );
    // Auto-add wrong answers to "我的收藏" so the user can revisit them later.
    if (!isCorrect) {
      addFavorite({
        text: q.character,
        kind: 'char',
        jyutping: q.jyutping,
        source: 'dictation',
        reason: 'mistake',
      });
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer("");
      setSubmitted(false);
      setShowHint(false);
    }
  }

  function handleRestart() {
    loadQuestions(strokeRange);
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = submitted && userAnswer.trim() === currentQuestion?.character;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-bounce">🦉</div>
        <div className="text-lg text-slate-500">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="text-5xl mb-2">😢</div>
        <div className="text-lg text-rose-600">錯誤：{error}</div>
        <button
          onClick={() => loadQuestions(strokeRange)}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          再試一次
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">🤔</div>
        <div className="text-lg text-slate-500">沒有題目</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Difficulty selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">難度</span>
          {STROKE_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setStrokeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                strokeRange === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress + Score */}
      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
        <span>第 {currentIndex + 1} / {questions.length} 題</span>
        <span>分數：<span className="text-amber-600 font-semibold text-base">{score.correct} / {score.total}</span></span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-sky-200 p-4 space-y-4">
        {/* Audio + Hint */}
        <div className="flex items-center gap-3">
          <button
            onClick={speak}
            className="flex-1 px-5 py-3 bg-gradient-to-br from-indigo-500 to-purple-500
                     text-white rounded-2xl text-lg font-semibold
                     flex items-center justify-center gap-3
                     shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            🔊 播放發音
          </button>
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-4 py-3 bg-amber-100 border border-amber-300 text-amber-700
                     rounded-2xl text-base font-medium hover:bg-amber-200 transition-all"
          >
            {showHint ? '隱藏提示' : '提示 💡'}
          </button>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="text-center p-4 bg-amber-100 border border-amber-300 rounded-xl space-y-1">
            <div className="text-base font-mono text-amber-700">{currentQuestion.jyutping}</div>
            <div className="text-sm text-slate-600">
              部首：<span className="font-chinese font-medium">{currentQuestion.radical}</span>
              <span className="mx-2">•</span>
              {currentQuestion.strokeCount} 筆
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !submitted) handleSubmit();
            }}
            disabled={submitted}
            className="flex-1 px-4 py-4 text-5xl text-center border-2 border-slate-200
                     rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/40
                     focus:outline-none disabled:bg-slate-50
                     text-slate-900 bg-white hanzi-display transition-all"
            placeholder="?"
            maxLength={1}
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Submit */}
        {!submitted && (
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-base font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              提交答案 ✓
            </button>
          </div>
        )}

        {/* Feedback */}
        {submitted && (
          <div
            className={`p-5 rounded-2xl border-2 ${
              isCorrect
                ? "bg-emerald-100 border-emerald-400"
                : "bg-rose-100 border-rose-400"
            }`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{isCorrect ? "🎉" : "😅"}</span>
                <div>
                  <div className={`text-lg font-bold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "答對了！" : "答錯了"}
                  </div>
                  <div className="text-base text-slate-600">
                    答案是 <span className="hanzi-display text-2xl text-slate-900 font-medium">{currentQuestion.character}</span>
                    <span className="ml-2 font-mono text-indigo-600">{currentQuestion.jyutping}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <FavoriteButton
                  text={currentQuestion.character}
                  kind="char"
                  jyutping={currentQuestion.jyutping}
                  source="dictation"
                  reason={isCorrect ? 'manual' : 'mistake'}
                  variant="chip"
                />
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-all"
                  >
                    下一題 →
                  </button>
                ) : (
                  <button
                    onClick={handleRestart}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 transition-all"
                  >
                    再玩一次 🔄
                  </button>
                )}
              </div>
            </div>
            {!isCorrect && (
              <div className="mt-3 text-xs text-rose-700/80 text-right">
                💡 已自動加入「我的收藏」方便日後溫習
              </div>
            )}
          </div>
        )}
      </div>

      {/* Final Score */}
      {submitted && currentIndex === questions.length - 1 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border-2 border-emerald-200 p-5 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-indigo-600">{score.correct}/{score.total}</span>
            <span className="text-lg text-slate-600">
              {score.correct === score.total ? '完美！' :
               score.correct >= score.total * 0.8 ? '很棒！' :
               score.correct >= score.total * 0.6 ? '不錯！' : '繼續加油！'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

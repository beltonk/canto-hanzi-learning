"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character } from "@/types/character";
import Button from "@/app/components/ui/Button";
import Mascot, { MascotCelebration } from "@/app/components/ui/Mascot";
import { useLanguage } from "@/lib/i18n/context";

interface DictationExerciseProps {
  grade?: "KS1" | "KS2";
}

interface Question {
  character: string;
  jyutping: string;
  meanings: string[];
}

export default function DictationExercise({ grade }: DictationExerciseProps) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);

  const loadQuestions = useCallback(async () => {
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
      
      // Shuffle and create questions
      const shuffled = result.characters
        .map((item: { character: Character }) => ({
          character: item.character.character,
          jyutping: item.character.jyutping,
          meanings: item.character.meanings,
        }))
        .sort(() => Math.random() - 0.5);

      setQuestions(shuffled);
      setCurrentIndex(0);
      setScore({ correct: 0, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [grade, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function speakCantonese(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-HK';
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  }

  function handleSubmit() {
    if (!userAnswer.trim()) return;
    
    const isCorrect = userAnswer.trim() === questions[currentIndex].character;
    setSubmitted(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
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
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setUserAnswer("");
    setSubmitted(false);
    setScore({ correct: 0, total: 0 });
    setShowHint(false);
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = submitted && userAnswer.trim() === currentQuestion?.character;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-6xl mb-4 animate-float">🦉</div>
        <div className="text-xl text-[var(--color-gray)]">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="text-5xl mb-2">😢</div>
        <div className="text-xl text-[var(--color-coral-dark)]">{t("error")}: {error}</div>
        <Button onClick={loadQuestions} variant="primary">
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">🤔</div>
        <div className="text-xl text-[var(--color-gray)]">{t("noQuestions")}</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Progress & Score */}
      <div className="flex justify-between items-center text-base font-medium text-[var(--color-gray)]">
        <span>{t("question")} {currentIndex + 1} / {questions.length}</span>
        <span>{t("score")}: <span className="text-[var(--color-golden)]">{score.correct}</span> / {score.total}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--color-peach)] rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-[var(--color-golden)] to-[var(--color-golden-dark)] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] p-4 md:p-6 space-y-4">
        {/* Audio + Hint Row */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => speakCantonese(currentQuestion.character)}
            className="flex-1 px-6 py-4 bg-gradient-to-br from-[var(--color-golden)] to-[var(--color-golden-dark)]
                     text-[#2D3436] rounded-xl text-xl font-bold
                     flex items-center justify-center gap-2
                     shadow-[0_4px_12px_rgba(255,217,61,0.3)]
                     hover:scale-105 active:scale-95 transition-all"
          >
            🔊 {t("listenPronunciation")}
          </button>
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-4 py-4 bg-[var(--card-bg)] border-2 border-[var(--color-peach)] text-[var(--color-sky)] 
                     rounded-xl text-base font-medium hover:bg-[var(--color-sky)]/10 transition-all"
          >
            {showHint ? t("hideHint") : `${t("hint")}💡`}
          </button>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="text-center p-3 bg-[var(--color-sky)]/10 border border-[var(--color-sky)]/30 rounded-xl">
            <span className="text-base text-[var(--color-charcoal)]">
              <span className="font-mono text-[var(--color-sky-dark)]">{currentQuestion.jyutping}</span>
              <span className="mx-2">•</span>
              <span className="text-[var(--color-gray)]">{currentQuestion.meanings.join("、")}</span>
            </span>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3">
          <input
            id="answer"
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !submitted) {
                handleSubmit();
              }
            }}
            disabled={submitted}
            className="flex-1 px-4 py-3 text-4xl text-center border-3 border-[var(--color-peach)] 
                     rounded-xl focus:border-[var(--color-golden)] focus:ring-2 focus:ring-[var(--color-golden)]/30
                     focus:outline-none disabled:bg-[var(--color-golden)]/10
                     text-[var(--color-charcoal)] bg-[var(--input-bg)] hanzi-display transition-all"
            placeholder="寫"
            maxLength={1}
            autoComplete="off"
          />
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              variant="golden"
              size="lg"
            >
              {t("submitAnswer")} ✓
            </Button>
          </div>
        )}

        {/* Feedback - Compact */}
        {submitted && (
          <div
            className={`p-4 rounded-2xl ${
              isCorrect 
                ? "bg-[var(--color-mint)]/10 border-2 border-[var(--color-mint)]" 
                : "bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral-light)]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{isCorrect ? "🎉" : "😅"}</span>
                <div>
                  <div className={`text-lg font-bold ${isCorrect ? "text-[var(--color-mint-dark)]" : "text-[var(--color-coral-dark)]"}`}>
                    {isCorrect ? t("correct") : t("incorrect")}
                  </div>
                  <div className="text-base text-[var(--color-gray)]">
                    <span className="hanzi-display text-xl">{currentQuestion.character}</span>
                    <span className="ml-2 font-mono text-[var(--color-sky-dark)]">{currentQuestion.jyutping}</span>
                  </div>
                </div>
              </div>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext} variant="sky" size="md">
                  {t("nextQuestion")} →
                </Button>
              ) : (
                <Button onClick={handleRestart} variant="primary" size="md">
                  {t("playAgain")} 🔄
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Final Score - Compact */}
      {submitted && currentIndex === questions.length - 1 && (
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_16px_var(--card-shadow)] p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-[var(--color-golden)]">{score.correct}/{score.total}</span>
            <span className="text-lg text-[var(--color-gray)]">
              {score.correct === score.total ? t("perfect") :
               score.correct >= score.total * 0.8 ? t("great") :
               score.correct >= score.total * 0.6 ? t("good") : t("keepGoing")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

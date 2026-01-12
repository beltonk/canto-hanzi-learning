"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character } from "@/types/character";
import Button from "@/app/components/ui/Button";
import Mascot, { MascotCelebration } from "@/app/components/ui/Mascot";

interface DictationExerciseProps {
  grade?: "KS1" | "KS2";
}

interface Question {
  character: string;
  jyutping: string;
  meanings: string[];
}

export default function DictationExercise({ grade }: DictationExerciseProps) {
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
        throw new Error(`載入失敗: ${response.statusText}`);
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
      setError(err instanceof Error ? err.message : "載入資料失敗");
    } finally {
      setLoading(false);
    }
  }, [grade]);

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
        <div className="text-xl text-[#636E72]">正在載入...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="text-5xl mb-2">😢</div>
        <div className="text-xl text-[#E55555]">錯誤：{error}</div>
        <Button onClick={loadQuestions} variant="primary">
          再試一次
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-5xl mb-4">🤔</div>
        <div className="text-xl text-[#636E72]">沒有可用的題目</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Progress & Score */}
      <div className="flex justify-between items-center text-base font-medium text-[#636E72]">
        <span>題目 {currentIndex + 1} / {questions.length}</span>
        <span>得分：<span className="text-[#FFD93D]">{score.correct}</span> / {score.total}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#FFE5B4] rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-[#FFD93D] to-[#F5C800] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
        {/* Audio + Hint Row */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => speakCantonese(currentQuestion.character)}
            className="flex-1 px-6 py-4 bg-gradient-to-br from-[#FFD93D] to-[#F5C800]
                     text-[#2D3436] rounded-xl text-xl font-bold
                     flex items-center justify-center gap-2
                     shadow-[0_4px_12px_rgba(255,217,61,0.3)]
                     hover:scale-105 active:scale-95 transition-all"
          >
            🔊 聽發音
          </button>
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-4 py-4 bg-white border-2 border-[#FFE5B4] text-[#7EC8E3] 
                     rounded-xl text-base font-medium hover:bg-[#F0F9FF] transition-all"
          >
            {showHint ? "隱藏" : "提示💡"}
          </button>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="text-center p-3 bg-[#F0F9FF] border border-[#A5DBF0] rounded-xl">
            <span className="text-base text-[#2D3436]">
              <span className="font-mono text-[#5BB8D8]">{currentQuestion.jyutping}</span>
              <span className="mx-2">•</span>
              <span className="text-[#636E72]">{currentQuestion.meanings.join("、")}</span>
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
            className="flex-1 px-4 py-3 text-4xl text-center border-3 border-[#FFE5B4] 
                     rounded-xl focus:border-[#FFD93D] focus:ring-2 focus:ring-[#FFD93D]/30
                     focus:outline-none disabled:bg-[#FFF8E7]
                     text-[#2D3436] hanzi-display transition-all"
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
              提交答案 ✓
            </Button>
          </div>
        )}

        {/* Feedback - Compact */}
        {submitted && (
          <div
            className={`p-4 rounded-2xl ${
              isCorrect 
                ? "bg-[#F0FFF4] border-2 border-[#98D8AA]" 
                : "bg-[#FFF5F5] border-2 border-[#FF8E8E]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{isCorrect ? "🎉" : "😅"}</span>
                <div>
                  <div className={`text-lg font-bold ${isCorrect ? "text-[#7BC88E]" : "text-[#E55555]"}`}>
                    {isCorrect ? "答對了！" : "不對"}
                  </div>
                  <div className="text-base text-[#636E72]">
                    <span className="hanzi-display text-xl">{currentQuestion.character}</span>
                    <span className="ml-2 font-mono text-[#5BB8D8]">{currentQuestion.jyutping}</span>
                  </div>
                </div>
              </div>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext} variant="sky" size="md">
                  下一題 →
                </Button>
              ) : (
                <Button onClick={handleRestart} variant="primary" size="md">
                  再玩 🔄
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Final Score - Compact */}
      {submitted && currentIndex === questions.length - 1 && (
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-[#FFD93D]">{score.correct}/{score.total}</span>
            <span className="text-lg text-[#636E72]">
              {score.correct === score.total ? "完美！🌟" :
               score.correct >= score.total * 0.8 ? "很好！👍" :
               score.correct >= score.total * 0.6 ? "不錯！💪" : "加油！📚"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

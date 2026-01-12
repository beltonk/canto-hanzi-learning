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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress & Score */}
      <div className="flex justify-between items-center text-lg font-medium text-[#636E72]">
        <span>題目 {currentIndex + 1} / {questions.length}</span>
        <span>得分：<span className="text-[#FFD93D]">{score.correct}</span> / {score.total}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#FFE5B4] rounded-full h-4 shadow-inner">
        <div 
          className="bg-gradient-to-r from-[#FFD93D] to-[#F5C800] h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-8 space-y-6">
        <div className="text-center">
          <Mascot type="owl" size="md" message="專心聆聽！" />
          <h2 className="text-2xl font-bold mb-2 text-[#2D3436] mt-4">默書練習</h2>
          <p className="text-lg text-[#636E72]">
            聽發音，寫出正確的漢字
          </p>
        </div>

        {/* Audio Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => speakCantonese(currentQuestion.character)}
            className="w-full max-w-sm px-8 py-6 bg-gradient-to-br from-[#FFD93D] to-[#F5C800]
                     text-[#2D3436] rounded-2xl text-2xl font-bold
                     flex items-center justify-center gap-3
                     shadow-[0_4px_16px_rgba(255,217,61,0.4)]
                     hover:scale-105 active:scale-95 transition-all
                     min-h-[72px]"
          >
            🔊 聽發音
          </button>
          <p className="text-base text-[#7A8288]">按這裏聽粵語讀音</p>
        </div>

        {/* Hint Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-lg text-[#7EC8E3] hover:text-[#5BB8D8] font-medium transition-colors"
          >
            {showHint ? "隱藏提示 👀" : "需要提示？💡"}
          </button>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="text-center p-5 bg-[#F0F9FF] border-2 border-[#A5DBF0] rounded-2xl">
            <p className="text-lg text-[#2D3436] mb-2">
              <span className="font-semibold">粵拼：</span>
              <span className="font-mono text-[#5BB8D8]">{currentQuestion.jyutping}</span>
            </p>
            <p className="text-base text-[#636E72]">
              <span className="font-semibold">意思：</span>{currentQuestion.meanings.join("、")}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <label htmlFor="answer" className="block text-lg font-semibold text-[#2D3436]">
            寫出漢字：
          </label>
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
            className="w-full px-6 py-5 text-5xl text-center border-4 border-[#FFE5B4] 
                     rounded-2xl focus:border-[#FFD93D] focus:ring-4 focus:ring-[#FFD93D]/30
                     focus:outline-none disabled:bg-[#FFF8E7]
                     text-[#2D3436] hanzi-display transition-all
                     min-h-[100px]"
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
              size="xl"
            >
              提交答案 ✓
            </Button>
          </div>
        )}

        {/* Feedback */}
        {submitted && (
          <div
            className={`p-8 rounded-3xl ${
              isCorrect 
                ? "bg-[#F0FFF4] border-3 border-[#98D8AA]" 
                : "bg-[#FFF5F5] border-3 border-[#FF8E8E]"
            }`}
          >
            <div className="text-center space-y-4">
              {isCorrect ? (
                <MascotCelebration type="owl" message="答對了！" />
              ) : (
                <>
                  <div className="text-6xl">😅</div>
                  <div className="text-3xl font-bold text-[#E55555]">不對</div>
                </>
              )}
              
              <div className="space-y-3 text-xl">
                <div>
                  <span className="font-medium text-[#636E72]">你的答案：</span>
                  <span className="text-3xl ml-2 hanzi-display text-[#2D3436]">{userAnswer || "（沒有填）"}</span>
                </div>
                <div>
                  <span className="font-medium text-[#636E72]">正確答案：</span>
                  <span className="text-3xl ml-2 hanzi-display text-[#2D3436]">{currentQuestion.character}</span>
                </div>
                <div className="text-lg text-[#636E72]">
                  <span className="font-medium">粵拼：</span>
                  <span className="font-mono text-[#5BB8D8]">{currentQuestion.jyutping}</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-6">
                {currentIndex < questions.length - 1 ? (
                  <Button onClick={handleNext} variant="sky">
                    下一題 →
                  </Button>
                ) : (
                  <Button onClick={handleRestart} variant="primary">
                    重新開始 🔄
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Score */}
      {submitted && currentIndex === questions.length - 1 && (
        <div className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-8 text-center">
          <h3 className="text-2xl font-bold mb-4 text-[#2D3436]">練習完成！🎉</h3>
          <div className="text-5xl font-bold text-[#FFD93D] mb-3">
            {score.correct} / {score.total}
          </div>
          <p className="text-xl text-[#636E72]">
            {score.correct === score.total ? "完美！全部答對！🌟" :
             score.correct >= score.total * 0.8 ? "很好！繼續努力！👍" :
             score.correct >= score.total * 0.6 ? "不錯！再多練習！💪" :
             "加油！多練習會進步！📚"}
          </p>
        </div>
      )}
    </div>
  );
}

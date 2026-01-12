"use client";

import { useState, useEffect, useCallback } from "react";
import type { Character } from "@/types/character";

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
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600 dark:text-gray-300">正在載入...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-red-600">錯誤：{error}</div>
        <button
          onClick={loadQuestions}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          再試一次
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-300">沒有可用的題目</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress & Score */}
      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
        <span>題目 {currentIndex + 1} / {questions.length}</span>
        <span>得分：{score.correct} / {score.total}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">默書練習</h2>
          <p className="text-gray-600 dark:text-gray-400">
            聽發音，寫出正確的漢字
          </p>
        </div>

        {/* Audio Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => speakCantonese(currentQuestion.character)}
            className="w-full max-w-xs px-8 py-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-xl font-semibold flex items-center justify-center gap-3"
          >
            🔊 聽發音
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">按這裏聽粵語讀音</p>
        </div>

        {/* Hint Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showHint ? "隱藏提示" : "需要提示？"}
          </button>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">粵拼：</span>{currentQuestion.jyutping}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              <span className="font-semibold">意思：</span>{currentQuestion.meanings.join("、")}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            className="w-full px-4 py-4 text-4xl text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white hanzi-display"
            placeholder="在這裏寫"
            maxLength={1}
            autoComplete="off"
          />
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-semibold transition-colors"
            >
              提交答案
            </button>
          </div>
        )}

        {/* Feedback */}
        {submitted && (
          <div
            className={`p-6 rounded-lg ${
              isCorrect 
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
            }`}
          >
            <div className="text-center space-y-4">
              <div className="text-5xl">{isCorrect ? "✓" : "✗"}</div>
              <div className="text-2xl font-semibold">
                {isCorrect ? "答對了！" : "不對"}
              </div>
              <div className="space-y-2 text-lg">
                <div>
                  <span className="font-medium">你的答案：</span>
                  <span className="text-2xl ml-2 hanzi-display">{userAnswer || "（沒有填）"}</span>
                </div>
                <div>
                  <span className="font-medium">正確答案：</span>
                  <span className="text-2xl ml-2 hanzi-display">{currentQuestion.character}</span>
                </div>
                <div className="text-base">
                  <span className="font-medium">粵拼：</span>{currentQuestion.jyutping}
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-6">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    下一題 →
                  </button>
                ) : (
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    重新開始
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Score */}
      {submitted && currentIndex === questions.length - 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">練習完成！</h3>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {score.correct} / {score.total}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {score.correct === score.total ? "完美！全部答對！🎉" :
             score.correct >= score.total * 0.8 ? "很好！繼續努力！👍" :
             score.correct >= score.total * 0.6 ? "不錯！再多練習！💪" :
             "加油！多練習會進步！📚"}
          </p>
        </div>
      )}
    </div>
  );
}

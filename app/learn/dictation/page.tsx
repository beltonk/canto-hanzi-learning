"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import DictationExercise from "@/app/components/learning/DictationExercise";

function DictationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const grade = (searchParams.get("grade") as "KS1" | "KS2") || "KS1";

  const gradeLabels = {
    KS1: "第一學習階段（小一至小三）",
    KS2: "第二學習階段（小四至小六）"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <div className="container mx-auto px-6 py-8 md:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg text-[#FFD93D] hover:text-[#F5C800] 
                     font-medium transition-colors mb-4"
          >
            ← 返回主頁
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🦉</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436]">
              默書練習
            </h1>
          </div>
          <p className="text-xl text-[#636E72]">
            聽粵語讀音，寫出正確的漢字
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-[#2D3436] mb-2">學習階段</label>
          <select
            value={grade}
            onChange={(e) => {
              const newGrade = e.target.value as "KS1" | "KS2";
              router.push(`/learn/dictation?grade=${newGrade}`);
            }}
            className="px-5 py-3 text-lg border-3 border-[#FFE5B4] rounded-2xl 
                     bg-white text-[#2D3436]
                     focus:ring-4 focus:ring-[#FFD93D]/30 focus:border-[#FFD93D]
                     transition-all cursor-pointer min-h-[56px]"
          >
            <option value="KS1">{gradeLabels.KS1}</option>
            <option value="KS2">{gradeLabels.KS2}</option>
          </select>
        </div>

        <DictationExercise grade={grade} />
      </div>
    </div>
  );
}

export default function DictationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🦉</div>
          <div className="text-xl text-[#636E72]">正在載入...</div>
        </div>
      </div>
    }>
      <DictationContent />
    </Suspense>
  );
}

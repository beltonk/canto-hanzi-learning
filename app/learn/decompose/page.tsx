"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import DecompositionPlay from "@/app/components/learning/DecompositionPlay";

function DecomposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || "明";
  const grade = (searchParams.get("grade") as "KS1" | "KS2") || "KS1";

  const gradeLabels = {
    KS1: "第一學習階段（小一至小三）",
    KS2: "第二學習階段（小四至小六）"
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← 返回主頁
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            拆字遊戲
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            將漢字拆開來看，認識它的結構和部件
          </p>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">年級</label>
            <select
              value={grade}
              onChange={(e) => {
                const newGrade = e.target.value as "KS1" | "KS2";
                router.push(`/learn/decompose?char=${char}&grade=${newGrade}`);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="KS1">{gradeLabels.KS1}</option>
              <option value="KS2">{gradeLabels.KS2}</option>
            </select>
          </div>
        </div>

        <DecompositionPlay 
          character={char} 
          grade={grade}
          onCharacterChange={(newChar) => {
            router.push(`/learn/decompose?char=${newChar}&grade=${grade}`);
          }}
        />
      </div>
    </div>
  );
}

export default function DecomposePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">正在載入...</div>
      </div>
    }>
      <DecomposeContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import CharacterExploration from "@/app/components/learning/CharacterExploration";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || "人";
  const grade = (searchParams.get("grade") as "KS1" | "KS2") || "KS1";

  const gradeLabels = {
    KS1: "第一學習階段（小一至小三）",
    KS2: "第二學習階段（小四至小六）"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D9] to-[#FFE5B4]">
      <div className="container mx-auto px-6 py-8 md:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg text-[#FF6B6B] hover:text-[#E55555] 
                     font-medium transition-colors mb-4"
          >
            ← 返回主頁
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🐼</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436]">
              認識漢字
            </h1>
          </div>
          <p className="text-xl text-[#636E72]">
            學習漢字的讀音、意思、部首和例句
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-[#2D3436] mb-2">學習階段</label>
          <select
            value={grade}
            onChange={(e) => {
              const newGrade = e.target.value as "KS1" | "KS2";
              router.push(`/learn/explore?char=${char}&grade=${newGrade}`);
            }}
            className="px-5 py-3 text-lg border-3 border-[#FFE5B4] rounded-2xl 
                     bg-white text-[#2D3436]
                     focus:ring-4 focus:ring-[#FF6B6B]/30 focus:border-[#FF6B6B]
                     transition-all cursor-pointer min-h-[56px]"
          >
            <option value="KS1">{gradeLabels.KS1}</option>
            <option value="KS2">{gradeLabels.KS2}</option>
          </select>
        </div>

        <CharacterExploration 
          character={char} 
          grade={grade}
          onCharacterChange={(newChar) => {
            router.push(`/learn/explore?char=${newChar}&grade=${grade}`);
          }}
        />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D9] to-[#FFE5B4] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🐼</div>
          <div className="text-xl text-[#636E72]">正在載入...</div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}

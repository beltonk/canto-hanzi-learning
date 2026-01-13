"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import CharacterExploration from "@/app/components/learning/CharacterExploration";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-base text-[#FF6B6B] hover:text-[#E55555] font-medium"
            >
              ← 主頁
            </Link>
            <span className="text-[#B2BEC3]">|</span>
            <span className="text-2xl">🐼</span>
            <h1 className="text-xl md:text-2xl font-bold text-[#2D3436]">
              認識漢字
            </h1>
          </div>
          <div className="text-sm text-[#7A8288]">
            《香港小學學習字詞表》收錄字
          </div>
        </div>

        <CharacterExploration 
          character={char}
          onCharacterChange={(newChar) => {
            const params = new URLSearchParams();
            params.set("char", newChar);
            router.push(`/learn/explore?${params.toString()}`);
          }}
        />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-float">🐼</div>
          <div className="text-lg text-[#636E72]">正在載入...</div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense } from "react";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";

function FlashcardContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D9] to-[#FFE5B4]">
      <div className="container mx-auto px-6 py-8 md:py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg text-[#7EC8E3] hover:text-[#5BB8D8] 
                     font-medium transition-colors mb-4"
          >
            ← 返回主頁
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🐰</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436]">
              字卡温習
            </h1>
          </div>
          <p className="text-xl text-[#636E72]">
            隨機字卡，温習漢字讀音和意思
          </p>
        </div>

        <FlashcardRevision />
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D9] to-[#FFE5B4] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🐰</div>
          <div className="text-xl text-[#636E72]">正在載入...</div>
        </div>
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense } from "react";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";

function FlashcardContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Compact Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/"
            className="text-base text-[#FF6B6B] hover:text-[#E55555] font-medium"
          >
            ← 主頁
          </Link>
          <span className="text-[#B2BEC3]">|</span>
          <span className="text-2xl">🐰</span>
          <h1 className="text-xl md:text-2xl font-bold text-[#2D3436]">
            字卡温習
          </h1>
        </div>

        <FlashcardRevision />
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-float">🐰</div>
          <div className="text-lg text-[#636E72]">正在載入...</div>
        </div>
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}

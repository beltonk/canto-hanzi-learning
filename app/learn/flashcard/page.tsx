"use client";

import Link from "next/link";
import { Suspense } from "react";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";

function FlashcardContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← 返回主頁
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            字卡温習
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">正在載入...</div>
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}

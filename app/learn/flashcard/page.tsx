"use client";

import Link from "next/link";
import { Suspense } from "react";
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";
import { useLanguage } from "@/lib/i18n/context";

function FlashcardContent() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)]">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Compact Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/"
            className="text-base text-[var(--color-coral)] hover:text-[var(--color-coral-dark)] font-medium"
          >
            {t("backToHome")}
          </Link>
          <span className="text-[var(--color-gray-light)]">|</span>
          <span className="text-2xl">🐰</span>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-charcoal)]">
            {t("flashcardRevision")}
          </h1>
        </div>

        <FlashcardRevision />
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-float">🐰</div>
        <div className="text-lg text-[var(--color-gray)]">Loading...</div>
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlashcardContent />
    </Suspense>
  );
}

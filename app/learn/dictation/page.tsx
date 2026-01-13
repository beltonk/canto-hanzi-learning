"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import DictationExercise from "@/app/components/learning/DictationExercise";
import { useLanguage } from "@/lib/i18n/context";

function DictationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const grade = (searchParams.get("grade") as "KS1" | "KS2") || "KS1";
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)]">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-base text-[var(--color-coral)] hover:text-[var(--color-coral-dark)] font-medium"
            >
              {t("backToHome")}
            </Link>
            <span className="text-[var(--color-gray-light)]">|</span>
            <span className="text-2xl">🦉</span>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-charcoal)]">
              {t("dictationPractice")}
            </h1>
          </div>
          <select
            value={grade}
            onChange={(e) => {
              const newGrade = e.target.value as "KS1" | "KS2";
              router.push(`/learn/dictation?grade=${newGrade}`);
            }}
            className="px-3 py-2 text-sm border-2 border-[var(--color-peach)] rounded-xl 
                     bg-[var(--card-bg)] text-[var(--color-charcoal)]
                     focus:ring-2 focus:ring-[var(--color-golden)]/30 focus:border-[var(--color-golden)]
                     cursor-pointer"
          >
            <option value="KS1">{t("stage1")}</option>
            <option value="KS2">{t("stage2")}</option>
          </select>
        </div>

        <DictationExercise grade={grade} />
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-float">🦉</div>
        <div className="text-lg text-[var(--color-gray)]">Loading...</div>
      </div>
    </div>
  );
}

export default function DictationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DictationContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import CharacterExploration from "@/app/components/learning/CharacterExploration";
import { useLanguage } from "@/lib/i18n/context";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const char = searchParams.get("char") || undefined;
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
            <span className="text-2xl">🐼</span>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-charcoal)]">
              {t("exploreCharacters")}
            </h1>
          </div>
          <div className="text-sm text-[var(--color-gray)]">
            {t("hkWordList")}
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-float">🐼</div>
        <div className="text-lg text-[var(--color-gray)]">Loading...</div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExploreContent />
    </Suspense>
  );
}

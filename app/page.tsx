"use client";

import { ActivityCard } from "@/app/components/ui/Card";
import LanguageSwitcher from "@/app/components/ui/LanguageSwitcher";
import ThemeSwitcher from "@/app/components/ui/ThemeSwitcher";
import { useLanguage } from "@/lib/i18n/context";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)]">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Settings - Top Right */}
        <div className="flex justify-end items-center gap-2 mb-2">
          <ThemeSwitcher compact />
          <LanguageSwitcher compact />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-charcoal)] mb-2 font-chinese">
            {t("appTitle")}
          </h1>
          <p className="text-base md:text-lg text-[var(--color-gray)]">
            {t("appSubtitle")}
          </p>
        </div>

        {/* Activity Cards - 2x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-6">
          <ActivityCard
            href="/learn/explore"
            mascot="panda"
            character="字"
            title={t("exploreCharacters")}
            colorTheme="coral"
          />

          <ActivityCard
            href="/learn/flashcard"
            mascot="rabbit"
            character="卡"
            title={t("flashcardRevision")}
            colorTheme="sky"
          />

          <ActivityCard
            href="/learn/decompose"
            mascot="monkey"
            character="拆"
            title={t("decompositionGame")}
            colorTheme="mint"
          />

          <ActivityCard
            href="/learn/dictation"
            mascot="owl"
            character="聽"
            title={t("dictationPractice")}
            colorTheme="golden"
          />
        </div>

        {/* How to Start Section - Compact */}
        <div className="max-w-4xl mx-auto bg-[var(--card-bg)] rounded-2xl shadow-[0_4px_20px_var(--card-shadow)] border border-[var(--card-border)] p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-[var(--color-charcoal)] text-center">
            {t("howToStart")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/20">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-coral)] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-charcoal)] flex items-center gap-1">
                  {t("exploreCharacters")} <span className="text-lg">🐼</span>
                </h3>
                <p className="text-sm text-[var(--color-gray)]">
                  {t("exploreDesc")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-sky)]/10 border border-[var(--color-sky)]/20">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-sky)] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-charcoal)] flex items-center gap-1">
                  {t("flashcardRevision")} <span className="text-lg">🐰</span>
                </h3>
                <p className="text-sm text-[var(--color-gray)]">
                  {t("flashcardDesc")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-mint)]/10 border border-[var(--color-mint)]/20">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-mint)] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-charcoal)] flex items-center gap-1">
                  {t("decompositionGame")} <span className="text-lg">🐵</span>
                </h3>
                <p className="text-sm text-[var(--color-gray)]">
                  {t("decomposeDesc")}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/20">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-golden)] rounded-full flex items-center justify-center">
                <span className="text-[#2D3436] text-sm font-bold">4</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-charcoal)] flex items-center gap-1">
                  {t("dictationPractice")} <span className="text-lg">🦉</span>
                </h3>
                <p className="text-sm text-[var(--color-gray)]">
                  {t("dictationDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { ActivityCard } from "@/app/components/ui/Card";
import LanguageSwitcher from "@/app/components/ui/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/context";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher compact />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-2 font-chinese">
            {t("appTitle")}
          </h1>
          <p className="text-base md:text-lg text-[#636E72]">
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
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[#E8E0D8] p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#2D3436] text-center">
            {t("howToStart")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FFF5F5] border border-[#FFE5E5]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-1">
                  {t("exploreCharacters")} <span className="text-lg">🐼</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  {t("exploreDesc")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F0F9FF] border border-[#E0F0FF]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#7EC8E3] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-1">
                  {t("flashcardRevision")} <span className="text-lg">🐰</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  {t("flashcardDesc")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F0FFF4] border border-[#E0FFE8]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#98D8AA] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-1">
                  {t("decompositionGame")} <span className="text-lg">🐵</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  {t("decomposeDesc")}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#FFF3D0]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#FFD93D] rounded-full flex items-center justify-center">
                <span className="text-[#2D3436] text-sm font-bold">4</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-1">
                  {t("dictationPractice")} <span className="text-lg">🦉</span>
                </h3>
                <p className="text-sm text-[#636E72]">
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

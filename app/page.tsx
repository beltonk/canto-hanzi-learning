import { ActivityCard } from "@/app/components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Header - Compact */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-1 font-chinese">
            粵語漢字學習系統
          </h1>
          <p className="text-base md:text-lg text-[#636E72]">
            香港小學中文字學習 · 根據《香港小學學習字詞表》
          </p>
        </div>

        {/* Activity Cards - 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          <ActivityCard
            href="/learn/explore"
            mascot="panda"
            character="字"
            title="認識漢字"
            colorTheme="coral"
          />

          <ActivityCard
            href="/learn/flashcard"
            mascot="rabbit"
            character="卡"
            title="字卡温習"
            colorTheme="sky"
          />

          <ActivityCard
            href="/learn/decompose"
            mascot="monkey"
            character="拆"
            title="拆字遊戲"
            colorTheme="mint"
          />

          <ActivityCard
            href="/learn/dictation"
            mascot="owl"
            character="聽"
            title="默書練習"
            colorTheme="golden"
          />
        </div>

        {/* Quick Help - Compact inline */}
        <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-[#E8E0D8] px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:text-base text-[#636E72]">
              <span className="flex items-center gap-1.5">
                <span className="text-lg">🐼</span> 學讀音意思
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">🐰</span> 隨機温習
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">🐵</span> 拆解部件
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">🦉</span> 聽寫練習
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { ActivityCard } from "@/app/components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFECD2] via-[#FFE4C4] to-[#FFD8B8]">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-2 font-chinese">
            粵語漢字學習系統
          </h1>
          <p className="text-base md:text-lg text-[#636E72]">
            香港小學中文字學習 · 根據《香港小學學習字詞表》
          </p>
        </div>

        {/* Activity Cards - 2x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-6">
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

        {/* How to Start Section - Compact */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[#E8E0D8] p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#2D3436] text-center">
            如何開始？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FFF5F5] border border-[#FFE5E5]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-1">
                  認識漢字 <span className="text-lg">🐼</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  學習漢字的粵語讀音、筆畫、部首、意思和例句
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
                  字卡温習 <span className="text-lg">🐰</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  用隨機字卡温習學過的漢字，可選學習階段和筆劃
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
                  拆字遊戲 <span className="text-lg">🐵</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  將漢字拆開來看，了解它的結構和組成部件
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
                  默書練習 <span className="text-lg">🦉</span>
                </h3>
                <p className="text-sm text-[#636E72]">
                  聽粵語讀音，寫出正確的漢字，測試學習成果
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

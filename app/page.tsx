import { ActivityCard } from "@/app/components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D9] to-[#FFE5B4]">
      <main className="container mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-4 font-chinese">
            粵語漢字學習系統
          </h1>
          <p className="text-xl md:text-2xl text-[#636E72] mb-2">
            香港小學中文字學習
          </p>
          <p className="text-lg text-[#B2BEC3]">
            互動學習繁體字、粵語發音、部首拆解
          </p>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto mb-12 md:mb-16">
          <ActivityCard
            href="/learn/explore"
            mascot="panda"
            character="人"
            title="認識漢字"
            description="學習漢字的讀音、意思、部首和例句"
            colorTheme="coral"
          />

          <ActivityCard
            href="/learn/flashcard"
            mascot="rabbit"
            character="卡"
            title="字卡温習"
            description="隨機字卡，温習漢字讀音和意思"
            colorTheme="sky"
          />

          <ActivityCard
            href="/learn/decompose"
            mascot="monkey"
            character="拆"
            title="拆字遊戲"
            description="將漢字拆開來看，認識它的結構和部件"
            colorTheme="mint"
          />

          <ActivityCard
            href="/learn/dictation"
            mascot="owl"
            character="聽"
            title="默書練習"
            description="聽粵語讀音，寫出正確的漢字"
            colorTheme="golden"
          />
        </div>

        {/* How to Start Section */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#2D3436] text-center">
            如何開始？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFE5E5]">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                  認識漢字 <span className="text-2xl">🐼</span>
                </h3>
                <p className="text-lg text-[#636E72]">
                  選擇一個漢字來學習。你可以看到它的粵語讀音（粵拼）、筆畫數目、部首、意思和例句。
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#F0F9FF] border-2 border-[#E0F0FF]">
              <div className="flex-shrink-0 w-12 h-12 bg-[#7EC8E3] rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                  字卡温習 <span className="text-2xl">🐰</span>
                </h3>
                <p className="text-lg text-[#636E72]">
                  用隨機字卡來温習學過的漢字。可以選擇學習階段和筆劃數目。
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#F0FFF4] border-2 border-[#E0FFE8]">
              <div className="flex-shrink-0 w-12 h-12 bg-[#98D8AA] rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                  拆字遊戲 <span className="text-2xl">🐵</span>
                </h3>
                <p className="text-lg text-[#636E72]">
                  將漢字拆開來看，了解它是怎樣組成的。這可以幫助你記住這個字怎麼寫。
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FFFBEB] border-2 border-[#FFF3D0]">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FFD93D] rounded-full flex items-center justify-center">
                <span className="text-[#2D3436] text-xl font-bold">4</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                  默書練習 <span className="text-2xl">🦉</span>
                </h3>
                <p className="text-lg text-[#636E72]">
                  聽粵語讀音，然後寫出正確的漢字。測試一下你學了多少！
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-[#B2BEC3]">
          <p className="text-base">根據《香港小學學習字詞表》</p>
        </div>
      </main>
    </div>
  );
}

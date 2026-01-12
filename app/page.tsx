import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 font-chinese">
            粵語漢字學習系統
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            香港小學中文字學習
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            互動學習繁體字、粵語發音、部首拆解
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {/* Character Exploration */}
          <Link
            href="/learn/explore"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-6xl mb-4 text-center hanzi-display">人</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              認識漢字
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              學習漢字的讀音、意思、部首和例句
            </p>
          </Link>

          {/* Flashcard Revision */}
          <Link
            href="/learn/flashcard"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-6xl mb-4 text-center hanzi-display">卡</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              字卡温習
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              隨機字卡，温習漢字讀音和意思
            </p>
          </Link>

          {/* Decomposition Play */}
          <Link
            href="/learn/decompose"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-6xl mb-4 text-center hanzi-display">拆</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              拆字遊戲
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              將漢字拆開來看，認識它的結構和部件
            </p>
          </Link>

          {/* Dictation */}
          <Link
            href="/learn/dictation"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-6xl mb-4 text-center hanzi-display">聽</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              默書練習
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              聽粵語讀音，寫出正確的漢字
            </p>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            如何開始？
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                1. 認識漢字
              </h3>
              <p>
                選擇一個漢字來學習。你可以看到它的粵語讀音（粵拼）、筆畫數目、部首、
                意思和例句。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                2. 字卡温習
              </h3>
              <p>
                用隨機字卡來温習學過的漢字。可以選擇學習階段和筆劃數目。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                3. 拆字遊戲
              </h3>
              <p>
                將漢字拆開來看，了解它是怎樣組成的。這可以幫助你記住這個字怎麼寫。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                4. 默書練習
              </h3>
              <p>
                聽粵語讀音，然後寫出正確的漢字。測試一下你學了多少！
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-gray-600 dark:text-gray-400">
          <p className="text-sm">根據《香港小學學習字詞表》</p>
        </div>
      </main>
    </div>
  );
}

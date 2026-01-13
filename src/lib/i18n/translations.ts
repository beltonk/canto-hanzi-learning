/**
 * UI Translations
 * 
 * Supports: Cantonese (zh-HK) and English (en)
 * Default: Cantonese
 */

export type Language = "zh-HK" | "en";

export const translations = {
  "zh-HK": {
    // App
    appTitle: "粵語漢字學習系統",
    appSubtitle: "香港小學中文字學習 · 根據《香港小學學習字詞表》",
    
    // Navigation
    home: "主頁",
    back: "返回",
    backToHome: "← 主頁",
    backToSettings: "← 返回設定",
    
    // Activity titles
    exploreCharacters: "認識漢字",
    flashcardRevision: "字卡温習",
    decompositionGame: "拆字遊戲",
    dictationPractice: "默書練習",
    
    // Activity descriptions
    exploreDesc: "學習漢字的粵語讀音、筆畫、部首、意思和例句",
    flashcardDesc: "用隨機字卡温習學過的漢字，可選學習階段和筆劃",
    decomposeDesc: "將漢字拆開來看，了解它的結構和組成部件",
    dictationDesc: "聽粵語讀音，寫出正確的漢字，測試學習成果",
    
    // How to start
    howToStart: "如何開始？",
    
    // Character exploration
    selectCharacter: "選擇漢字",
    total: "共",
    characters: "字",
    filter: "篩選",
    hideFilter: "收起篩選",
    expandList: "展開列表",
    collapseList: "收起列表",
    expandAll: "展開全部",
    collapse: "收起",
    radical: "部首",
    strokeCount: "筆畫",
    strokeCountLabel: "筆劃數目",
    jyutping: "粵拼",
    all: "全部",
    clear: "清除",
    noResults: "找不到符合條件的漢字",
    scrollHint: "可上下滾動查看更多",
    scrollDown: "向下捲動查看更多",
    clickForAnimation: "點擊顯示筆順動畫",
    hkWordList: "《香港小學學習字詞表》收錄字",
    usingHkWordList: "使用《香港小學學習字詞表》收錄的漢字",
    
    // Character info
    strokes: "筆",
    strokesUnit: "畫",
    listenPronunciation: "聽發音",
    playPronunciation: "播放讀音",
    mandarinPronunciation: "普通話",
    
    // Related words
    commonWords: "常用詞語",
    relatedWords: "相關詞語",
    stage1: "第一學習階段",
    stage2: "第二學習階段",
    stage1Words: "第一學習階段詞語",
    stage2Words: "第二學習階段詞語",
    fourCharPhrases: "四字詞語",
    idioms: "成語",
    classicalPhrases: "文言詞語",
    properNouns: "專有名詞",
    noPhrases: "此分類暫無詞語",
    
    // Stroke animation
    noStrokeData: "暫無筆順資料",
    playing: "播放中",
    stop: "停止",
    showStrokes: "顯示筆順",
    
    // Loading & errors
    loading: "正在載入...",
    loadingData: "載入中...",
    error: "錯誤",
    loadFailed: "載入失敗",
    characterNotFound: "找不到這個字",
    tryAgain: "再試一次",
    noQuestions: "沒有可用的題目",
    
    // Language & Theme
    language: "語言",
    cantonese: "粵語",
    english: "English",
    switchToDark: "切換深色模式",
    switchToLight: "切換淺色模式",
    
    // Flashcard
    flashcardSettings: "字卡設定",
    selectRange: "選擇學習範圍",
    range: "範圍",
    changeRange: "更改範圍",
    cancel: "取消",
    applyAndRestart: "套用並重新開始",
    startRevision: "開始温習",
    keyboardHints: "← → 切換字卡 | 空白鍵播放讀音 | Enter 顯示詳情",
    showDetails: "顯示詞語",
    hideDetails: "隱藏詞語",
    noMatchingChars: "沒有符合條件的漢字，請嘗試其他篩選條件",
    
    // Dictation
    question: "題目",
    score: "得分",
    hint: "提示",
    hideHint: "隱藏",
    submitAnswer: "提交答案",
    correct: "答對了！",
    incorrect: "不對",
    nextQuestion: "下一題",
    playAgain: "再玩",
    perfect: "完美！🌟",
    great: "很好！👍",
    good: "不錯！💪",
    keepGoing: "加油！📚",
    
    // Decomposition
    selectCharacterToPlay: "揀選漢字",
    structure: "結構",
    dropHere: "放到這裏：",
    byComponent: "按部件",
    availableComponents: "可用部件：",
    checkAnswer: "檢查答案",
    correctAnswer: "答對了！",
    tryAgainAnswer: "再試一次",
    correctIs: "正確",
    
    // Mascot
    pandaName: "小熊貓",
    pandaMessage: "一起學習漢字！",
    rabbitName: "小白兔",
    rabbitMessage: "開始字卡練習！",
    monkeyName: "小猴子",
    monkeyMessage: "拆字真有趣！",
    owlName: "貓頭鷹",
    owlMessage: "專心聆聯！",
    wellDone: "做得好！",
    
    // Navigation arrows
    previous: "上一個",
    next: "下一個",
  },
  
  "en": {
    // App
    appTitle: "Cantonese Hanzi Learning",
    appSubtitle: "HK Primary School Chinese · Based on Lexical Lists for Chinese Learning in Hong Kong",
    
    // Navigation
    home: "Home",
    back: "Back",
    backToHome: "← Home",
    backToSettings: "← Back to Settings",
    
    // Activity titles
    exploreCharacters: "Explore Characters",
    flashcardRevision: "Flashcard Revision",
    decompositionGame: "Decomposition Game",
    dictationPractice: "Dictation Practice",
    
    // Activity descriptions
    exploreDesc: "Learn Cantonese pronunciation, strokes, radicals, meanings and examples",
    flashcardDesc: "Review characters with random flashcards, filter by stage and strokes",
    decomposeDesc: "Break down characters to understand their structure and components",
    dictationDesc: "Listen to Cantonese pronunciation and write the correct character",
    
    // How to start
    howToStart: "How to Start?",
    
    // Character exploration
    selectCharacter: "Select Character",
    total: "Total",
    characters: "chars",
    filter: "Filter",
    hideFilter: "Hide Filter",
    expandList: "Expand",
    collapseList: "Collapse",
    expandAll: "Expand All",
    collapse: "Collapse",
    radical: "Radical",
    strokeCount: "Strokes",
    strokeCountLabel: "Stroke Count",
    jyutping: "Jyutping",
    all: "All",
    clear: "Clear",
    noResults: "No characters found",
    scrollHint: "Scroll to see more",
    scrollDown: "Scroll down for more",
    clickForAnimation: "Click to show stroke animation",
    hkWordList: "Characters from Lexical Lists for Chinese Learning in Hong Kong",
    usingHkWordList: "Using characters from Lexical Lists for Chinese Learning in Hong Kong",
    
    // Character info
    strokes: "strokes",
    strokesUnit: "strokes",
    listenPronunciation: "Listen",
    playPronunciation: "Play Sound",
    mandarinPronunciation: "Mandarin",
    
    // Related words
    commonWords: "Common Words",
    relatedWords: "Related Words",
    stage1: "Stage 1",
    stage2: "Stage 2",
    stage1Words: "Stage 1 Words",
    stage2Words: "Stage 2 Words",
    fourCharPhrases: "4-Character Phrases",
    idioms: "Idioms",
    classicalPhrases: "Classical Phrases",
    properNouns: "Proper Nouns",
    noPhrases: "No phrases in this category",
    
    // Stroke animation
    noStrokeData: "No stroke data available",
    playing: "Playing",
    stop: "Stop",
    showStrokes: "Show Strokes",
    
    // Loading & errors
    loading: "Loading...",
    loadingData: "Loading...",
    error: "Error",
    loadFailed: "Failed to load",
    characterNotFound: "Character not found",
    tryAgain: "Try Again",
    noQuestions: "No questions available",
    
    // Language & Theme
    language: "Language",
    cantonese: "粵語",
    english: "English",
    switchToDark: "Switch to dark mode",
    switchToLight: "Switch to light mode",
    
    // Flashcard
    flashcardSettings: "Flashcard Settings",
    selectRange: "Select Range",
    range: "Range",
    changeRange: "Change Range",
    cancel: "Cancel",
    applyAndRestart: "Apply & Restart",
    startRevision: "Start Revision",
    keyboardHints: "← → Switch cards | Space to play sound | Enter for details",
    showDetails: "Show Words",
    hideDetails: "Hide Words",
    noMatchingChars: "No matching characters, try different filters",
    
    // Dictation
    question: "Question",
    score: "Score",
    hint: "Hint",
    hideHint: "Hide",
    submitAnswer: "Submit",
    correct: "Correct!",
    incorrect: "Wrong",
    nextQuestion: "Next",
    playAgain: "Play Again",
    perfect: "Perfect! 🌟",
    great: "Great! 👍",
    good: "Good! 💪",
    keepGoing: "Keep going! 📚",
    
    // Decomposition
    selectCharacterToPlay: "Select Character",
    structure: "Structure",
    dropHere: "Drop here:",
    byComponent: "By component",
    availableComponents: "Available components:",
    checkAnswer: "Check Answer",
    correctAnswer: "Correct!",
    tryAgainAnswer: "Try again",
    correctIs: "Correct answer",
    
    // Mascot
    pandaName: "Panda",
    pandaMessage: "Let's learn Chinese!",
    rabbitName: "Rabbit",
    rabbitMessage: "Start flashcard practice!",
    monkeyName: "Monkey",
    monkeyMessage: "Decomposition is fun!",
    owlName: "Owl",
    owlMessage: "Listen carefully!",
    wellDone: "Well done!",
    
    // Navigation arrows
    previous: "Previous",
    next: "Next",
  },
} as const;

export type TranslationKey = keyof typeof translations["zh-HK"];

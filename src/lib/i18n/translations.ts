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
    radical: "部首",
    strokeCount: "筆畫",
    jyutping: "粵拼",
    all: "全部",
    clear: "清除",
    noResults: "找不到符合條件的漢字",
    scrollHint: "可上下滾動查看更多",
    
    // Character info
    strokes: "筆",
    listenPronunciation: "聽發音",
    mandarinPronunciation: "普通話",
    
    // Related words
    commonWords: "常用詞語",
    stage1Words: "第一學習階段詞語",
    stage2Words: "第二學習階段詞語",
    fourCharPhrases: "四字詞語",
    idioms: "成語",
    classicalPhrases: "文言詞語",
    properNouns: "專有名詞",
    
    // Loading & errors
    loading: "正在載入...",
    error: "錯誤",
    characterNotFound: "找不到這個字",
    
    // Language
    language: "語言",
    cantonese: "粵語",
    english: "English",
  },
  
  "en": {
    // App
    appTitle: "Cantonese Hanzi Learning",
    appSubtitle: "HK Primary School Chinese · Based on HK Primary Word List",
    
    // Navigation
    home: "Home",
    back: "Back",
    
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
    radical: "Radical",
    strokeCount: "Strokes",
    jyutping: "Jyutping",
    all: "All",
    clear: "Clear",
    noResults: "No characters found",
    scrollHint: "Scroll to see more",
    
    // Character info
    strokes: "strokes",
    listenPronunciation: "Listen",
    mandarinPronunciation: "Mandarin",
    
    // Related words
    commonWords: "Common Words",
    stage1Words: "Stage 1 Words",
    stage2Words: "Stage 2 Words",
    fourCharPhrases: "4-Character Phrases",
    idioms: "Idioms",
    classicalPhrases: "Classical Phrases",
    properNouns: "Proper Nouns",
    
    // Loading & errors
    loading: "Loading...",
    error: "Error",
    characterNotFound: "Character not found",
    
    // Language
    language: "Language",
    cantonese: "粵語",
    english: "English",
  },
} as const;

export type TranslationKey = keyof typeof translations["zh-HK"];

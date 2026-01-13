#!/usr/bin/env tsx

/**
 * Generate index files for efficient character and word lookup
 * 
 * Character indexes (no stage field - stage applies to words only):
 * - all.json - All characters
 * - strokes.json - By stroke count (1-32)
 * - radical.json - By radical (organized by radical's stroke count)
 * - lexical-lists-hk.json - Characters in HK Lexical Lists (inLexicalListsHK == true)
 * 
 * Word indexes:
 * - stage.json - Words grouped by learning stage (1 = 第一學習階段, 2 = 第二學習階段)
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================
// Types
// ============================================================

/** Character index entry - no stage field */
interface CharacterIndexEntry {
  key: string;
  id: string;
  character: string;
  radical: string;
  strokeCount: number;
  jyutping: string;
  inLexicalListsHK: boolean;
}

/** Word index entry for stage.json */
interface WordIndexEntry {
  word: string;
  jyutping: string;
  pinyin: string;
  characterId: string;
  character: string;
}

interface CharacterIndexGroup {
  key: string | number;
  entries: CharacterIndexEntry[];
}

interface WordIndexGroup {
  key: string;
  entries: WordIndexEntry[];
}

// ============================================================
// Radical mapping: radical character -> stroke count
// ============================================================

const RADICAL_STROKES: { [radical: string]: number } = {
  // 1 畫
  '一': 1, '丨': 1, '丶': 1, '丿': 1, '乙': 1, '亅': 1,
  // 2 畫
  '二': 2, '亠': 2, '人': 2, '儿': 2, '入': 2, '八': 2, '冂': 2, '冖': 2, '冫': 2, '几': 2, '凵': 2, '刀': 2, '力': 2, '勹': 2, '匕': 2, '匸': 2, '匚': 2, '十': 2, '卜': 2, '卩': 2, '厂': 2, '厶': 2, '又': 2,
  // 3 畫
  '口': 3, '囗': 3, '土': 3, '士': 3, '夂': 3, '夕': 3, '大': 3, '女': 3, '子': 3, '宀': 3, '寸': 3, '小': 3, '尢': 3, '尸': 3, '屮': 3, '山': 3, '巛': 3, '工': 3, '己': 3, '巾': 3, '干': 3, '幺': 3, '广': 3, '廴': 3, '廾': 3, '弋': 3, '弓': 3, '彐': 3, '彡': 3, '彳': 3,
  // 4 畫
  '心': 4, '戈': 4, '户': 4, '手': 4, '支': 4, '攴': 4, '文': 4, '斗': 4, '斤': 4, '方': 4, '无': 4, '日': 4, '曰': 4, '月': 4, '木': 4, '欠': 4, '止': 4, '歹': 4, '殳': 4, '毋': 4, '比': 4, '毛': 4, '氏': 4, '气': 4, '水': 4, '火': 4, '爪': 4, '父': 4, '爻': 4, '爿': 4, '片': 4, '牙': 4, '牛': 4, '犬': 4,
  // 5 畫
  '玄': 5, '玉': 5, '瓜': 5, '瓦': 5, '甘': 5, '生': 5, '用': 5, '田': 5, '疋': 5, '疒': 5, '癶': 5, '白': 5, '皮': 5, '皿': 5, '目': 5, '矛': 5, '矢': 5, '石': 5, '示': 5, '禸': 5, '禾': 5, '穴': 5, '立': 5,
  // 6 畫
  '竹': 6, '米': 6, '糸': 6, '缶': 6, '网': 6, '羊': 6, '羽': 6, '老': 6, '而': 6, '耒': 6, '耳': 6, '聿': 6, '肉': 6, '臣': 6, '自': 6, '至': 6, '臼': 6, '舌': 6, '舛': 6, '舟': 6, '艮': 6, '色': 6, '艸': 6, '虍': 6, '虫': 6, '血': 6, '行': 6, '衣': 6, '襾': 6,
  // 7 畫
  '見': 7, '角': 7, '言': 7, '谷': 7, '豆': 7, '豕': 7, '豸': 7, '貝': 7, '赤': 7, '走': 7, '足': 7, '身': 7, '車': 7, '辛': 7, '辰': 7, '辵': 7, '邑': 7, '酉': 7, '釆': 7, '里': 7,
  // 8 畫
  '金': 8, '長': 8, '門': 8, '阜': 8, '隶': 8, '隹': 8, '雨': 8, '青': 8, '非': 8,
  // 9 畫
  '面': 9, '革': 9, '韋': 9, '韭': 9, '音': 9, '頁': 9, '風': 9, '飛': 9, '食': 9, '首': 9, '香': 9,
  // 10 畫
  '馬': 10, '骨': 10, '高': 10, '髟': 10, '鬥': 10, '鬯': 10, '鬼': 10,
  // 11 畫
  '魚': 11, '鳥': 11, '鹵': 11, '鹿': 11, '麥': 11, '麻': 11,
  // 12 畫
  '黃': 12, '黍': 12, '黑': 12,
  // 13 畫
  '黽': 13, '鼎': 13, '鼓': 13, '鼠': 13,
  // 14 畫
  '鼻': 14, '齊': 14,
  // 15 畫
  '齒': 15,
  // 16 畫
  '龍': 16,
  // 18 畫
  '龜': 18,
};

function getRadicalStrokeCount(radical: string): number {
  return RADICAL_STROKES[radical] || 0;
}

// ============================================================
// Data loading
// ============================================================

interface Word {
  word: string;
  jyutping?: string;
  pinyin?: string;
  stage?: string;
}

interface LoadedCharacter {
  id: string;
  character: string;
  radical?: string;
  strokeCount?: number;
  jyutping?: string;
  inLexicalListsHK: boolean;
  stage1Words?: Word[];
  stage2Words?: Word[];
}

function loadAllCharacters(): LoadedCharacter[] {
  const charactersDir = join(process.cwd(), 'data', 'characters');
  const files = readdirSync(charactersDir).filter(f => f.endsWith('.json')).sort();
  
  const characters: LoadedCharacter[] = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(join(charactersDir, file), 'utf-8');
      const data = JSON.parse(content);
      characters.push({
        id: data.id,
        character: data.character || data.word,
        radical: data.radical,
        strokeCount: data.strokeCount || data.strokes,
        jyutping: data.jyutping,
        inLexicalListsHK: data.inLexicalListsHK === true,
        stage1Words: data.stage1Words,
        stage2Words: data.stage2Words,
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }
  
  return characters;
}

// ============================================================
// Character index generators (no stage field)
// ============================================================

function toCharacterEntry(char: LoadedCharacter): CharacterIndexEntry {
  return {
    key: char.id,
    id: char.id,
    character: char.character,
    radical: char.radical || '',
    strokeCount: char.strokeCount || 0,
    jyutping: char.jyutping || '',
    inLexicalListsHK: char.inLexicalListsHK,
  };
}

function generateAllCharactersIndex(characters: LoadedCharacter[]): CharacterIndexEntry[] {
  return characters
    .map(toCharacterEntry)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function generateLexicalListsHKIndex(characters: LoadedCharacter[]): CharacterIndexEntry[] {
  return characters
    .filter(char => char.inLexicalListsHK)
    .map(toCharacterEntry)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function generateStrokeIndex(characters: LoadedCharacter[]): CharacterIndexGroup[] {
  const byStrokes: { [strokes: number]: CharacterIndexEntry[] } = {};
  
  characters.forEach(char => {
    const strokes = char.strokeCount || 0;
    if (strokes > 0 && strokes <= 32) {
      if (!byStrokes[strokes]) {
        byStrokes[strokes] = [];
      }
      const entry = toCharacterEntry(char);
      entry.key = String(strokes);
      byStrokes[strokes].push(entry);
    }
  });
  
  const indexes: CharacterIndexGroup[] = [];
  for (let strokes = 1; strokes <= 32; strokes++) {
    if (byStrokes[strokes]) {
      indexes.push({
        key: strokes,
        entries: byStrokes[strokes].sort((a, b) => a.id.localeCompare(b.id)),
      });
    }
  }
  
  return indexes;
}

function generateRadicalIndex(characters: LoadedCharacter[]): CharacterIndexGroup[] {
  const byRadical: { [radical: string]: CharacterIndexEntry[] } = {};
  
  characters.forEach(char => {
    if (char.radical) {
      if (!byRadical[char.radical]) {
        byRadical[char.radical] = [];
      }
      const entry = toCharacterEntry(char);
      entry.key = char.radical;
      byRadical[char.radical].push(entry);
    }
  });
  
  // Group by radical stroke count
  const byRadicalStrokes: { [strokeCount: number]: { radical: string; entries: CharacterIndexEntry[] }[] } = {};
  
  Object.keys(byRadical).forEach(radical => {
    const radicalStrokes = getRadicalStrokeCount(radical);
    if (!byRadicalStrokes[radicalStrokes]) {
      byRadicalStrokes[radicalStrokes] = [];
    }
    byRadicalStrokes[radicalStrokes].push({
      radical,
      entries: byRadical[radical].sort((a, b) => a.id.localeCompare(b.id)),
    });
  });
  
  // Sort radicals within each stroke count group
  Object.keys(byRadicalStrokes).forEach(strokeCount => {
    byRadicalStrokes[parseInt(strokeCount, 10)].sort((a, b) => {
      const aStrokes = getRadicalStrokeCount(a.radical);
      const bStrokes = getRadicalStrokeCount(b.radical);
      if (aStrokes !== bStrokes) return aStrokes - bStrokes;
      return a.radical.localeCompare(b.radical);
    });
  });
  
  // Create merged index
  const indexes: CharacterIndexGroup[] = [];
  for (let strokeCount = 0; strokeCount <= 18; strokeCount++) {
    if (byRadicalStrokes[strokeCount]) {
      byRadicalStrokes[strokeCount].forEach(({ radical, entries }) => {
        indexes.push({
          key: radical,
          entries,
        });
      });
    }
  }
  
  return indexes;
}

// ============================================================
// Word index generator (stage.json - words by learning stage)
// ============================================================

function generateWordStageIndex(characters: LoadedCharacter[]): WordIndexGroup[] {
  const stage1Words: WordIndexEntry[] = [];
  const stage2Words: WordIndexEntry[] = [];
  
  // Track unique words to avoid duplicates
  const stage1Set = new Set<string>();
  const stage2Set = new Set<string>();
  
  characters.forEach(char => {
    // Stage 1 words
    if (char.stage1Words && char.stage1Words.length > 0) {
      char.stage1Words.forEach(w => {
        if (!stage1Set.has(w.word)) {
          stage1Set.add(w.word);
          stage1Words.push({
            word: w.word,
            jyutping: w.jyutping || '',
            pinyin: w.pinyin || '',
            characterId: char.id,
            character: char.character,
          });
        }
      });
    }
    
    // Stage 2 words
    if (char.stage2Words && char.stage2Words.length > 0) {
      char.stage2Words.forEach(w => {
        if (!stage2Set.has(w.word)) {
          stage2Set.add(w.word);
          stage2Words.push({
            word: w.word,
            jyutping: w.jyutping || '',
            pinyin: w.pinyin || '',
            characterId: char.id,
            character: char.character,
          });
        }
      });
    }
  });
  
  // Sort words alphabetically by word
  stage1Words.sort((a, b) => a.word.localeCompare(b.word, 'zh-Hant'));
  stage2Words.sort((a, b) => a.word.localeCompare(b.word, 'zh-Hant'));
  
  return [
    { key: '1', entries: stage1Words },
    { key: '2', entries: stage2Words },
  ];
}

// ============================================================
// Main
// ============================================================

function main() {
  console.log('Loading all characters...');
  const characters = loadAllCharacters();
  console.log(`Loaded ${characters.length} characters`);
  
  const indexesDir = join(process.cwd(), 'data', 'indexes');
  
  // Create indexes directory
  mkdirSync(indexesDir, { recursive: true });
  
  // --------------------------------------------------------
  // CHARACTER INDEXES (no stage field)
  // --------------------------------------------------------
  
  // 1. All characters index
  console.log('\nGenerating all characters index...');
  const allCharactersIndex = generateAllCharactersIndex(characters);
  writeFileSync(
    join(indexesDir, 'all.json'),
    JSON.stringify({ entries: allCharactersIndex }, null, 2),
    'utf-8'
  );
  console.log(`  ✓ all.json: ${allCharactersIndex.length} characters`);
  
  // 2. Lexical Lists HK index
  console.log('\nGenerating lexical-lists-hk index...');
  const lexicalListsHKIndex = generateLexicalListsHKIndex(characters);
  writeFileSync(
    join(indexesDir, 'lexical-lists-hk.json'),
    JSON.stringify({ entries: lexicalListsHKIndex }, null, 2),
    'utf-8'
  );
  console.log(`  ✓ lexical-lists-hk.json: ${lexicalListsHKIndex.length} characters`);
  
  // 3. Stroke index
  console.log('\nGenerating stroke index...');
  const strokeIndexes = generateStrokeIndex(characters);
  writeFileSync(
    join(indexesDir, 'strokes.json'),
    JSON.stringify({ groups: strokeIndexes }, null, 2),
    'utf-8'
  );
  console.log(`  ✓ strokes.json: ${strokeIndexes.length} stroke groups`);
  
  // 4. Radical index
  console.log('\nGenerating radical index...');
  const radicalIndexes = generateRadicalIndex(characters);
  writeFileSync(
    join(indexesDir, 'radical.json'),
    JSON.stringify({ groups: radicalIndexes }, null, 2),
    'utf-8'
  );
  
  // Radical summary
  const byRadicalStrokes: { [strokeCount: number]: number } = {};
  radicalIndexes.forEach(index => {
    const radicalStrokes = getRadicalStrokeCount(index.key as string);
    byRadicalStrokes[radicalStrokes] = (byRadicalStrokes[radicalStrokes] || 0) + 1;
  });
  
  console.log('\nRadical indexes by stroke count:');
  for (let strokeCount = 0; strokeCount <= 18; strokeCount++) {
    if (byRadicalStrokes[strokeCount]) {
      console.log(`  ${strokeCount} 畫: ${byRadicalStrokes[strokeCount]} radicals`);
    }
  }
  console.log(`  ✓ radical.json: ${radicalIndexes.length} radical groups`);
  
  // --------------------------------------------------------
  // WORD INDEX (stage.json - words by learning stage)
  // --------------------------------------------------------
  
  console.log('\nGenerating word stage index...');
  const wordStageIndexes = generateWordStageIndex(characters);
  writeFileSync(
    join(indexesDir, 'stage.json'),
    JSON.stringify({ groups: wordStageIndexes }, null, 2),
    'utf-8'
  );
  console.log(`  ✓ stage.json: ${wordStageIndexes[0].entries.length} stage 1 words, ${wordStageIndexes[1].entries.length} stage 2 words`);
  
  // --------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------
  
  console.log('\nGenerating summary...');
  
  const summary = {
    // Character counts
    totalCharacters: characters.length,
    lexicalListsHKCount: lexicalListsHKIndex.length,
    
    // Word counts by stage
    stage1WordCount: wordStageIndexes[0].entries.length,
    stage2WordCount: wordStageIndexes[1].entries.length,
    
    // Stroke distribution
    strokeCounts: strokeIndexes.map(idx => ({
      strokes: idx.key,
      count: idx.entries.length,
    })),
    
    // Radical distribution
    radicalCounts: Object.keys(byRadicalStrokes).map(strokes => ({
      strokes: parseInt(strokes, 10),
      radicalCount: byRadicalStrokes[parseInt(strokes, 10)],
    })).sort((a, b) => a.strokes - b.strokes),
  };
  
  writeFileSync(
    join(indexesDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  console.log(`  ✓ summary.json`);
  
  console.log(`\n✅ All indexes written to: ${indexesDir}`);
  console.log('\nIndex files:');
  console.log('  - all.json (all characters)');
  console.log('  - lexical-lists-hk.json (HK lexical list characters)');
  console.log('  - strokes.json (by stroke count)');
  console.log('  - radical.json (by radical)');
  console.log('  - stage.json (words by learning stage)');
  console.log('  - summary.json (statistics)');
}

main();

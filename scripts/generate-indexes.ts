#!/usr/bin/env tsx

/**
 * Generate index files for efficient character lookup
 * - By learning stage (1/2) - merged into stage.json
 * - By stroke count (1-32) - merged into strokes.json
 * - By radical (organized by radical's stroke count) - merged into radical.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface CharacterEntry {
  key: string | number;
  id: string;
  character: string;
  radical?: string;
  strokeCount?: number;
  jyutping?: string;
  stage?: '1' | '2' | 'both';  // 1 = stage 1 only, 2 = stage 2 only, both = both stages
  inLexicalListsHK: boolean;
}

interface IndexGroup {
  key: string | number;
  entries: CharacterEntry[];
}

// Radical mapping: radical character -> stroke count of the radical
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

interface LoadedCharacter {
  id: string;
  character: string;
  radical?: string;
  strokeCount?: number;
  jyutping?: string;
  inLexicalListsHK: boolean;
  stage1Words?: any[];
  stage2Words?: any[];
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

// Helper to determine stage for a character
function getStage(char: LoadedCharacter): '1' | '2' | 'both' | undefined {
  const hasStage1 = char.stage1Words && char.stage1Words.length > 0;
  const hasStage2 = char.stage2Words && char.stage2Words.length > 0;
  
  if (hasStage1 && hasStage2) return 'both';
  if (hasStage1) return '1';
  if (hasStage2) return '2';
  return undefined;
}

function generateStageIndex(characters: LoadedCharacter[]): IndexGroup[] {
  const stage1: CharacterEntry[] = [];
  const stage2: CharacterEntry[] = [];
  
  characters.forEach(char => {
    const hasStage1 = char.stage1Words && char.stage1Words.length > 0;
    const hasStage2 = char.stage2Words && char.stage2Words.length > 0;
    const stage = getStage(char);
    
    if (hasStage1) {
      stage1.push({
        key: '1',
        id: char.id,
        character: char.character,
        radical: char.radical,
        strokeCount: char.strokeCount,
        jyutping: char.jyutping,
        stage: stage,
        inLexicalListsHK: char.inLexicalListsHK,
      });
    }
    
    if (hasStage2) {
      stage2.push({
        key: '2',
        id: char.id,
        character: char.character,
        radical: char.radical,
        strokeCount: char.strokeCount,
        jyutping: char.jyutping,
        stage: stage,
        inLexicalListsHK: char.inLexicalListsHK,
      });
    }
  });
  
  return [
    { key: '1', entries: stage1.sort((a, b) => a.id.localeCompare(b.id)) },
    { key: '2', entries: stage2.sort((a, b) => a.id.localeCompare(b.id)) },
  ];
}

function generateStrokeIndex(characters: LoadedCharacter[]): IndexGroup[] {
  const byStrokes: { [strokes: number]: CharacterEntry[] } = {};
  
  characters.forEach(char => {
    const strokes = char.strokeCount || 0;
    if (strokes > 0 && strokes <= 32) {
      if (!byStrokes[strokes]) {
        byStrokes[strokes] = [];
      }
      byStrokes[strokes].push({
        key: strokes,
        id: char.id,
        character: char.character,
        radical: char.radical,
        strokeCount: char.strokeCount,
        jyutping: char.jyutping,
        stage: getStage(char),
        inLexicalListsHK: char.inLexicalListsHK,
      });
    }
  });
  
  const indexes: IndexGroup[] = [];
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

function generateRadicalIndex(characters: LoadedCharacter[]): IndexGroup[] {
  const byRadical: { [radical: string]: CharacterEntry[] } = {};
  
  characters.forEach(char => {
    if (char.radical) {
      if (!byRadical[char.radical]) {
        byRadical[char.radical] = [];
      }
      byRadical[char.radical].push({
        key: char.radical,
        id: char.id,
        character: char.character,
        radical: char.radical,
        strokeCount: char.strokeCount,
        jyutping: char.jyutping,
        stage: getStage(char),
        inLexicalListsHK: char.inLexicalListsHK,
      });
    }
  });
  
  // Group by radical stroke count, then sort radicals within each group
  const byRadicalStrokes: { [strokeCount: number]: { radical: string; entries: CharacterEntry[] }[] } = {};
  
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
      // Sort by radical stroke count first, then by radical character
      const aStrokes = getRadicalStrokeCount(a.radical);
      const bStrokes = getRadicalStrokeCount(b.radical);
      if (aStrokes !== bStrokes) return aStrokes - bStrokes;
      return a.radical.localeCompare(b.radical);
    });
  });
  
  // Create merged index - all radicals in one file, grouped by radical stroke count
  const indexes: IndexGroup[] = [];
  for (let strokeCount = 1; strokeCount <= 18; strokeCount++) {
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

function generateAllCharactersIndex(characters: LoadedCharacter[]): CharacterEntry[] {
  return characters.map(char => ({
    key: char.id,
    id: char.id,
    character: char.character,
    radical: char.radical,
    strokeCount: char.strokeCount,
    jyutping: char.jyutping,
    stage: getStage(char),
    inLexicalListsHK: char.inLexicalListsHK,
  })).sort((a, b) => a.id.localeCompare(b.id));
}

function main() {
  console.log('Loading all characters...');
  const characters = loadAllCharacters();
  console.log(`Loaded ${characters.length} characters`);
  
  const indexesDir = join(process.cwd(), 'data', 'indexes');
  
  // Create indexes directory if it doesn't exist
  try {
    require('fs').mkdirSync(indexesDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
  
  // Generate stage index (merged into one file)
  console.log('\nGenerating stage index...');
  const stageIndexes = generateStageIndex(characters);
  const stageFile = {
    groups: stageIndexes,
  };
  writeFileSync(join(indexesDir, 'stage.json'), JSON.stringify(stageFile, null, 2), 'utf-8');
  console.log(`  ✓ stage.json: ${stageIndexes[0].entries.length} stage 1, ${stageIndexes[1].entries.length} stage 2`);
  
  // Generate stroke index (merged into one file)
  console.log('\nGenerating stroke index...');
  const strokeIndexes = generateStrokeIndex(characters);
  const strokeFile = {
    groups: strokeIndexes,
  };
  writeFileSync(join(indexesDir, 'strokes.json'), JSON.stringify(strokeFile, null, 2), 'utf-8');
  console.log(`  ✓ strokes.json: ${strokeIndexes.length} stroke groups`);
  
  // Generate radical index (merged into one file)
  console.log('\nGenerating radical index...');
  const radicalIndexes = generateRadicalIndex(characters);
  const radicalFile = {
    groups: radicalIndexes,
  };
  writeFileSync(join(indexesDir, 'radical.json'), JSON.stringify(radicalFile, null, 2), 'utf-8');
  
  // Group by radical stroke count for summary
  const byRadicalStrokes: { [strokeCount: number]: number } = {};
  radicalIndexes.forEach(index => {
    const radicalStrokes = getRadicalStrokeCount(index.key as string);
    byRadicalStrokes[radicalStrokes] = (byRadicalStrokes[radicalStrokes] || 0) + 1;
  });
  
  console.log('\nRadical indexes by stroke count:');
  for (let strokeCount = 1; strokeCount <= 18; strokeCount++) {
    if (byRadicalStrokes[strokeCount]) {
      console.log(`  ${strokeCount} 畫: ${byRadicalStrokes[strokeCount]} radicals`);
    }
  }
  
  console.log(`\n✓ radical.json: ${radicalIndexes.length} radical groups`);
  
  // Generate all characters index (flat, no grouping)
  console.log('\nGenerating all characters index...');
  const allCharactersIndex = generateAllCharactersIndex(characters);
  const allFile = {
    entries: allCharactersIndex,
  };
  writeFileSync(join(indexesDir, 'all.json'), JSON.stringify(allFile, null, 2), 'utf-8');
  console.log(`  ✓ all.json: ${allCharactersIndex.length} characters`);
  
  console.log(`\nAll indexes written to: ${indexesDir}`);
  
  // Calculate lexicalListsHKCount
  const lexicalListsHKCount = characters.filter(c => c.inLexicalListsHK).length;
  
  // Generate summary
  const summary = {
    totalCharacters: characters.length,
    lexicalListsHKCount: lexicalListsHKCount,
    stage1Count: stageIndexes[0].entries.length,
    stage2Count: stageIndexes[1].entries.length,
    strokeCounts: strokeIndexes.map(idx => ({
      strokes: idx.key,
      count: idx.entries.length,
    })),
    radicalCounts: Object.keys(byRadicalStrokes).map(strokes => ({
      strokes: parseInt(strokes, 10),
      radicalCount: byRadicalStrokes[parseInt(strokes, 10)],
    })).sort((a, b) => a.strokes - b.strokes),
  };
  
  writeFileSync(join(indexesDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n✓ Generated summary.json (lexicalListsHKCount: ${lexicalListsHKCount})`);
}

main();

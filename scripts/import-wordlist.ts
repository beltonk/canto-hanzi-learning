#!/usr/bin/env npx ts-node

/**
 * 香港小學學習字詞表 數據導入工具
 * HK Primary School Word List Data Import Tool
 * 
 * Usage:
 *   npx ts-node scripts/import-wordlist.ts --csv wordlist.csv
 *   npx ts-node scripts/import-wordlist.ts --json wordlist.json
 * 
 * CSV Format:
 *   character,grade,radical,strokeCount,jyutping,meanings,tags
 *   人,P1,人,2,jan4,人類;人物,基礎;人物
 * 
 * JSON Format:
 *   [{ "character": "人", "grade": "P1", ... }]
 */

import * as fs from 'fs';
import * as path from 'path';

interface CharacterEntry {
  character: string;
  grade: string;
  radical: string;
  strokeCount: number;
  jyutping: string;
  meanings: string[];
  tags: string[];
}

interface DatabaseFormat {
  characters: CharacterEntry[];
  decompositions: { character: string; components: string[]; structureType: string }[];
  examples: { character: string; sentence: string; jyutping: string }[];
}

function parseCSV(content: string): CharacterEntry[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      character: values[0],
      grade: values[1],
      radical: values[2],
      strokeCount: parseInt(values[3], 10),
      jyutping: values[4],
      meanings: values[5] ? values[5].split(';') : [],
      tags: values[6] ? values[6].split(';') : []
    };
  });
}

function parseJSON(content: string): CharacterEntry[] {
  const data = JSON.parse(content);
  return Array.isArray(data) ? data : data.characters || [];
}

function mergeData(existing: DatabaseFormat, newEntries: CharacterEntry[]): DatabaseFormat {
  const existingChars = new Set(existing.characters.map(c => c.character));
  
  const newChars = newEntries.filter(c => !existingChars.has(c.character));
  
  console.log(`現有字符: ${existing.characters.length}`);
  console.log(`導入字符: ${newEntries.length}`);
  console.log(`新增字符: ${newChars.length}`);
  console.log(`重複字符: ${newEntries.length - newChars.length} (已跳過)`);
  
  return {
    characters: [...existing.characters, ...newChars],
    decompositions: existing.decompositions,
    examples: existing.examples
  };
}

function main() {
  const args = process.argv.slice(2);
  
  let inputFile: string | null = null;
  let format: 'csv' | 'json' | null = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && args[i + 1]) {
      inputFile = args[i + 1];
      format = 'csv';
      i++;
    } else if (args[i] === '--json' && args[i + 1]) {
      inputFile = args[i + 1];
      format = 'json';
      i++;
    }
  }
  
  if (!inputFile || !format) {
    console.log(`
香港小學學習字詞表 數據導入工具
================================

用法:
  npx ts-node scripts/import-wordlist.ts --csv <file.csv>
  npx ts-node scripts/import-wordlist.ts --json <file.json>

CSV 格式:
  character,grade,radical,strokeCount,jyutping,meanings,tags
  人,KS1,人,2,jan4,人類;人物,基礎;人物
  春,KS2,日,9,ceon1,春天;春季,季節;自然

JSON 格式:
  [
    {
      "character": "人",
      "grade": "KS1",
      "radical": "人",
      "strokeCount": 2,
      "jyutping": "jan4",
      "meanings": ["人類", "人物"],
      "tags": ["基礎", "人物"]
    }
  ]

學習階段 (Learning Stages):
  KS1 (第一學習階段 小一至小三): 2,169 字
  KS2 (第二學習階段 小四至小六): 1,002 字
  總計: 3,171 字
`);
    process.exit(1);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error(`錯誤: 找不到檔案 ${inputFile}`);
    process.exit(1);
  }
  
  const dataDir = path.join(__dirname, '..', 'data');
  const dbPath = path.join(dataDir, 'characters.json');
  
  // Load existing data
  let existing: DatabaseFormat = {
    characters: [],
    decompositions: [],
    examples: []
  };
  
  if (fs.existsSync(dbPath)) {
    existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  // Parse input file
  const content = fs.readFileSync(inputFile, 'utf-8');
  const newEntries = format === 'csv' ? parseCSV(content) : parseJSON(content);
  
  // Merge data
  const merged = mergeData(existing, newEntries);
  
  // Write output
  fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8');
  
  // Print statistics
  const stats: Record<string, number> = {};
  merged.characters.forEach(c => {
    stats[c.grade] = (stats[c.grade] || 0) + 1;
  });
  
  console.log('\n=== 更新後統計 ===');
  console.log(`總字符數: ${merged.characters.length}`);
  Object.keys(stats).sort().forEach(grade => {
    console.log(`  ${grade}: ${stats[grade]} 字`);
  });
  
  const coverage = ((merged.characters.length / 3171) * 100).toFixed(1);
  console.log(`\n官方字詞表覆蓋率: ${coverage}%`);
  console.log(`\n✅ 數據已保存到 ${dbPath}`);
}

main();

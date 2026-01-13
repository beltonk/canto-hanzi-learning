#!/usr/bin/env tsx

/**
 * EDB Chinese Dictionary Crawler (JSON Output)
 * 
 * Re-crawls data from edbchinese.hk for characters in data/characters/
 * Extracts comprehensive data including: radical, strokes, pronunciations, 
 * stroke order images, word lists, four-character phrases, classical phrases,
 * idioms, proper nouns, and transliterated foreign words
 * 
 * Usage:
 *   npm run crawl:edbchinese [-- --limit N] [-- --start N]
 *   tsx scripts/crawl-edbchinese-json.ts [--limit N] [--start N] [--output-dir path]
 * 
 * The script loads character IDs from existing data/characters/*.json files
 * and re-fetches their data from edbchinese.hk
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import * as cheerio from 'cheerio';

interface WordEntry {
  word: string;
  id: string;
}

interface WordPhrase {
  word: string;
  jyutping?: string;
  pinyin?: string;
  stage?: '1' | '2';
}

interface TransliteratedWord {
  word: string;
  jyutping?: string;
  pinyin?: string;
  foreignWord?: string;
}

interface StrokeVector {
  strokeNumber: number;
  segment: number; // Segment number within the stroke (1, 2, 3, etc.)
  frame: number;
  pathData: string;
  transform: { x: number; y: number };
  color: string;
}

interface ExtractedData {
  id: string;
  word: string;
  sourceUrl: string;
  radical?: string;
  strokes?: number;
  jyutping?: string;
  pinyin?: string;
  strokeOrderImages: string[];
  strokeVectors?: StrokeVector[];
  inLexicalListsHK: boolean;
  stage1Words: WordPhrase[];
  stage2Words: WordPhrase[];
  fourCharacterPhrases: WordPhrase[];
  classicalPhrases: WordPhrase[];
  multiCharacterIdioms: WordPhrase[];
  properNouns: WordPhrase[];
  transliteratedWords: TransliteratedWord[];
}

// Parse command line arguments
const args = process.argv.slice(2);
let limit: number | null = null;
let start: number = 0;
let outputDir: string = 'data/characters';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--start' && args[i + 1]) {
    start = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  }
}

// Load word list from existing data/characters/ files
// Each file is named {id}.json and contains the character data
function loadWordListFromExistingData(): WordEntry[] {
  const charactersDir = join(process.cwd(), 'data', 'characters');
  
  const files = readdirSync(charactersDir)
    .filter((f: string) => f.endsWith('.json'))
    .sort();
  
  return files.map((file: string) => {
    const id = file.replace('.json', '');
    const content = JSON.parse(readFileSync(join(charactersDir, file), 'utf-8'));
    return {
      id,
      word: content.character || content.word || id,
    };
  });
}

const words: WordEntry[] = loadWordListFromExistingData();
console.log(`Loaded ${words.length} characters from existing data`);

// Helper function to delay requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract stroke vector graphics from JavaScript animation file
function extractStrokeVectors(jsContent: string, canvasWidth: number = 0, canvasHeight: number = 0): StrokeVector[] {
  const strokes: StrokeVector[] = [];
  
  // Extract canvas dimensions from JS if not provided
  if (canvasWidth === 0 || canvasHeight === 0) {
    const widthMatch = jsContent.match(/width:\s*(\d+)/);
    const heightMatch = jsContent.match(/height:\s*(\d+)/);
    if (widthMatch) canvasWidth = parseInt(widthMatch[1], 10);
    if (heightMatch) canvasHeight = parseInt(heightMatch[1], 10);
    // Default to 1080x1080 if not found (common for these animations)
    if (canvasWidth === 0) canvasWidth = 1080;
    if (canvasHeight === 0) canvasHeight = 1080;
  }
  
  // Extract stroke numbers and frame timings from text timeline
  // Pattern: wait(24).to({text:"2"}).wait(24).to({text:"3"})
  const textTimelineMatch = jsContent.match(/this\.text.*?\.addTween\([^)]+\)/s);
  const strokeTextFrames: { stroke: number; frame: number }[] = [];
  
  if (textTimelineMatch) {
    const timelineText = textTimelineMatch[0];
    
    // Extract frame numbers where text changes (indicating stroke numbers)
    const waitMatches = Array.from(timelineText.matchAll(/wait\((\d+)\)/g));
    const textMatches = Array.from(timelineText.matchAll(/to\(\{text:"(\d+)"\}/g));
    
    const waits: number[] = [];
    for (const match of waitMatches) {
      waits.push(parseInt(match[1], 10));
    }
    
    const textNumbers: number[] = [];
    for (const match of textMatches) {
      textNumbers.push(parseInt(match[1], 10));
    }
    
    // Calculate frame positions where each stroke number is shown
    // Text timeline: wait(24).to({_off:false},0).wait(24).to({text:"2"},0).wait(24).to({text:"3"},0)
    // The text appears at frame 0 (after first wait(24) and to({_off:false},0))
    // Then it changes to "2" at frame 24 (after second wait(24))
    // Then it changes to "3" at frame 48 (after third wait(24))
    let frame = 0;
    
    // First stroke (1) is shown from the start
    strokeTextFrames.push({ stroke: 1, frame: 0 });
    
    // Calculate when each subsequent stroke number appears
    for (let i = 0; i < waits.length; i++) {
      frame += waits[i];
      // The text changes happen after waits, so we need to find which text number corresponds
      // Looking at the pattern: wait(24) -> to({_off:false},0) -> wait(24) -> to({text:"2"}) -> wait(24) -> to({text:"3"})
      // So after wait index 1, text shows "2", after wait index 2, text shows "3"
      if (i > 0 && i <= textNumbers.length) {
        strokeTextFrames.push({ stroke: textNumbers[i - 1], frame });
      }
    }
  }
  
  // Extract shape definitions with path data
  // Pattern: this.shape_N = new cjs.Shape(); ... .p("pathData"); ... setTransform(x, y);
  const shapeRegex = /this\.(shape(?:_\d+)?)\s*=\s*new\s+cjs\.Shape\(\);[^}]*?\.p\("([^"]+)"\);[^}]*?setTransform\(([\d.]+),\s*([\d.]+)\)/gs;
  const colorRegex = /\.f\("([^"]+)"\)/;
  
  let shapeMatch;
  const shapeData: Array<{ name: string; path: string; x: number; y: number; color: string }> = [];
  
  while ((shapeMatch = shapeRegex.exec(jsContent)) !== null) {
    const shapeName = shapeMatch[1];
    const pathData = shapeMatch[2];
    const x = parseFloat(shapeMatch[3]);
    const y = parseFloat(shapeMatch[4]);
    
    // Extract color - find the shape definition section
    const shapeStart = jsContent.lastIndexOf(`this.${shapeName}`, shapeMatch.index);
    const shapeEnd = shapeMatch.index + shapeMatch[0].length;
    const shapeDef = jsContent.substring(shapeStart, shapeEnd);
    const colorMatch = shapeDef.match(colorRegex);
    const color = colorMatch ? colorMatch[1] : '#000000';
    
    // Skip guide strokes (gray #999999)
    if (color !== '#999999') {
      shapeData.push({ name: shapeName, path: pathData, x, y, color });
    }
  }
  
  // Extract timeline groups - each group represents one stroke with multiple segments
  // Each timeline.addTween block contains shapes that belong to one stroke
  // Pattern: timeline.addTween(...).to({state:[{t:this.shape}]},frame).to({state:[{t:this.shape_1}]},frame)...
  const timelineGroups: Array<Array<{ shapeName: string; frame: number }>> = [];
  
  // Find all timeline.addTween blocks - they can span multiple lines
  // Match from timeline.addTween( to the matching closing parenthesis
  // We need to handle nested parentheses correctly
  const timelineBlockPattern = /timeline\.addTween\(/g;
  let blockStart;
  
  while ((blockStart = timelineBlockPattern.exec(jsContent)) !== null) {
    const startPos = blockStart.index;
    let depth = 0;
    let pos = startPos;
    let inString = false;
    let stringChar = '';
    
    // Find the matching closing parenthesis
    while (pos < jsContent.length) {
      const char = jsContent[pos];
      
      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            // Found the matching closing parenthesis
            const block = jsContent.substring(startPos, pos + 1);
            // Only process blocks that contain shape references (not text blocks)
            if (block.includes('state:[{t:this.shape')) {
              const group: Array<{ shapeName: string; frame: number }> = [];
              const shapeFrameRegex = /to\(\{state:\[{t:this\.(shape(?:_\d+)?)}\]\},(\d+)\)/g;
              let shapeFrameMatch;
              
              // CreateJS timeline: frame numbers are RELATIVE wait times, not absolute
              // to({state:[{t:shape}]},72).to({state:[{t:shape_1}]},3) means:
              //   wait 72 frames -> show shape at frame 72
              //   wait 3 more frames -> show shape_1 at frame 75
              // We need to accumulate the wait times to get absolute frame numbers
              let accumulatedFrame = 0;
              
              while ((shapeFrameMatch = shapeFrameRegex.exec(block)) !== null) {
                const waitTime = parseInt(shapeFrameMatch[2], 10);
                accumulatedFrame += waitTime;
                
                group.push({
                  shapeName: shapeFrameMatch[1],
                  frame: accumulatedFrame, // Absolute frame number
                });
              }
              
              if (group.length > 0) {
                timelineGroups.push(group);
              }
            }
            break;
          }
        }
      } else {
        if (char === stringChar && jsContent[pos - 1] !== '\\') {
          inString = false;
        }
      }
      
      pos++;
    }
  }
  
  // Match shapes to timeline groups
  // Each timeline group represents one stroke with multiple segments
  // We'll preserve the raw timeline order and let the visualization interpret it
  // Sort groups by their starting frame to preserve the drawing order
  const sortedGroups = timelineGroups
    .map((group, index) => ({ group, originalIndex: index, firstFrame: group[0]?.frame || 0 }))
    .sort((a, b) => a.firstFrame - b.firstFrame);
  
  // Extract raw data without trying to assign stroke numbers
  // The timeline groups appear in the order they're drawn
  // We'll assign stroke numbers based on the order they appear in the timeline
  // (not based on text labels, which may be misleading)
  for (let groupIdx = 0; groupIdx < sortedGroups.length; groupIdx++) {
    const { group, firstFrame } = sortedGroups[groupIdx];
    
    // Assign stroke number based on drawing order (first drawn = stroke 1, etc.)
    // But note: strokes may be drawn in reverse order, so we need to map correctly
    // The text timeline shows: frame 0="1", frame 24="2", frame 48="3"
    // The shape groups appear at: frame 24, frame 48, frame 72
    // So: group at frame 24 appears when text="2" -> this is stroke 2
    //     group at frame 48 appears when text="3" -> this is stroke 3
    //     group at frame 72 appears after text="3" -> this is stroke 1 (first stroke, drawn last)
    
    // Simple approach: assign based on text timeline if available, otherwise use drawing order
    let strokeNumber = groupIdx + 1;
    
    if (strokeTextFrames.length > 0 && strokeTextFrames.length === sortedGroups.length) {
      // If we have matching counts, try to map based on frame timing
      const sortedTextFrames = [...strokeTextFrames].sort((a, b) => a.frame - b.frame);
      
      // Find which text frame is closest to when this group starts
      let closestTextFrame = sortedTextFrames[0];
      let minDiff = Math.abs(firstFrame - closestTextFrame.frame);
      
      for (const textFrame of sortedTextFrames) {
        const diff = Math.abs(firstFrame - textFrame.frame);
        if (diff < minDiff) {
          minDiff = diff;
          closestTextFrame = textFrame;
        }
      }
      
      // If the group starts significantly after the last text frame, it's stroke 1
      if (firstFrame > sortedTextFrames[sortedTextFrames.length - 1].frame + 20) {
        strokeNumber = 1;
      } else if (minDiff < 30) {
        // Use the text frame's stroke number if close enough
        strokeNumber = closestTextFrame.stroke;
      } else {
        // Fallback: use drawing order (but reversed - last drawn is first stroke)
        strokeNumber = sortedGroups.length - groupIdx;
      }
    }
    
    // Add each segment in this group
    for (let segmentIndex = 0; segmentIndex < group.length; segmentIndex++) {
      const timelineEntry = group[segmentIndex];
      const shape = shapeData.find(s => s.name === timelineEntry.shapeName);
      
      if (shape) {
        strokes.push({
          strokeNumber: strokeNumber,
          segment: segmentIndex + 1, // 1-based segment number
          frame: timelineEntry.frame,
          pathData: shape.path,
          transform: { x: shape.x, y: shape.y },
          color: shape.color,
        });
      }
    }
  }
  
  // Sort by stroke number, then by segment
  strokes.sort((a, b) => {
    if (a.strokeNumber !== b.strokeNumber) {
      return a.strokeNumber - b.strokeNumber;
    }
    return a.segment - b.segment;
  });
  
  return strokes;
}

// Extract pronunciations from text (handles various formats)
function extractPronunciations(text: string): { jyutping?: string; pinyin?: string } {
  const result: { jyutping?: string; pinyin?: string } = {};
  
  if (!text || text.length === 0) {
    return result;
  }
  
  // Handle format: "普通話讀音 yī播放讀音 粵語讀音 jat1"
  // or "普通話讀音 yíxiɑ̀播放讀音 粵語讀音 jat1 haa5"
  const pinyinMatch = text.match(/普通話讀音\s+([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀\s]+[0-9]?)(?:播放讀音|$)/i);
  const jyutpingMatch = text.match(/粵語讀音\s+([a-z\s]+[0-9]+)/);
  
  if (pinyinMatch) {
    result.pinyin = pinyinMatch[1].trim().replace(/\s+/g, '');
  }
  if (jyutpingMatch) {
    result.jyutping = jyutpingMatch[1].trim().replace(/\s+/g, '');
  }
  
  // If we found both, return early
  if (result.jyutping && result.pinyin) {
    return result;
  }
  
  // Fallback: Handle formats like "chéng ing4" or "chéngzuò ing4 zo6 [ ing4 co5]"
  // Split by spaces, brackets, and other separators
  const parts = text.split(/[\s\[\]()播放讀音]+/).filter(p => p.length > 0);
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.length === 0) continue;
    
    // Skip if it's a label
    if (trimmed.includes('普通話') || trimmed.includes('粵語') || trimmed.includes('讀音')) {
      continue;
    }
    
    // Jyutping: lowercase letters + number, e.g., "jat1", "haa6", "ing4"
    // May also have multiple syllables like "ing4zo6" or "jat1 haa5"
    if (trimmed.match(/^[a-z]+[0-9]+([a-z]+[0-9]+)*$/)) {
      const syllables = trimmed.match(/[a-z]+[0-9]+/g);
      if (syllables) {
        result.jyutping = syllables.join('');
      } else {
        result.jyutping = trimmed;
      }
    }
    // Pinyin: may have tone marks or numbers, e.g., "yī", "yi1", "chéng", "chéngzuò", "yíxiɑ̀"
    // Tone marks: āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀
    else if (trimmed.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀]+[0-9]?$/i)) {
      result.pinyin = trimmed;
    }
    // Handle cases where pinyin might have numbers at the end
    else if (trimmed.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀]+[0-9]$/i)) {
      result.pinyin = trimmed;
    }
  }
  
  // If we still didn't find pronunciations, try to extract from the whole text
  if (!result.jyutping) {
    // Try to find jyutping pattern in the text (multiple syllables)
    const jyutpingMatches = text.match(/([a-z]+\s*[0-9]+(?:\s+[a-z]+\s*[0-9]+)*)/g);
    if (jyutpingMatches) {
      result.jyutping = jyutpingMatches[0].replace(/\s+/g, '');
    } else {
      const jyutpingMatch = text.match(/\b([a-z]+[0-9]+)\b/);
      if (jyutpingMatch) {
        result.jyutping = jyutpingMatch[1];
      }
    }
  }
  
  if (!result.pinyin) {
    // Try to find pinyin pattern in the text
    const pinyinMatch = text.match(/\b([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀]+[0-9]?)\b/i);
    if (pinyinMatch && !pinyinMatch[1].match(/^[a-z]+[0-9]+$/)) {
      result.pinyin = pinyinMatch[1];
    }
  }
  
  return result;
}

// Extract words from table rows - comprehensive extraction
function extractWordsFromTable($: cheerio.CheerioAPI, tableSelector: string | cheerio.Cheerio<cheerio.Element>, stage?: '1' | '2'): WordPhrase[] {
  const extractedWords: WordPhrase[] = [];
  const $table = typeof tableSelector === 'string' ? $(tableSelector) : tableSelector;
  
  $table.find('tr').each((i, row) => {
    const $row = $(row);
    const rowText = $row.text().trim();
    
    // Skip header rows
    if (rowText.includes('學習階段') && !rowText.match(/^[\u4e00-\u9fff]+\s+[\u4e00-\u9fff]+\s+[\u4e00-\u9fff]+/)) {
      return;
    }
    if (rowText.includes('詞語顯示') || 
        (rowText.includes('小學學習字詞表') && !rowText.match(/^[\u4e00-\u9fff]+\s+[\u4e00-\u9fff]+\s+[\u4e00-\u9fff]+/))) {
      return;
    }
    if (rowText.length === 0 || $row.find('th').length > 0) {
      return;
    }
    
    // Look for word in cell with class="ci"
    const $wordCell = $row.find('td.ci');
    if ($wordCell.length === 0) {
      return;
    }
    
    const word = $wordCell.text().trim();
    
    // Skip if invalid
    if (!word || word.length === 0 || word.length > 50) {
      return;
    }
    
    // Skip if it's clearly a header
    if (word === '詞語' || word.includes('學習階段') || word.includes('小學學習字詞表')) {
      return;
    }
    
            // Extract pronunciations from pinyinGreen/pinyinPurple and jyutpingGreen/jyutpingPurple divs
            let pronunciations: { jyutping?: string; pinyin?: string } = {};
            
            // Look for pinyinGreen or pinyinPurple div
            const $pinyinDiv = $row.find('div.pinyinGreen, div.pinyinPurple');
            if ($pinyinDiv.length > 0) {
              const pinyinText = $pinyinDiv.text().trim();
              // Extract pinyin (text after "普通話讀音" or after the image, up to "播放讀音" or end)
              // Capture multi-word pinyin like "Fùshì Shān" or "Zhūmùlǎngmǎ Fēng"
              const pinyinMatch = pinyinText.match(/(?:普通話讀音|alt="普通話讀音")\s*([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀\s]+?)(?:\s*播放讀音|$)/i);
              if (pinyinMatch) {
                // Preserve spaces in multi-word pinyin
                pronunciations.pinyin = pinyinMatch[1].trim();
              } else {
                // Try to extract any pinyin-like text (everything before "播放讀音")
                const pinyinTextClean = pinyinText.replace(/普通話讀音|alt="[^"]*"/gi, '').split(/播放讀音/)[0].trim();
                if (pinyinTextClean.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀\s]+/i)) {
                  pronunciations.pinyin = pinyinTextClean.trim();
                }
              }
            }
            
            // Look for jyutpingGreen or jyutpingPurple div
            const $jyutpingDiv = $row.find('div.jyutpingGreen, div.jyutpingPurple');
            if ($jyutpingDiv.length > 0) {
              const jyutpingText = $jyutpingDiv.text().trim();
              // Extract jyutping (text after "粵語讀音" or after the image, before [brackets])
              const jyutpingMatch = jyutpingText.match(/(?:粵語讀音|alt="粵語讀音")\s*([a-z\s]+[0-9]+(?:\s+[a-z]+[0-9]+)*)/);
              if (jyutpingMatch) {
                // Take text before [brackets] if present
                const jyutpingClean = jyutpingMatch[1].split('[')[0].trim();
                pronunciations.jyutping = jyutpingClean.replace(/\s+/g, '');
              } else {
                // Try to extract any jyutping-like text
                const jyutpingTextClean = jyutpingText.replace(/粵語讀音|播放讀音|alt="[^"]*"/gi, '').trim();
                const jyutpingParts = jyutpingTextClean.split('[')[0].trim();
                if (jyutpingParts.match(/^[a-z\s]+[0-9]+/)) {
                  pronunciations.jyutping = jyutpingParts.replace(/\s+/g, '');
                }
              }
            }
    
    // If we didn't find pronunciations in divs, try extracting from row text
    if (!pronunciations.jyutping && !pronunciations.pinyin) {
      pronunciations = extractPronunciations(rowText);
    }
    
    // Get stage from last cell
    const cells = $row.find('td').map((k, cell) => {
      return $(cell).text().trim();
    }).get();
    
    let stageNumber: '1' | '2' | undefined = stage;
    if (cells.length > 0) {
      const lastCell = cells[cells.length - 1];
      if (lastCell.match(/^[12]$/)) {
        stageNumber = lastCell as '1' | '2';
      }
    }
    
    // Check if already added
    const exists = extractedWords.some(w => w.word === word);
    if (!exists) {
      const wordEntry: WordPhrase = { word };
      // Only add pronunciations if they exist
      if (pronunciations.jyutping) {
        wordEntry.jyutping = pronunciations.jyutping;
      }
      if (pronunciations.pinyin) {
        wordEntry.pinyin = pronunciations.pinyin;
      }
      if (stageNumber) {
        wordEntry.stage = stageNumber;
      }
      extractedWords.push(wordEntry);
    }
  });
  
  return extractedWords;
}

// Extract words from the main lexical list table (小學學習字詞表)
function extractMainLexicalList($: cheerio.CheerioAPI): { stage1Words: WordPhrase[]; stage2Words: WordPhrase[] } {
  const stage1Words: WordPhrase[] = [];
  const stage2Words: WordPhrase[] = [];
  
  // Find the main table with "小學學習字詞表"
  $('table').each((i, table) => {
    const $table = $(table);
    const tableText = $table.text();
    
    // Check if this is the main lexical list table
    if (tableText.includes('小學學習字詞表') && !tableText.includes('附表')) {
      // Extract all words from this table
      const allWords = extractWordsFromTable($, $table);
      
      // Separate by stage
      for (const word of allWords) {
        if (word.stage === '1') {
          stage1Words.push(word);
        } else if (word.stage === '2') {
          stage2Words.push(word);
        } else {
          // If no stage specified, try to determine from context
          // For now, add to both or use heuristics
          stage1Words.push(word);
        }
      }
    }
  });
  
  return { stage1Words, stage2Words };
}

// Extract words from a specific section by looking for section headers
// For sections like 文言詞語 and 專名術語, they may have pronunciations
function extractWordsFromSection($: cheerio.CheerioAPI, sectionTitle: string, stage?: '1' | '2'): WordPhrase[] {
  const extractedWords: WordPhrase[] = [];
  
  // Find the table that contains the section header
  $('table').each((i, table) => {
    const $table = $(table);
    
    // Check if this table contains the section header
    let hasSectionHeader = false;
    $table.find('td, th').each((j, cell) => {
      const cellText = $(cell).text();
      if (cellText.includes(sectionTitle) && (cellText.includes('附表') || cellText.includes('小學學習字詞表'))) {
        hasSectionHeader = true;
        return false; // break
      }
    });
    
    if (hasSectionHeader) {
      // Check if this section has pronunciations (文言詞語, 專名術語 do, but 四字詞語 might not)
      const hasPronunciations = sectionTitle === '文言詞語' || sectionTitle === '專名術語';
      
      if (hasPronunciations) {
        // Extract using the same method as main lexical list (with pronunciations)
        const words = extractWordsFromTable($, $table, stage);
        extractedWords.push(...words);
      } else {
        // Extract just words from cells with class="ci" (no pronunciations)
        $table.find('td.ci').each((j, cell) => {
          const cellText = $(cell).text();
          // Split by newlines/tabs and extract each word separately
          // This handles cases where multiple idioms are in the same cell
          const words = cellText
            .split(/[\n\r\t]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0 && w.length <= 50);
          
          for (const word of words) {
            // Skip if invalid
            if (!word || word.length === 0 || word.length > 50) {
              continue;
            }
            
            // Skip if it's clearly a header
            if (word === '詞語' || word.includes('學習階段') || word.includes('小學學習字詞表') || word.includes('附表')) {
              continue;
            }
            
            // Check if already added
            const exists = extractedWords.some(w => w.word === word);
            if (!exists) {
              extractedWords.push({ word });
            }
          }
        });
      }
      
      // Also check following tables for more words in this section
      let $nextTable = $table.next('table');
      let foundNextSection = false;
      let tablesChecked = 0;
      
      // Look at next few tables until we hit another section or run out
      while ($nextTable.length > 0 && tablesChecked < 10 && !foundNextSection) {
        const nextTableText = $nextTable.text();
        
        // Check if this is another section header
        const nextSectionHeaders = ['附表一', '附表二', '附表三', '附表四', '附表五', '四字詞語', '文言詞語', '多字熟語', '專名術語', '音譯外來詞語'];
        for (const header of nextSectionHeaders) {
          if (nextTableText.includes(header) && !nextTableText.includes(sectionTitle)) {
            foundNextSection = true;
            break;
          }
        }
        
        if (!foundNextSection) {
          if (hasPronunciations) {
            // Extract with pronunciations
            const words = extractWordsFromTable($, $nextTable, stage);
            extractedWords.push(...words);
          } else {
            // Extract just words - handle multiple words in same cell
            $nextTable.find('td.ci').each((j, cell) => {
              const cellText = $(cell).text();
              // Split by newlines/tabs and extract each word separately
              const words = cellText
                .split(/[\n\r\t]+/)
                .map(w => w.trim())
                .filter(w => w.length > 0 && w.length <= 50);
              
              for (const word of words) {
                if (!word || word.length === 0 || word.length > 50) {
                  continue;
                }
                
                if (word === '詞語' || word.includes('學習階段') || word.includes('小學學習字詞表') || word.includes('附表')) {
                  continue;
                }
                
                const exists = extractedWords.some(w => w.word === word);
                if (!exists) {
                  extractedWords.push({ word });
                }
              }
            });
          }
          
          $nextTable = $nextTable.next('table');
          tablesChecked++;
        }
      }
    }
  });
  
  // Remove duplicates
  const uniqueWords: WordPhrase[] = [];
  const seen = new Set<string>();
  for (const word of extractedWords) {
    if (!seen.has(word.word)) {
      seen.add(word.word);
      uniqueWords.push(word);
    }
  }
  
  return uniqueWords;
}

// Extract data from HTML
async function extractData(html: string, wordId: string, word: string): Promise<ExtractedData> {
  const $ = cheerio.load(html);
  const sourceUrl = `https://www.edbchinese.hk/lexlist_ch/result.jsp?id=${wordId}&sortBy=ks&jpC=lshk`;
  const data: ExtractedData = {
    id: wordId,
    word: word,
    sourceUrl: sourceUrl,
    strokeOrderImages: [],
    inLexicalListsHK: false,
    stage1Words: [],
    stage2Words: [],
    fourCharacterPhrases: [],
    classicalPhrases: [],
    multiCharacterIdioms: [],
    properNouns: [],
    transliteratedWords: [],
  };

  // Extract radical (部首)
  // Look for table with "部首" header, then get the value from the next row
  $('table').each((i, table) => {
    const $table = $(table);
    let hasRadicalHeader = false;
    $table.find('td, th').each((j, cell) => {
      if ($(cell).text().trim() === '部首') {
        hasRadicalHeader = true;
        return false; // break
      }
    });
    
    if (hasRadicalHeader) {
      // Find the cell with "部首" header
      $table.find('td, th').each((j, cell) => {
        if ($(cell).text().trim() === '部首') {
          // Get the value from the same column in the next row
          const $row = $(cell).closest('tr');
          const $nextRow = $row.next('tr');
          if ($nextRow.length > 0) {
            const colIndex = $row.find('td, th').index($(cell));
            const $valueCell = $nextRow.find('td, th').eq(colIndex);
            const radicalText = $valueCell.text().trim();
            // Extract just the radical character (remove "部" suffix if present)
            const radicalMatch = radicalText.match(/^([\u4e00-\u9fff])/);
            if (radicalMatch) {
              data.radical = radicalMatch[1];
            } else if (radicalText) {
              data.radical = radicalText.replace(/部$/, '').trim();
            }
          }
          return false; // break
        }
      });
    }
  });
  
  // Fallback: search for "部首" text pattern
  if (!data.radical) {
    const radicalMatch = $.text().match(/部首[：:]\s*([\u4e00-\u9fff])/);
    if (radicalMatch) {
      data.radical = radicalMatch[1];
    }
  }

  // Extract strokes (總筆畫數)
  // Look for table with "總筆畫數" header, then get the value from the next row
  $('table').each((i, table) => {
    const $table = $(table);
    let hasStrokesHeader = false;
    $table.find('td, th').each((j, cell) => {
      if ($(cell).text().trim() === '總筆畫數') {
        hasStrokesHeader = true;
        return false; // break
      }
    });
    
    if (hasStrokesHeader) {
      // Find the cell with "總筆畫數" header
      $table.find('td, th').each((j, cell) => {
        if ($(cell).text().trim() === '總筆畫數') {
          // Get the value from the same column in the next row
          const $row = $(cell).closest('tr');
          const $nextRow = $row.next('tr');
          if ($nextRow.length > 0) {
            const colIndex = $row.find('td, th').index($(cell));
            const $valueCell = $nextRow.find('td, th').eq(colIndex);
            const strokesText = $valueCell.text().trim();
            // Extract number (e.g., "3 畫" -> 3)
            const strokesMatch = strokesText.match(/(\d+)/);
            if (strokesMatch) {
              data.strokes = parseInt(strokesMatch[1], 10);
            }
          }
          return false; // break
        }
      });
    }
  });
  
  // Fallback: search for "總筆畫數" or "筆畫" text pattern
  if (!data.strokes) {
    const strokesMatch = $.text().match(/(?:總筆畫數|筆畫)[：:]\s*(\d+)/);
    if (strokesMatch) {
      data.strokes = parseInt(strokesMatch[1], 10);
    }
  }

  // Extract Cantonese phonic (粵語字音) - jyutping
  // The character's jyutping is in a span with class "jyutping12" containing the pronunciation
  // Structure: <span class="jyutping12"><strong> jat1<span class='handpointer'>...</span></strong></span>
  // We need to get the first jyutping12 span which contains the character pronunciation
  const $jyutpingSpans = $('span.jyutping12 strong');
  if ($jyutpingSpans.length > 0) {
    // Get the first non-empty jyutping
    $jyutpingSpans.each((i, el) => {
      const spanText = $(el).text().trim();
      // Extract jyutping pattern (e.g., "jat1", "ding1")
      const jyutpingMatch = spanText.match(/^\s*([a-z]+[0-9]+)/i);
      if (jyutpingMatch && !data.jyutping) {
        data.jyutping = jyutpingMatch[1];
        return false; // break
      }
    });
  }
  
  // Fallback: look for "粵語" header column and get the value below
  if (!data.jyutping) {
    $('table').each((i, table) => {
      const $table = $(table);
      let hasYuetYuHeader = false;
      let headerColIndex = -1;
      
      $table.find('td, th').each((j, cell) => {
        const cellText = $(cell).text().trim();
        if (cellText === '粵語') {
          hasYuetYuHeader = true;
          headerColIndex = $(cell).index();
          return false; // break
        }
      });
      
      if (hasYuetYuHeader && headerColIndex >= 0) {
        // Find the data row (next row after header)
        const $headerRow = $table.find('td, th').filter((j, cell) => $(cell).text().trim() === '粵語').closest('tr');
        const $nextRow = $headerRow.next('tr');
        if ($nextRow.length > 0) {
          const $valueCell = $nextRow.find('td').eq(headerColIndex);
          const jyutpingText = $valueCell.find('span.jyutping12 strong').first().text().trim();
          const jyutpingMatch = jyutpingText.match(/^\s*([a-z]+[0-9]+)/i);
          if (jyutpingMatch) {
            data.jyutping = jyutpingMatch[1];
          }
        }
        return false; // break outer loop
      }
    });
  }

  // Extract Mandarin phonic (普通話字音) - pinyin
  // The character's pinyin is in a td with class "pinyin12" containing the pronunciation
  // Structure: <td class="pinyin12"><strong>yī<span class='handpointer'>...</span><br />...</strong></td>
  // We need to get the first pinyin12 td which contains the character pronunciation
  // Pinyin may use special characters like ɑ (U+0251 - Latin Small Letter Alpha) with tone marks
  // Combined characters: ā́ǎ̀ḕé̌ě̈ī́ǐ̀ṑó̌ǒ̈ū́ǔ̀ǖ̀ǘ̌ǚ̈ǜ̀ɑ̄ɑ́ɑ̌ɑ̀
  const pinyinPattern = /^[a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑɛŋŊ\u0300-\u036f]+$/;
  
  const $pinyinCell = $('td.pinyin12 strong').first();
  if ($pinyinCell.length > 0) {
    // Get the text content before any <br> or <span>
    // Clone the element and remove child elements to get just the text
    const pinyinText = $pinyinCell.clone().children().remove().end().text().trim();
    if (pinyinText) {
      // Extract pinyin (text before any special characters like spans or images)
      const cleanPinyin = pinyinText.split(/[\s\n<]/)[0].trim();
      if (cleanPinyin && cleanPinyin.match(pinyinPattern)) {
        data.pinyin = cleanPinyin;
      }
    }
  }
  
  // Fallback: look for "普通話" header column and get the value below
  if (!data.pinyin) {
    $('table').each((i, table) => {
      const $table = $(table);
      let hasPinyinHeader = false;
      let headerColIndex = -1;
      
      $table.find('td, th').each((j, cell) => {
        const cellText = $(cell).text().trim();
        if (cellText === '普通話') {
          hasPinyinHeader = true;
          headerColIndex = $(cell).index();
          return false; // break
        }
      });
      
      if (hasPinyinHeader && headerColIndex >= 0) {
        // Find the data row (next row after header)
        const $headerRow = $table.find('td, th').filter((j, cell) => $(cell).text().trim() === '普通話').closest('tr');
        const $nextRow = $headerRow.next('tr');
        if ($nextRow.length > 0) {
          const $valueCell = $nextRow.find('td.pinyin12, td').eq(headerColIndex);
          const $strong = $valueCell.find('strong').first();
          if ($strong.length > 0) {
            const pinyinText = $strong.clone().children().remove().end().text().trim();
            const cleanPinyin = pinyinText.split(/[\s\n]/)[0].trim();
            if (cleanPinyin && cleanPinyin.match(pinyinPattern)) {
              data.pinyin = cleanPinyin;
            }
          }
        }
        return false; // break outer loop
      }
    });
  }
  
  // Additional fallback: search for "普通話字音" text pattern
  if (!data.pinyin) {
    const pinyinMatch = $.text().match(/普通話(?:字音|讀音)[：:]\s*([a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑɛŋŊ\u0300-\u036f]+)/);
    if (pinyinMatch) {
      data.pinyin = pinyinMatch[1].trim();
    }
  }

  // Extract stroke order animation (筆順)
  // The stroke animation is embedded in an iframe
  // Pattern: /EmbziciwebRes/stkdemo_js/{range}/{id}.html?lang=ch
  // The animation is canvas-based (vector graphics), not individual image files
  // We extract the iframe URL and also parse the JavaScript to get vector graphics data
  const iframes = $('iframe').toArray();
  for (const el of iframes) {
    const src = $(el).attr('src');
    if (src && src.includes('stkdemo_js')) {
      const fullUrl = src.startsWith('http') ? src : `https://www.edbchinese.hk${src}`;
      data.strokeOrderImages.push(fullUrl);
      
      // Extract vector graphics from the JavaScript file
      // Also fetch the HTML file to get canvas dimensions and coordinate system info
      try {
        const jsUrl = fullUrl.replace('.html', '.js');
        const htmlUrl = fullUrl;
        
        // Try to fetch HTML first to get canvas/viewport info
        let htmlContent = '';
        let jsContent = '';
        
        // Fetch HTML file
        try {
          const htmlResponse = await fetch(htmlUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (htmlResponse.ok) {
            htmlContent = await htmlResponse.text();
          }
        } catch {
          // Fallback to curl for HTML
          try {
            htmlContent = execSync(`curl -s -L "${htmlUrl}" -H "User-Agent: Mozilla/5.0" --max-time 5`, {
              encoding: 'utf-8',
              maxBuffer: 5 * 1024 * 1024,
            });
          } catch {
            // Skip if both fail
          }
        }
        
        // Fetch JS file
        try {
          const jsResponse = await fetch(jsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (jsResponse.ok) {
            jsContent = await jsResponse.text();
          }
        } catch {
          // Fallback to curl for JS
          try {
            jsContent = execSync(`curl -s -L "${jsUrl}" -H "User-Agent: Mozilla/5.0" --max-time 5`, {
              encoding: 'utf-8',
              maxBuffer: 5 * 1024 * 1024,
            });
          } catch {
            // Skip if both fail
          }
        }
        
        if (jsContent) {
          // Extract canvas/viewport dimensions from HTML if available
          let canvasWidth = 0;
          let canvasHeight = 0;
          if (htmlContent) {
            const canvasMatch = htmlContent.match(/canvas[^>]*(?:width|WIDTH)="?(\d+)"?[^>]*(?:height|HEIGHT)="?(\d+)"?/i) ||
                               htmlContent.match(/canvas[^>]*(?:height|HEIGHT)="?(\d+)"?[^>]*(?:width|WIDTH)="?(\d+)"?/i);
            if (canvasMatch) {
              canvasWidth = parseInt(canvasMatch[1], 10);
              canvasHeight = parseInt(canvasMatch[2], 10);
            }
          }
          
          const strokeVectors = extractStrokeVectors(jsContent, canvasWidth, canvasHeight);
          if (strokeVectors.length > 0) {
            data.strokeVectors = strokeVectors;
          }
        }
      } catch {
        // If extraction fails, just store the iframe URL
      }
    }
  }
  
  // Also check for img tags with stroke-related content (fallback)
  $('img').each((i, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && (src.includes('stroke') || src.includes('筆順') || alt.includes('筆順'))) {
      const fullUrl = src.startsWith('http') ? src : `https://www.edbchinese.hk${src}`;
      // Avoid duplicates
      if (!data.strokeOrderImages.includes(fullUrl)) {
        data.strokeOrderImages.push(fullUrl);
      }
    }
  });

  // Check for 小學學習字詞表
  // First, check if there's an exclusion message indicating the character is NOT in the list
  const pageText = $.text();
  const hasExclusionMessage = pageText.includes('此字屬《常用字字形表》') && 
                               pageText.includes('而不入《香港小學學習字詞表》');
  
  if (hasExclusionMessage) {
    // Character is explicitly stated as NOT in the 小學學習字詞表
    data.inLexicalListsHK = false;
  } else {
    // Check if the main lexical list table exists (not just 附表 sections)
    // Look for table with "小學學習字詞表" header that's NOT an appendix (附表)
    let hasMainLexicalList = false;
    $('table').each((i, table) => {
      const $table = $(table);
      const tableText = $table.text();
      // Check if this table contains "小學學習字詞表" but NOT "附表"
      if (tableText.includes('小學學習字詞表') && !tableText.includes('附表')) {
        hasMainLexicalList = true;
        return false; // break
      }
    });
    
    // Also check headers
    if (!hasMainLexicalList) {
      hasMainLexicalList = $('h3:contains("小學學習字詞表")').length > 0 ||
                           $('h4:contains("小學學習字詞表")').length > 0 ||
                           $('th:contains("小學學習字詞表")').filter((i, el) => {
                             return !$(el).text().includes('附表');
                           }).length > 0;
    }
    
    data.inLexicalListsHK = hasMainLexicalList;
  }

  // Extract from main lexical list table (小學學習字詞表)
  const mainList = extractMainLexicalList($);
  data.stage1Words = mainList.stage1Words;
  data.stage2Words = mainList.stage2Words;

  // Extract 四字詞語 (Four-character phrases) - from dedicated section only
  data.fourCharacterPhrases = extractWordsFromSection($, '四字詞語');

  // Extract 文言詞語 (Classical Chinese phrases) - from dedicated section only
  data.classicalPhrases = extractWordsFromSection($, '文言詞語');

  // Extract 多字熟語 (Multi-character idioms) - from dedicated section only
  data.multiCharacterIdioms = extractWordsFromSection($, '多字熟語');

  // Extract 專名術語 (Proper nouns/Technical terms)
  data.properNouns = extractWordsFromSection($, '專名術語');

  // Extract 音譯外來詞語 (Transliterated foreign words)
  const transliteratedWords: TransliteratedWord[] = [];
  
  $('table').each((i, table) => {
    const $table = $(table);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tableText = $table.text();
    
    // Check if this table contains the section header
    let hasTransliteratedSection = false;
    $table.find('td, th').each((j, cell) => {
      const cellText = $(cell).text();
      if (cellText.includes('音譯外來詞語') && (cellText.includes('附表') || cellText.includes('小學學習字詞表'))) {
        hasTransliteratedSection = true;
        return false; // break
      }
    });
    
    if (hasTransliteratedSection) {
      // Extract from this table and following tables until next section
      let $currentTable = $table;
      let tablesChecked = 0;
      let foundNextSection = false;
      
      while ($currentTable.length > 0 && tablesChecked < 10 && !foundNextSection) {
        const currentTableText = $currentTable.text();
        
        // Check if this is another section header
        const nextSectionHeaders = ['附表一', '附表二', '附表三', '附表四', '附表五', '四字詞語', '文言詞語', '多字熟語', '專名術語'];
        for (const header of nextSectionHeaders) {
          if (currentTableText.includes(header) && !currentTableText.includes('音譯外來詞語')) {
            foundNextSection = true;
            break;
          }
        }
        
        if (!foundNextSection) {
          // Extract from rows in this table
          $currentTable.find('tr').each((j, row) => {
            const $row = $(row);
            const rowText = $row.text().trim();
            
            // Skip header rows
            if (rowText.includes('音譯外來詞語') || 
                rowText.includes('附表') ||
                rowText.length === 0 ||
                $row.find('th').length > 0) {
              return;
            }
            
            // Look for word in cell with class="ci"
            const $wordCell = $row.find('td.ci');
            if ($wordCell.length === 0) {
              return;
            }
            
            const word = $wordCell.text().trim();
            
            // Skip if invalid
            if (!word || word.length === 0 || word.length > 50) {
              return;
            }
            
            // Skip if it's clearly a header
            if (word === '詞語' || word.includes('學習階段') || word.includes('小學學習字詞表') || word.includes('附表')) {
              return;
            }
            
            // Extract pronunciations from pinyinGreen/pinyinPurple and jyutpingGreen/jyutpingPurple divs (if available)
            const pronunciations: { jyutping?: string; pinyin?: string } = {};
            
            const $pinyinDiv = $row.find('div.pinyinGreen, div.pinyinPurple');
            if ($pinyinDiv.length > 0) {
            const pinyinText = $pinyinDiv.text().trim();
            // Extract multi-word pinyin preserving spaces
            const pinyinMatch = pinyinText.match(/(?:普通話讀音|alt="普通話讀音")\s*([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀\s]+?)(?:\s*播放讀音|$)/i);
            if (pinyinMatch) {
              pronunciations.pinyin = pinyinMatch[1].trim();
            } else {
              const pinyinTextClean = pinyinText.replace(/普通話讀音|alt="[^"]*"/gi, '').split(/播放讀音/)[0].trim();
              if (pinyinTextClean.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüɑ̀\s]+/i)) {
                pronunciations.pinyin = pinyinTextClean.trim();
              }
            }
            }
            
            const $jyutpingDiv = $row.find('div.jyutpingGreen, div.jyutpingPurple');
            if ($jyutpingDiv.length > 0) {
              const jyutpingText = $jyutpingDiv.text().trim();
              const jyutpingMatch = jyutpingText.match(/(?:粵語讀音|alt="粵語讀音")\s*([a-z\s]+[0-9]+(?:\s+[a-z]+[0-9]+)*)/);
              if (jyutpingMatch) {
                const jyutpingClean = jyutpingMatch[1].split('[')[0].trim();
                pronunciations.jyutping = jyutpingClean.replace(/\s+/g, '');
              } else {
                const jyutpingTextClean = jyutpingText.replace(/粵語讀音|播放讀音|alt="[^"]*"/gi, '').trim();
                const jyutpingParts = jyutpingTextClean.split('[')[0].trim();
                if (jyutpingParts.match(/^[a-z\s]+[0-9]+/)) {
                  pronunciations.jyutping = jyutpingParts.replace(/\s+/g, '');
                }
              }
            }
            
            // Extract foreign word - look in cells with class "eng" or English text
            let foreignWord: string | undefined;
            
            // First, check for cell with class "eng"
            const $engCell = $row.find('td.eng');
            if ($engCell.length > 0) {
              const engText = $engCell.text().trim();
              if (engText && engText !== '&nbsp;' && engText.match(/^[A-Za-z\s]+$/) && engText.length > 0 && engText.length < 50) {
                foreignWord = engText;
              }
            }
            
            // If not found, check previous row (for cases like 盎司 which is linked to 安士)
            if (!foreignWord) {
              const $prevRow = $row.prev('tr');
              if ($prevRow.length > 0) {
                const $prevEngCell = $prevRow.find('td.eng');
                if ($prevEngCell.length > 0) {
                  const prevEngText = $prevEngCell.text().trim();
                  if (prevEngText && prevEngText !== '&nbsp;' && prevEngText.match(/^[A-Za-z\s]+$/) && prevEngText.length > 0 && prevEngText.length < 50) {
                    foreignWord = prevEngText;
                  }
                }
              }
            }
            
            // Fallback: look in all cells for English text
            if (!foreignWord) {
              const cells = $row.find('td').map((k, cell) => $(cell).text().trim()).get();
              for (const cellText of cells) {
                // Foreign word is usually English text (letters only, no Chinese)
                if (cellText && cellText.match(/^[A-Za-z\s]+$/) && cellText.length > 0 && cellText.length < 50) {
                  // Skip if it looks like a pronunciation (contains numbers or common pinyin patterns)
                  if (!cellText.match(/\d/) && !cellText.match(/^(普通話|粵語|播放)/i)) {
                    foreignWord = cellText.trim();
                    break;
                  }
                }
              }
            }
            
            // Check if already added
            const exists = transliteratedWords.some(w => w.word === word);
            if (!exists) {
              transliteratedWords.push({
                word,
                jyutping: pronunciations.jyutping,
                pinyin: pronunciations.pinyin,
                foreignWord,
              });
            }
          });
          
          $currentTable = $currentTable.next('table');
          tablesChecked++;
        }
      }
    }
  });
  
  data.transliteratedWords = transliteratedWords;

  return data;
}

// Convert extracted data to JSON format
function convertToCharacterFormat(data: ExtractedData): Record<string, unknown> {
  return {
    id: data.id,
    character: data.word,
    sourceUrl: data.sourceUrl,
    radical: data.radical || '',
    strokeCount: data.strokes || 0,
    jyutping: data.jyutping || '',
    pinyin: data.pinyin || '',
    strokeOrderImages: data.strokeOrderImages,
    strokeVectors: data.strokeVectors || [],
    inLexicalListsHK: data.inLexicalListsHK,
    stage1Words: data.stage1Words,
    stage2Words: data.stage2Words,
    fourCharacterPhrases: data.fourCharacterPhrases,
    classicalPhrases: data.classicalPhrases,
    multiCharacterIdioms: data.multiCharacterIdioms,
    properNouns: data.properNouns,
    transliteratedWords: data.transliteratedWords,
  };
}

// Main crawling function
async function crawlWords() {
  const wordsToProcess = limit ? words.slice(start, start + limit) : words.slice(start);
  
  console.log(`Starting crawl for ${wordsToProcess.length} words (starting from index ${start})...`);
  console.log(`Output directory: ${outputDir}`);
  
  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < wordsToProcess.length; i++) {
    const wordEntry = wordsToProcess[i];
    const url = `https://www.edbchinese.hk/lexlist_ch/result.jsp?id=${wordEntry.id}&sortBy=ks&jpC=lshk`;
    
    let retries = 2; // 2 retries = 3 total attempts (initial + 2 retries)
    let success = false;
    
    while (retries >= 0 && !success) {
      try {
        const attemptLabel = retries === 2 ? '1/3' : retries === 1 ? '2/3' : '3/3';
        console.log(`[${i + 1}/${wordsToProcess.length}] Fetching ${wordEntry.word} (${wordEntry.id})... (${attemptLabel})`);
        
        // Use curl as fallback since Node.js fetch has SSL issues
        // Try fetch first, then fall back to curl if it fails
        let html: string;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          html = await response.text();
        } catch (fetchError) {
          // Fallback to curl if fetch fails
          try {
            html = execSync(`curl -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" --max-time 30`, {
              encoding: 'utf-8',
              maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            });
          } catch (curlError) {
            throw new Error(`Both fetch and curl failed. Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Curl error: ${curlError instanceof Error ? curlError.message : String(curlError)}`);
          }
        }
        
        if (!html || html.length < 100) {
          throw new Error('Received empty or too short HTML response');
        }
        
        const extractedData = await extractData(html, wordEntry.id, wordEntry.word);
        const characterData = convertToCharacterFormat(extractedData);
        
        // Write individual character file only on success
        const characterFile = join(outputDir, `${wordEntry.id}.json`);
        writeFileSync(characterFile, JSON.stringify(characterData, null, 2));
        
        successCount++;
        success = true;
        
        // Show sample for first word
        if (i === 0) {
          console.log('\n--- Sample Output (First Entry) ---');
          console.log(JSON.stringify(characterData, null, 2));
          console.log(`\nWritten to: ${characterFile}`);
          console.log('--- End Sample ---\n');
        }
        
        // Delay to avoid overwhelming the server
        if (i < wordsToProcess.length - 1) {
          await delay(1000);
        }
        
      } catch (error) {
        let errorMsg: string;
        
        if (error instanceof Error) {
          errorMsg = error.message;
          if (error.name === 'AbortError') {
            errorMsg = `Request timeout: ${errorMsg}`;
          } else if (error.message.includes('fetch failed')) {
            // Get more details about the fetch error
            const errorDetails = error.cause ? ` (cause: ${error.cause})` : '';
            const errorWithCode = error as { code?: string };
            const errorCode = errorWithCode.code ? ` [code: ${errorWithCode.code}]` : '';
            errorMsg = `Network error: ${errorMsg}${errorDetails}${errorCode}. This might be due to SSL/TLS certificate issues. Try running with: NODE_TLS_REJECT_UNAUTHORIZED=0 npm run crawl:edbchinese:json`;
          }
        } else {
          errorMsg = String(error);
        }
        
        if (retries > 0) {
          retries--;
          console.warn(`  Retrying... (${retries} retries left). Error: ${errorMsg}`);
          await delay(2000); // 2 second sleep before retry
        } else {
          // No more retries - log error but don't write JSON file
          errorCount++;
          console.error(`Error fetching ${wordEntry.word} (${wordEntry.id}): ${errorMsg}`);
          console.error(`  URL: ${url}`);
          console.error(`  Skipping JSON write - can be regenerated later`);
          break; // Exit the retry loop and move to next character
        }
      }
    }
  }
  
  console.log(`\nCrawl completed!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output written to: ${outputDir}/`);
}

// Run the crawler
crawlWords().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

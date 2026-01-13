#!/usr/bin/env tsx

/**
 * EDB Chinese Dictionary Crawler
 * 
 * Crawls data from edbchinese.hk for each word in all_words.json
 * Extracts: radical, strokes, pronunciations, stroke order images, and word lists
 * 
 * Usage:
 *   tsx scripts/crawl-edbchinese.ts [--limit N] [--start N] [--output file.txt]
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';

interface WordEntry {
  word: string;
  id: string;
}

interface ExtractedData {
  id: string;
  word: string;
  radical?: string;
  strokes?: number;
  cantonesePhonic?: string;
  mandarinPhonic?: string;
  strokeOrderImages?: string[];
  hasPrimaryWordList?: boolean;
  stage1Words?: Array<{
    word: string;
    cantonesePhonic?: string;
    mandarinPhonic?: string;
  }>;
  stage2Words?: Array<{
    word: string;
    cantonesePhonic?: string;
    mandarinPhonic?: string;
  }>;
}

// Parse command line arguments
const args = process.argv.slice(2);
let limit: number | null = null;
let start: number = 0;
let outputFile: string = 'data/edbchinese-db.txt';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--start' && args[i + 1]) {
    start = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
}

// Load word list
const wordsDataPath = join(process.cwd(), 'references/edbchinese.hk/words_data/all_words.json');
const wordsData = JSON.parse(readFileSync(wordsDataPath, 'utf-8'));
const words: WordEntry[] = wordsData.words;

// Helper function to delay requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract data from HTML
function extractData(html: string, wordId: string, word: string): ExtractedData {
  const $ = cheerio.load(html);
  const data: ExtractedData = {
    id: wordId,
    word: word,
  };

  // Extract radical (部首) - try multiple selectors
  let radicalText = '';
  $('td, th, div, span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('部首')) {
      // Get next sibling or parent's next sibling
      const next = $(el).next();
      if (next.length) {
        radicalText = next.text().trim();
      } else {
        // Try parent's next sibling
        const parentNext = $(el).parent().next();
        if (parentNext.length) {
          radicalText = parentNext.find('td, div, span').first().text().trim();
        }
      }
      return false; // break
    }
  });
  
  if (radicalText) {
    // Match pattern like "一(部)" or "一"
    const radicalMatch = radicalText.match(/^([^(]+)/);
    if (radicalMatch) {
      data.radical = radicalMatch[1].trim();
    } else {
      data.radical = radicalText;
    }
  }

  // Extract strokes (總筆畫數) - try multiple selectors
  let strokesText = '';
  $('td, th, div, span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('總筆畫數') || text.includes('筆畫')) {
      const next = $(el).next();
      if (next.length) {
        strokesText = next.text().trim();
      } else {
        const parentNext = $(el).parent().next();
        if (parentNext.length) {
          strokesText = parentNext.find('td, div, span').first().text().trim();
        }
      }
      return false; // break
    }
  });
  
  if (strokesText) {
    const strokesMatch = strokesText.match(/(\d+)/);
    if (strokesMatch) {
      data.strokes = parseInt(strokesMatch[1], 10);
    }
  }

  // Extract Cantonese phonic (粵語字音)
  let cantoneseText = '';
  $('td, th, div, span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('粵語字音') || (text.includes('粵語') && text.includes('字音'))) {
      const next = $(el).next();
      if (next.length) {
        cantoneseText = next.text().trim();
      } else {
        const parentNext = $(el).parent().next();
        if (parentNext.length) {
          cantoneseText = parentNext.find('td, div, span').first().text().trim();
        }
      }
      return false; // break
    }
  });
  
  if (cantoneseText) {
    data.cantonesePhonic = cantoneseText;
  }

  // Extract Mandarin phonic (普通話字音)
  let mandarinText = '';
  $('td, th, div, span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('普通話字音') || (text.includes('普通話') && text.includes('字音'))) {
      const next = $(el).next();
      if (next.length) {
        mandarinText = next.text().trim();
      } else {
        const parentNext = $(el).parent().next();
        if (parentNext.length) {
          mandarinText = parentNext.find('td, div, span').first().text().trim();
        }
      }
      return false; // break
    }
  });
  
  if (mandarinText) {
    data.mandarinPhonic = mandarinText;
  }

  // Extract stroke order images (筆順)
  const strokeOrderImages: string[] = [];
  $('img[src*="stroke"], img[src*="筆順"], img[alt*="筆順"]').each((i, el) => {
    const src = $(el).attr('src');
    if (src) {
      const fullUrl = src.startsWith('http') ? src : `https://www.edbchinese.hk${src}`;
      strokeOrderImages.push(fullUrl);
    }
  });
  if (strokeOrderImages.length > 0) {
    data.strokeOrderImages = strokeOrderImages;
  }

  // Check for 小學學習字詞表
  const hasWordList = $('table:contains("小學學習字詞表")').length > 0 ||
                      $('h3:contains("小學學習字詞表")').length > 0 ||
                      $('h4:contains("小學學習字詞表")').length > 0 ||
                      $('th:contains("小學學習字詞表")').length > 0;
  data.hasPrimaryWordList = hasWordList;

  // Extract 第一學習階段詞語 (Stage 1 words)
  const stage1Words: ExtractedData['stage1Words'] = [];
  let inStage1Section = false;
  
  $('*').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    
    // Detect start of Stage 1 section
    if (text.includes('第一學習階段') && !text.includes('第二學習階段')) {
      inStage1Section = true;
    }
    
    // Detect end of Stage 1 section (start of Stage 2)
    if (text.includes('第二學習階段')) {
      inStage1Section = false;
    }
    
    // Extract words from table rows when in Stage 1 section
    if (inStage1Section && ($el.is('tr') || ($el.is('div') && $el.find('tr').length === 0))) {
      const rowText = $el.text().trim();
      
      // Skip header rows
      if (rowText.includes('第一學習階段') || 
          rowText.includes('第二學習階段') ||
          rowText === '詞語' || 
          rowText.includes('字音') ||
          rowText.length === 0) {
        return;
      }
      
      // Extract word and pronunciations from cells
      const cells = $el.find('td, th, span, div').map((k, cell) => {
        return $(cell).text().trim();
      }).get().filter(c => c.length > 0);
      
      if (cells.length > 0) {
        // First cell is usually the word
        const word = cells[0];
        
        // Skip if it's clearly a header
        if (word === '詞語' || word.includes('學習階段') || word.length > 10) {
          return;
        }
        
        let cantonese: string | undefined;
        let mandarin: string | undefined;
        
        // Look for pronunciations in subsequent cells
        for (let k = 1; k < cells.length; k++) {
          const cellText = cells[k];
          
          // Cantonese typically uses jyutping (lowercase with numbers, e.g., "jat1")
          if (cellText.match(/^[a-z]+[0-9]+$/)) {
            cantonese = cellText;
          }
          // Mandarin typically uses pinyin (with tone marks or numbers, e.g., "yī" or "yi1")
          else if (cellText.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+[0-9]?$/i)) {
            mandarin = cellText;
          }
        }
        
        // Only add if we have a valid word (single character or short word)
        if (word && word.length > 0 && word.length <= 10) {
          // Check if this word is already added
          const exists = stage1Words.some(w => w.word === word);
          if (!exists) {
            stage1Words.push({
              word,
              cantonesePhonic: cantonese,
              mandarinPhonic: mandarin,
            });
          }
        }
      }
    }
  });
  
  if (stage1Words.length > 0) {
    data.stage1Words = stage1Words;
  }

  // Extract 第二學習階段詞語 (Stage 2 words)
  const stage2Words: ExtractedData['stage2Words'] = [];
  let inStage2Section = false;
  
  $('*').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    
    // Detect start of Stage 2 section
    if (text.includes('第二學習階段')) {
      inStage2Section = true;
    }
    
    // Extract words from table rows when in Stage 2 section
    if (inStage2Section && ($el.is('tr') || ($el.is('div') && $el.find('tr').length === 0))) {
      const rowText = $el.text().trim();
      
      // Skip header rows
      if (rowText.includes('第一學習階段') || 
          rowText.includes('第二學習階段') ||
          rowText === '詞語' || 
          rowText.includes('字音') ||
          rowText.length === 0) {
        return;
      }
      
      // Extract word and pronunciations from cells
      const cells = $el.find('td, th, span, div').map((k, cell) => {
        return $(cell).text().trim();
      }).get().filter(c => c.length > 0);
      
      if (cells.length > 0) {
        // First cell is usually the word
        const word = cells[0];
        
        // Skip if it's clearly a header
        if (word === '詞語' || word.includes('學習階段') || word.length > 10) {
          return;
        }
        
        let cantonese: string | undefined;
        let mandarin: string | undefined;
        
        // Look for pronunciations in subsequent cells
        for (let k = 1; k < cells.length; k++) {
          const cellText = cells[k];
          
          // Cantonese typically uses jyutping (lowercase with numbers, e.g., "jat1")
          if (cellText.match(/^[a-z]+[0-9]+$/)) {
            cantonese = cellText;
          }
          // Mandarin typically uses pinyin (with tone marks or numbers, e.g., "yī" or "yi1")
          else if (cellText.match(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+[0-9]?$/i)) {
            mandarin = cellText;
          }
        }
        
        // Only add if we have a valid word (single character or short word)
        if (word && word.length > 0 && word.length <= 10) {
          // Check if this word is already added
          const exists = stage2Words.some(w => w.word === word);
          if (!exists) {
            stage2Words.push({
              word,
              cantonesePhonic: cantonese,
              mandarinPhonic: mandarin,
            });
          }
        }
      }
    }
  });
  
  if (stage2Words.length > 0) {
    data.stage2Words = stage2Words;
  }

  return data;
}

// Format data as plain text
function formatAsText(data: ExtractedData): string {
  const lines: string[] = [];
  
  lines.push(`=== ${data.word} (ID: ${data.id}) ===`);
  
  if (data.radical) {
    lines.push(`部首: ${data.radical}`);
  }
  
  if (data.strokes) {
    lines.push(`總筆畫數: ${data.strokes} (畫)`);
  }
  
  if (data.cantonesePhonic) {
    lines.push(`粵語字音: ${data.cantonesePhonic}`);
  }
  
  if (data.mandarinPhonic) {
    lines.push(`普通話字音: ${data.mandarinPhonic}`);
  }
  
  if (data.strokeOrderImages && data.strokeOrderImages.length > 0) {
    lines.push(`筆順 images:`);
    data.strokeOrderImages.forEach((url, i) => {
      lines.push(`  [${i + 1}] ${url}`);
    });
  }
  
  lines.push(`小學學習字詞表: ${data.hasPrimaryWordList ? 'true' : 'false'}`);
  
  if (data.stage1Words && data.stage1Words.length > 0) {
    lines.push(`第一學習階段詞語:`);
    data.stage1Words.forEach((item) => {
      const parts: string[] = [item.word];
      if (item.cantonesePhonic) {
        parts.push(`粵: ${item.cantonesePhonic}`);
      }
      if (item.mandarinPhonic) {
        parts.push(`普: ${item.mandarinPhonic}`);
      }
      lines.push(`  - ${parts.join(', ')}`);
    });
  }
  
  if (data.stage2Words && data.stage2Words.length > 0) {
    lines.push(`第二學習階段詞語:`);
    data.stage2Words.forEach((item) => {
      const parts: string[] = [item.word];
      if (item.cantonesePhonic) {
        parts.push(`粵: ${item.cantonesePhonic}`);
      }
      if (item.mandarinPhonic) {
        parts.push(`普: ${item.mandarinPhonic}`);
      }
      lines.push(`  - ${parts.join(', ')}`);
    });
  }
  
  lines.push(''); // Empty line between entries
  
  return lines.join('\n');
}

// Main crawling function
async function crawlWords() {
  const wordsToProcess = limit ? words.slice(start, start + limit) : words.slice(start);
  
  console.log(`Starting crawl for ${wordsToProcess.length} words (starting from index ${start})...`);
  console.log(`Output file: ${outputFile}`);
  
  // Clear or create output file
  writeFileSync(outputFile, `EDB Chinese Dictionary Database\nGenerated: ${new Date().toISOString()}\n\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < wordsToProcess.length; i++) {
    const wordEntry = wordsToProcess[i];
    const url = `https://www.edbchinese.hk/lexlist_ch/result.jsp?id=${wordEntry.id}&sortBy=ks&jpC=lshk`;
    
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        console.log(`[${i + 1}/${wordsToProcess.length}] Fetching ${wordEntry.word} (${wordEntry.id})... (${4 - retries}/3)`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          // Add timeout
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        if (!html || html.length < 100) {
          throw new Error('Received empty or too short HTML response');
        }
        
        const extractedData = extractData(html, wordEntry.id, wordEntry.word);
        const textOutput = formatAsText(extractedData);
        
        appendFileSync(outputFile, textOutput);
        successCount++;
        success = true;
        
        // Show sample for first word
        if (i === 0) {
          console.log('\n--- Sample Output ---');
          console.log(textOutput);
          console.log('--- End Sample ---\n');
        }
        
        // Delay to avoid overwhelming the server
        if (i < wordsToProcess.length - 1) {
          await delay(1000); // 1 second delay between requests
        }
        
      } catch (error) {
        retries--;
        let errorMsg: string;
        
        if (error instanceof Error) {
          errorMsg = error.message;
          // Add more details for common errors
          if (error.name === 'AbortError') {
            errorMsg = `Request timeout: ${errorMsg}`;
          } else if (error.message.includes('fetch failed')) {
            errorMsg = `Network error: ${errorMsg}. This might be due to SSL/TLS issues or network connectivity.`;
          }
        } else {
          errorMsg = String(error);
        }
        
        if (retries > 0) {
          console.warn(`  Retrying... (${retries} attempts left). Error: ${errorMsg}`);
          await delay(2000); // Wait 2 seconds before retry
        } else {
          errorCount++;
          console.error(`Error fetching ${wordEntry.word} (${wordEntry.id}): ${errorMsg}`);
          console.error(`  URL: ${url}`);
          
          // Write error to file
          appendFileSync(outputFile, `=== ${wordEntry.word} (ID: ${wordEntry.id}) ===\nERROR: ${errorMsg}\nURL: ${url}\n\n`);
        }
      }
    }
  }
  
  console.log(`\nCrawl completed!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output written to: ${outputFile}`);
}

// Run the crawler
crawlWords().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

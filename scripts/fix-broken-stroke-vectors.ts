#!/usr/bin/env tsx
/**
 * Re-extract strokeVectors for the 11 characters whose data was corrupted
 * by the original setTransform regex bug. Fetches just the EaselJS source
 * for each character, re-parses it with the fixed regex, and writes the
 * corrected strokeVectors back into the existing JSON file (everything
 * else — radical, jyutping, words — is left untouched).
 *
 * Affected characters (single-segment-per-stroke after extraction):
 *   仁 0068 · 導 1055 · 尖 1058 · 尚 1059 · 工 1135 · 己 1141 · 巾 1147 ·
 *   干 1178 · 廷 1222 · 廿 1225 · 弓 1232
 *
 * Usage: tsx scripts/fix-broken-stroke-vectors.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface StrokeVector {
  strokeNumber: number;
  segment: number;
  frame: number;
  pathData: string;
  transform: { x: number; y: number };
  color: string;
}

// === The fixed extractor (mirrors crawl-edbchinese-json.ts:extractStrokeVectors) ===
function extractStrokeVectors(jsContent: string): StrokeVector[] {
  const strokes: StrokeVector[] = [];

  // Stroke-text timeline → frame markers for stroke numbering.
  const textTimelineMatch = jsContent.match(/this\.text.*?\.addTween\([^)]+\)/s);
  const strokeTextFrames: { stroke: number; frame: number }[] = [];
  if (textTimelineMatch) {
    const timelineText = textTimelineMatch[0];
    const waitMatches = Array.from(timelineText.matchAll(/wait\((\d+)\)/g));
    const textMatches = Array.from(timelineText.matchAll(/to\(\{text:"(\d+)"\}/g));
    const waits = waitMatches.map(m => parseInt(m[1], 10));
    const textNumbers = textMatches.map(m => parseInt(m[1], 10));
    let frame = 0;
    strokeTextFrames.push({ stroke: 1, frame: 0 });
    for (let i = 0; i < waits.length; i++) {
      frame += waits[i];
      if (i > 0 && i <= textNumbers.length) {
        strokeTextFrames.push({ stroke: textNumbers[i - 1], frame });
      }
    }
  }

  // FIXED regex: accept setTransform with 2, 3, 4, ... numeric args.
  const shapeRegex =
    /this\.(shape(?:_\d+)?)\s*=\s*new\s+cjs\.Shape\(\);[^}]*?\.p\("([^"]+)"\);[^}]*?setTransform\(([-\d.]+),\s*([-\d.]+)(?:,\s*[-\d.]+)*\)/gs;
  const colorRegex = /\.f\("([^"]+)"\)/;

  const shapeData: Array<{ name: string; path: string; x: number; y: number; color: string }> = [];
  let shapeMatch: RegExpExecArray | null;
  while ((shapeMatch = shapeRegex.exec(jsContent)) !== null) {
    const shapeName = shapeMatch[1];
    const pathData = shapeMatch[2];
    const x = parseFloat(shapeMatch[3]);
    const y = parseFloat(shapeMatch[4]);
    const shapeStart = jsContent.lastIndexOf(`this.${shapeName}`, shapeMatch.index);
    const shapeEnd = shapeMatch.index + shapeMatch[0].length;
    const shapeDef = jsContent.substring(shapeStart, shapeEnd);
    const colorMatch = shapeDef.match(colorRegex);
    const color = colorMatch ? colorMatch[1] : '#000000';
    if (color !== '#999999') {
      shapeData.push({ name: shapeName, path: pathData, x, y, color });
    }
  }

  // Timeline groups (same as the main scraper).
  const timelineGroups: Array<Array<{ shapeName: string; frame: number }>> = [];
  const timelineBlockPattern = /timeline\.addTween\(/g;
  let blockStart: RegExpExecArray | null;
  while ((blockStart = timelineBlockPattern.exec(jsContent)) !== null) {
    const startPos = blockStart.index;
    let depth = 0;
    let pos = startPos;
    let inString = false;
    let stringChar = '';
    while (pos < jsContent.length) {
      const char = jsContent[pos];
      if (!inString) {
        if (char === '"' || char === "'") { inString = true; stringChar = char; }
        else if (char === '(') depth++;
        else if (char === ')') {
          depth--;
          if (depth === 0) {
            const block = jsContent.substring(startPos, pos + 1);
            if (block.includes('state:[{t:this.shape')) {
              const group: Array<{ shapeName: string; frame: number }> = [];
              const shapeFrameRegex = /to\(\{state:\[{t:this\.(shape(?:_\d+)?)}\]\},(\d+)\)/g;
              let m: RegExpExecArray | null;
              let accumulatedFrame = 0;
              while ((m = shapeFrameRegex.exec(block)) !== null) {
                accumulatedFrame += parseInt(m[2], 10);
                group.push({ shapeName: m[1], frame: accumulatedFrame });
              }
              if (group.length > 0) timelineGroups.push(group);
            }
            break;
          }
        }
      } else if (char === stringChar && jsContent[pos - 1] !== '\\') {
        inString = false;
      }
      pos++;
    }
  }

  const sortedGroups = timelineGroups
    .map((group, index) => ({ group, originalIndex: index, firstFrame: group[0]?.frame || 0 }))
    .sort((a, b) => a.firstFrame - b.firstFrame);

  for (let groupIdx = 0; groupIdx < sortedGroups.length; groupIdx++) {
    const { group, firstFrame } = sortedGroups[groupIdx];
    let strokeNumber = groupIdx + 1;
    if (strokeTextFrames.length > 0 && strokeTextFrames.length === sortedGroups.length) {
      const sortedTextFrames = [...strokeTextFrames].sort((a, b) => a.frame - b.frame);
      let closestTextFrame = sortedTextFrames[0];
      let minDiff = Math.abs(firstFrame - closestTextFrame.frame);
      for (const textFrame of sortedTextFrames) {
        const diff = Math.abs(firstFrame - textFrame.frame);
        if (diff < minDiff) { minDiff = diff; closestTextFrame = textFrame; }
      }
      if (firstFrame > sortedTextFrames[sortedTextFrames.length - 1].frame + 20) {
        strokeNumber = 1;
      } else if (minDiff < 30) {
        strokeNumber = closestTextFrame.stroke;
      } else {
        strokeNumber = sortedGroups.length - groupIdx;
      }
    }
    for (let segIdx = 0; segIdx < group.length; segIdx++) {
      const entry = group[segIdx];
      const shape = shapeData.find(s => s.name === entry.shapeName);
      if (shape) {
        strokes.push({
          strokeNumber,
          segment: segIdx + 1,
          frame: entry.frame,
          pathData: shape.path,
          transform: { x: shape.x, y: shape.y },
          color: shape.color,
        });
      }
    }
  }

  strokes.sort((a, b) => a.strokeNumber !== b.strokeNumber ? a.strokeNumber - b.strokeNumber : a.segment - b.segment);
  return strokes;
}

async function main() {
  const dir = 'data/characters';
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));

  // Re-detect affected characters (single-segment-per-stroke).
  const affected: { id: string; ch: string; sourceUrl: string }[] = [];
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const sv: StrokeVector[] = data.strokeVectors || [];
    if (sv.length === 0) continue;
    const counts = new Map<number, number>();
    sv.forEach(s => counts.set(s.strokeNumber, (counts.get(s.strokeNumber) ?? 0) + 1));
    const max = Math.max(...counts.values());
    if (max === 1 && (data.strokeCount ?? 0) >= 2) {
      const url: string | undefined = (data.strokeOrderImages ?? [])[0];
      if (url) affected.push({ id: data.id, ch: data.character, sourceUrl: url });
    }
  }

  console.log(`Found ${affected.length} affected character(s):`);
  affected.forEach(a => console.log(`  ${a.id} ${a.ch}`));

  for (const a of affected) {
    const jsUrl = a.sourceUrl.replace('.html', '.js');
    process.stdout.write(`\nFetching ${a.id} ${a.ch} ... `);
    try {
      // Use curl — Node's fetch hits SSL issues with edbchinese.hk (same
      // workaround the main scraper uses).
      const js = execSync(
        `curl -s -L "${jsUrl}" -H "User-Agent: Mozilla/5.0" --max-time 15`,
        { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 },
      );
      if (!js || js.length < 100) { console.log('empty response'); continue; }
      const newVectors = extractStrokeVectors(js);
      if (newVectors.length === 0) { console.log('no vectors extracted'); continue; }
      const filePath = join(dir, `${a.id}.json`);
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      const oldCount = (data.strokeVectors ?? []).length;
      data.strokeVectors = newVectors;
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      const segByStroke = new Map<number, number>();
      newVectors.forEach(s => segByStroke.set(s.strokeNumber, (segByStroke.get(s.strokeNumber) ?? 0) + 1));
      const summary = Array.from(segByStroke.entries()).sort().map(([k, v]) => `${k}:${v}`).join(' ');
      console.log(`✓ ${oldCount} → ${newVectors.length} vectors (segments per stroke: ${summary})`);
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

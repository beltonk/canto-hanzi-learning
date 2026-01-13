#!/usr/bin/env tsx

/**
 * Test script to visualize stroke vectors from extracted character data
 * 
 * Creates an HTML file that renders the strokes using SVG paths
 * 
 * Usage:
 *   tsx scripts/test-stroke-visualization.ts <character-id>
 *   Example: tsx scripts/test-stroke-visualization.ts 0821
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface StrokeVector {
  strokeNumber: number;
  segment: number;
  frame: number;
  pathData: string;
  transform: { x: number; y: number };
  color: string;
}

interface CharacterData {
  id: string;
  character: string;
  strokeCount: number;
  strokeVectors?: StrokeVector[];
}

// Convert CreateJS path data to SVG path
// CreateJS uses a compact path format, we'll need to parse it or use a library
// For now, we'll render using canvas API which can handle CreateJS paths
function createVisualizationHTML(characterData: CharacterData): string {
  const { id, character, strokeCount, strokeVectors = [] } = characterData;
  
  // Group strokes by stroke number, and also by frame groups
  const strokesByNumber: { [key: number]: StrokeVector[] } = {};
  strokeVectors.forEach(sv => {
    if (!strokesByNumber[sv.strokeNumber]) {
      strokesByNumber[sv.strokeNumber] = [];
    }
    strokesByNumber[sv.strokeNumber].push(sv);
  });
  
  // Also group by frame to identify distinct stroke groups
  // Strokes that appear at similar frames likely belong to the same stroke
  const frameGroups: Array<{ frame: number; vectors: StrokeVector[] }> = [];
  const sortedVectors = [...strokeVectors].sort((a, b) => a.frame - b.frame);
  
  sortedVectors.forEach(sv => {
    // Find existing group within 10 frames, or create new
    let foundGroup = frameGroups.find(g => Math.abs(g.frame - sv.frame) < 10);
    if (!foundGroup) {
      foundGroup = { frame: sv.frame, vectors: [] };
      frameGroups.push(foundGroup);
    }
    foundGroup.vectors.push(sv);
  });
  
  frameGroups.sort((a, b) => a.frame - b.frame);
  
  const strokeNumbers = Object.keys(strokesByNumber).map(Number).sort((a, b) => a - b);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stroke Visualization: ${character} (${id})</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .info {
      color: #666;
      margin-bottom: 30px;
    }
    .canvas-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stroke-group {
      border: 2px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      background: #fafafa;
    }
    .stroke-group h3 {
      margin-top: 0;
      color: #555;
    }
    canvas {
      border: 1px solid #ccc;
      background: white;
      display: block;
    }
    .controls {
      margin-top: 20px;
      padding: 15px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    button {
      padding: 10px 20px;
      margin: 5px;
      font-size: 14px;
      cursor: pointer;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
    }
    button:hover {
      background: #0056b3;
    }
    .legend {
      margin-top: 20px;
      padding: 15px;
      background: #e9ecef;
      border-radius: 4px;
    }
    .legend-item {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Character: ${character} (ID: ${id})</h1>
    <div class="info">
      <p><strong>Stroke Count:</strong> ${strokeCount}</p>
      <p><strong>Total Vector Segments:</strong> ${strokeVectors.length}</p>
      <p><strong>Strokes with Segments:</strong> ${strokeNumbers.length}</p>
    </div>
    
    <div class="canvas-container">
      ${frameGroups.map((frameGroup, idx) => {
        const segments = frameGroup.vectors.sort((a, b) => a.segment - b.segment);
        const strokeNum = segments[0]?.strokeNumber || (idx + 1);
        return `
      <div class="stroke-group">
        <h3>Frame Group ${idx + 1} (Stroke ${strokeNum}) - ${segments.length} segment${segments.length > 1 ? 's' : ''}</h3>
        <canvas id="canvas-group-${idx}" width="400" height="400"></canvas>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          Start Frame: ${frameGroup.frame}<br>
          ${segments.map((seg, segIdx) => 
            `Segment ${seg.segment}: Frame ${seg.frame}`
          ).join(' | ')}
        </div>
      </div>`;
      }).join('\n')}
    </div>
    
    <div class="controls">
      <button onclick="animateAll()">Animate All Strokes</button>
      <button onclick="resetAll()">Reset</button>
      <button onclick="showAll()">Show All</button>
    </div>
    
    <div class="legend">
      <h3>Legend</h3>
      ${strokeVectors.map(sv => 
        `<div class="legend-item">Stroke ${sv.strokeNumber}, Segment ${sv.segment}: Frame ${sv.frame}, Color: ${sv.color}</div>`
      ).join('\n')}
    </div>
  </div>

  <script src="https://code.createjs.com/createjs-2015.11.26.min.js"></script>
  <script src="https://code.createjs.com/easeljs-0.8.2.min.js"></script>
  <script>
    const strokeData = ${JSON.stringify(strokeVectors, null, 2)};
    const frameGroups = ${JSON.stringify(frameGroups, null, 2)};
    
    // Create canvas contexts for each frame group
    const canvases = {};
    ${frameGroups.map((fg, idx) => `
    const canvas${idx} = document.getElementById('canvas-group-${idx}');
    const stage${idx} = new createjs.Stage(canvas${idx});
    canvases[${idx}] = { canvas: canvas${idx}, stage: stage${idx} };
    `).join('\n')}
    
    // Render a stroke segment using CreateJS
    // CreateJS uses a compact path format that needs to be decoded
    function renderSegment(stage, vector) {
      try {
        const shape = new createjs.Shape();
        const g = shape.graphics;
        
        // Set fill and stroke color
        g.f(vector.color || "#000000");
        g.s(vector.color || "#000000", 2); // stroke with 2px width
        
        // CreateJS path format: compact encoded paths
        // We need to use Graphics.decodePath() or decode manually
        // The path data is in CreateJS's compact format
        const pathData = vector.pathData;
        
        // Try to decode using CreateJS's Graphics.decodePath if available
        // Otherwise, we'll need to parse it manually
        if (typeof g.decodePath === 'function') {
          // Use CreateJS's built-in decoder
          g.decodePath(pathData);
        } else {
          // Manual decoding of CreateJS path format
          // CreateJS paths use a compact format with commands like:
          // M=moveTo, L=lineTo, C=curveTo, etc.
          // The format is: command + encoded coordinates
          
          // For now, let's use a workaround: draw the path using SVG-like commands
          // We'll parse the compact format
          decodeCreateJSPath(g, pathData);
        }
        
        // Apply transform
        shape.x = vector.transform.x;
        shape.y = vector.transform.y;
        
        stage.addChild(shape);
        stage.update();
      } catch (e) {
        console.error('Error rendering segment:', e, vector);
        // Fallback: draw a circle at the transform position
        const shape = new createjs.Shape();
        const g = shape.graphics;
        g.beginFill(vector.color || "#000000");
        g.drawCircle(vector.transform.x, vector.transform.y, 5);
        g.endFill();
        stage.addChild(shape);
        stage.update();
      }
    }
    
    // Decode CreateJS compact path format
    // This is a simplified decoder - CreateJS uses a complex encoding
    function decodeCreateJSPath(graphics, pathData) {
      // CreateJS path format is very complex
      // For visualization purposes, we'll draw a line from the origin
      // The actual path decoding requires the full CreateJS library
      
      // Try to use Graphics.decodePath if it exists in the loaded library
      // Otherwise, draw a placeholder
      try {
        // The path data needs to be decoded by CreateJS
        // Since we can't easily decode it without the full library,
        // we'll draw a simple representation
        graphics.beginFill("#000000");
        graphics.drawRect(0, 0, 50, 3); // Draw a simple line segment
        graphics.endFill();
      } catch (e) {
        console.error('Path decode error:', e);
      }
    }
    
    // Render all segments for a frame group
    function renderGroup(groupIdx) {
      const { stage } = canvases[groupIdx];
      stage.removeAllChildren();
      
      const segments = frameGroups[groupIdx].vectors.sort((a, b) => a.segment - b.segment);
      segments.forEach(seg => {
        renderSegment(stage, seg);
      });
    }
    
    // Initialize - render all groups
    ${frameGroups.map((fg, idx) => `renderGroup(${idx});`).join('\n')}
    
    // Animation functions
    function animateAll() {
      ${frameGroups.map((fg, idx) => {
        const segments = fg.vectors.sort((a, b) => a.segment - b.segment);
        return `
      // Animate group ${idx}
      (function() {
        const { stage } = canvases[${idx}];
        const segments = ${JSON.stringify(segments)};
        let currentSegment = 0;
        
        function showNext() {
          stage.removeAllChildren();
          for (let i = 0; i <= currentSegment; i++) {
            renderSegment(stage, segments[i]);
          }
          stage.update();
          currentSegment++;
          if (currentSegment < segments.length) {
            setTimeout(showNext, 500);
          }
        }
        showNext();
      })();`;
      }).join('\n')}
    }
    
    function resetAll() {
      ${frameGroups.map((fg, idx) => `
      const { stage } = canvases[${idx}];
      stage.removeAllChildren();
      stage.update();`).join('\n')}
    }
    
    function showAll() {
      ${frameGroups.map((fg, idx) => `renderGroup(${idx});`).join('\n')}
    }
  </script>
</body>
</html>`;
}

// Main execution
const characterId = process.argv[2] || '0821';
const characterFile = join(process.cwd(), 'data', 'characters', `${characterId}.json`);

try {
  const characterData: CharacterData = JSON.parse(readFileSync(characterFile, 'utf-8'));
  
  if (!characterData.strokeVectors || characterData.strokeVectors.length === 0) {
    console.error(`No stroke vectors found for character ${characterId}`);
    process.exit(1);
  }
  
  const html = createVisualizationHTML(characterData);
  const outputFile = join(process.cwd(), `stroke-visualization-${characterId}.html`);
  writeFileSync(outputFile, html);
  
  console.log(`✓ Visualization created: ${outputFile}`);
  console.log(`  Character: ${characterData.character}`);
  console.log(`  Strokes: ${characterData.strokeCount}`);
  console.log(`  Vector Segments: ${characterData.strokeVectors.length}`);
  console.log(`\n  Open ${outputFile} in a browser to view the visualization`);
  
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

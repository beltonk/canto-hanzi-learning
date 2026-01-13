#!/usr/bin/env tsx

/**
 * Simplified stroke visualization that actually renders the paths
 * Uses SVG instead of CreateJS for better compatibility
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

function createVisualizationHTML(characterData: CharacterData): string {
  const { id, character, strokeCount, strokeVectors = [] } = characterData;
  
  // Group by stroke number (this is what we want to verify)
  const strokeGroups: { [key: number]: StrokeVector[] } = {};
  strokeVectors.forEach(sv => {
    if (!strokeGroups[sv.strokeNumber]) {
      strokeGroups[sv.strokeNumber] = [];
    }
    strokeGroups[sv.strokeNumber].push(sv);
  });
  
  // Sort strokes and their segments
  const sortedStrokeNumbers = Object.keys(strokeGroups).map(Number).sort((a, b) => a - b);
  sortedStrokeNumbers.forEach(strokeNum => {
    strokeGroups[strokeNum].sort((a, b) => a.segment - b.segment);
  });
  
  // Also group by frame for frame-based visualization
  const frameGroups: Array<{ frame: number; vectors: StrokeVector[] }> = [];
  const sortedVectors = [...strokeVectors].sort((a, b) => a.frame - b.frame);
  
  sortedVectors.forEach(sv => {
    let foundGroup = frameGroups.find(g => Math.abs(g.frame - sv.frame) < 10);
    if (!foundGroup) {
      foundGroup = { frame: sv.frame, vectors: [] };
      frameGroups.push(foundGroup);
    }
    foundGroup.vectors.push(sv);
  });
  
  frameGroups.sort((a, b) => a.frame - b.frame);
  
  // The coordinates are in a 1080x1080 canvas coordinate system
  // We need to transform them to our 400x400 SVG viewBox
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1080;
  
  // Calculate global bounds for all strokes
  const allX = strokeVectors.map(v => v.transform.x);
  const allY = strokeVectors.map(v => v.transform.y);
  const globalMinX = Math.min(...allX);
  const globalMaxX = Math.max(...allX);
  const globalMinY = Math.min(...allY);
  const globalMaxY = Math.max(...allY);
  
  // Calculate the actual bounds used in the canvas (might not use full 1080x1080)
  const usedWidth = globalMaxX - globalMinX;
  const usedHeight = globalMaxY - globalMinY;
  
  // Add padding (10% on each side)
  const paddingX = usedWidth * 0.1;
  const paddingY = usedHeight * 0.1;
  const paddedWidth = usedWidth + paddingX * 2;
  const paddedHeight = usedHeight + paddingY * 2;
  
  // Scale to fit in 400x400 viewBox
  const globalScale = Math.min(350 / paddedWidth, 350 / paddedHeight, 1);
  
  // Center the character in the viewBox
  const centerX = (globalMinX + globalMaxX) / 2;
  const centerY = (globalMinY + globalMaxY) / 2;
  const globalOffsetX = 200 - centerX * globalScale;
  const globalOffsetY = 200 - centerY * globalScale;
  
  // Helper function to convert world coordinates to SVG coordinates
  function worldToSVG(x: number, y: number): { x: number; y: number } {
    return {
      x: x * globalScale + globalOffsetX,
      y: y * globalScale + globalOffsetY
    };
  }
  
  // Create SVG paths - we'll use the transform positions to draw lines
  // Since we can't easily decode CreateJS paths, we'll visualize the stroke structure
  function createSVGPath(vectors: StrokeVector[], groupIndex: number, useGlobalCoords: boolean = false): string {
    const paths: string[] = [];
    
    // Use global coordinate system if requested, otherwise calculate local bounds
    let scale = globalScale;
    let offsetX = globalOffsetX;
    let offsetY = globalOffsetY;
    
    if (!useGlobalCoords) {
      const xs = vectors.map(v => v.transform.x);
      const ys = vectors.map(v => v.transform.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX || 400;
      const height = maxY - minY || 400;
      scale = Math.min(350 / width, 350 / height, 1);
      offsetX = 200 - (minX + maxX) / 2 * scale;
      offsetY = 200 - (minY + maxY) / 2 * scale;
    }
    
    // Sort by segment number for proper connection
    const sortedVectors = [...vectors].sort((a, b) => {
      if (a.strokeNumber !== b.strokeNumber) return a.strokeNumber - b.strokeNumber;
      return a.segment - b.segment;
    });
    
    sortedVectors.forEach((vec, idx) => {
      const x = vec.transform.x * scale + offsetX;
      const y = vec.transform.y * scale + offsetY;
      
      // Draw a circle at each transform point to show where the path is
      // Make circles slightly larger for better visibility
      paths.push(`<circle cx="${x}" cy="${y}" r="5" fill="${vec.color || '#000'}" opacity="0.9" class="segment-${vec.strokeNumber}-${vec.segment}" data-stroke="${vec.strokeNumber}" data-segment="${vec.segment}" data-frame="${vec.frame}"/>`);
      
      // Draw a line connecting segments of the same stroke
      // Only connect if they're consecutive segments of the same stroke
      if (idx > 0 && vec.strokeNumber === sortedVectors[idx - 1].strokeNumber && vec.segment === sortedVectors[idx - 1].segment + 1) {
        const prevX = sortedVectors[idx - 1].transform.x * scale + offsetX;
        const prevY = sortedVectors[idx - 1].transform.y * scale + offsetY;
        paths.push(`<line x1="${prevX}" y1="${prevY}" x2="${x}" y2="${y}" stroke="${vec.color || '#000'}" stroke-width="4" opacity="0.7" class="stroke-${vec.strokeNumber}" data-stroke="${vec.strokeNumber}" data-segment="${vec.segment}"/>`);
      }
    });
    
    return paths.join('\n');
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stroke Visualization: ${character} (${id})</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1400px;
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
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .combined-view {
      margin-bottom: 40px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
      border: 2px solid #ddd;
    }
    .combined-view svg {
      border: 2px solid #333;
      background: white;
      display: block;
      width: 100%;
      max-width: 600px;
      height: 600px;
      margin: 0 auto 20px;
    }
    .controls-inline {
      text-align: center;
    }
    .canvas-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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
      font-size: 16px;
    }
    svg {
      border: 1px solid #ccc;
      background: white;
      display: block;
      width: 100%;
      height: 400px;
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
    .segment-info {
      margin-top: 10px;
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    .legend {
      margin-top: 20px;
      padding: 15px;
      background: #e9ecef;
      border-radius: 4px;
      font-size: 12px;
    }
    .legend-item {
      margin: 5px 0;
      padding: 5px;
      background: white;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Character: ${character} (ID: ${id})</h1>
    <div class="info">
      <p><strong>Stroke Count:</strong> ${strokeCount}</p>
      <p><strong>Total Vector Segments:</strong> ${strokeVectors.length}</p>
      <p><strong>Strokes Found:</strong> ${sortedStrokeNumbers.length}</p>
      <p><strong>Frame Groups:</strong> ${frameGroups.length}</p>
      <p><em>Note: Segments represent animation timing within each stroke. Each stroke is drawn with multiple segments appearing sequentially.</em></p>
    </div>
    
    <h2>Combined View - All Strokes (Relative Positioning)</h2>
    <div class="combined-view">
      <p style="text-align: center; color: #666; margin-bottom: 10px;">
        <strong>Note:</strong> This shows transform positions. The actual stroke paths extend from these points.
        For character 士, the vertical stroke should connect the two horizontal strokes.
      </p>
      <svg id="svg-combined" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        ${sortedStrokeNumbers.map((strokeNum) => {
          const segments = strokeGroups[strokeNum];
          return createSVGPath(segments, strokeNum, true);
        }).join('\n')}
      </svg>
      <div class="controls-inline">
        <button onclick="animateCombined()">Animate All Strokes</button>
        <button onclick="resetCombined()">Reset</button>
      </div>
    </div>
    
    <h2>Individual Strokes</h2>
    <div class="canvas-container">
      ${sortedStrokeNumbers.map((strokeNum, idx) => {
        const segments = strokeGroups[strokeNum];
        const svgPath = createSVGPath(segments, idx);
        const firstFrame = Math.min(...segments.map(s => s.frame));
        const lastFrame = Math.max(...segments.map(s => s.frame));
        return `
      <div class="stroke-group">
        <h3>Stroke ${strokeNum} - ${segments.length} segment${segments.length > 1 ? 's' : ''}</h3>
        <svg id="svg-stroke-${strokeNum}" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          ${svgPath}
        </svg>
        <div class="segment-info">
          <strong>Frames:</strong> ${firstFrame} - ${lastFrame}<br>
          <strong>Segments:</strong><br>
          ${segments.map((seg) => 
            `Segment ${seg.segment} (Frame ${seg.frame}): (${seg.transform.x.toFixed(1)}, ${seg.transform.y.toFixed(1)})`
          ).join('<br>')}
        </div>
      </div>`;
      }).join('\n')}
    </div>
    
    <h2>Visualization by Frame Timing</h2>
    <div class="canvas-container">
      ${frameGroups.map((frameGroup, idx) => {
        const segments = frameGroup.vectors.sort((a, b) => a.segment - b.segment);
        const strokeNum = segments[0]?.strokeNumber || (idx + 1);
        const svgPath = createSVGPath(segments, idx);
        return `
      <div class="stroke-group">
        <h3>Frame Group ${idx + 1} (Stroke ${strokeNum}) - ${segments.length} segment${segments.length > 1 ? 's' : ''}</h3>
        <svg id="svg-group-${idx}" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          ${svgPath}
        </svg>
        <div class="segment-info">
          <strong>Start Frame:</strong> ${frameGroup.frame}<br>
          ${segments.map((seg, segIdx) => 
            `Segment ${seg.segment} (Frame ${seg.frame}): (${seg.transform.x.toFixed(1)}, ${seg.transform.y.toFixed(1)})`
          ).join('<br>')}
        </div>
      </div>`;
      }).join('\n')}
    </div>
    
    <div class="controls">
      <button onclick="animateStrokes()">Animate Strokes Sequentially</button>
      <button onclick="highlightStrokes()">Highlight by Stroke Number</button>
      <button onclick="highlightFrames()">Highlight by Frame</button>
      <button onclick="resetHighlight()">Reset</button>
    </div>
    
    <div class="legend">
      <h3>Legend</h3>
      <p>Each circle represents a segment's transform position. Lines connect segments of the same stroke.</p>
      ${strokeVectors.map(sv => 
        `<div class="legend-item">Stroke ${sv.strokeNumber}, Segment ${sv.segment}: Frame ${sv.frame}, Position (${sv.transform.x.toFixed(1)}, ${sv.transform.y.toFixed(1)}), Color: ${sv.color}</div>`
      ).join('\n')}
    </div>
  </div>

  <script>
    const frameGroups = ${JSON.stringify(frameGroups, null, 2)};
    const strokeGroups = ${JSON.stringify(strokeGroups, null, 2)};
    const sortedStrokeNumbers = ${JSON.stringify(sortedStrokeNumbers)};
    const allVectors = ${JSON.stringify(strokeVectors.sort((a, b) => {
      if (a.strokeNumber !== b.strokeNumber) return a.strokeNumber - b.strokeNumber;
      return a.segment - b.segment;
    }), null, 2)};
    
    let animationInterval = null;
    
    function animateCombined() {
      resetCombined();
      const svg = document.getElementById('svg-combined');
      if (!svg) return;
      
      // Get all elements
      const circles = Array.from(svg.querySelectorAll('circle'));
      const lines = Array.from(svg.querySelectorAll('line'));
      
      // Sort by stroke number, then by frame
      circles.sort((a, b) => {
        const strokeA = parseInt(a.getAttribute('data-stroke') || '0');
        const strokeB = parseInt(b.getAttribute('data-stroke') || '0');
        if (strokeA !== strokeB) return strokeA - strokeB;
        const frameA = parseInt(a.getAttribute('data-frame') || '0');
        const frameB = parseInt(b.getAttribute('data-frame') || '0');
        return frameA - frameB;
      });
      
      lines.sort((a, b) => {
        const strokeA = parseInt(a.getAttribute('data-stroke') || '0');
        const strokeB = parseInt(b.getAttribute('data-stroke') || '0');
        if (strokeA !== strokeB) return strokeA - strokeB;
        const segA = parseInt(a.getAttribute('data-segment') || '0');
        const segB = parseInt(b.getAttribute('data-segment') || '0');
        return segA - segB;
      });
      
      // Hide all initially
      circles.forEach(c => {
        c.setAttribute('opacity', '0');
        c.setAttribute('r', '4');
      });
      lines.forEach(l => {
        l.setAttribute('opacity', '0');
        l.setAttribute('stroke-width', '3');
      });
      
      // Animate sequentially
      let currentIndex = 0;
      const animateStep = () => {
        if (currentIndex >= circles.length) {
          clearInterval(animationInterval);
          animationInterval = null;
          return;
        }
        
        const circle = circles[currentIndex];
        const strokeNum = parseInt(circle.getAttribute('data-stroke') || '0');
        const segment = parseInt(circle.getAttribute('data-segment') || '0');
        
        // Show this circle
        circle.setAttribute('opacity', '1');
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', '#ff0000');
        
        // Show line to previous segment if exists
        if (currentIndex > 0) {
          const prevCircle = circles[currentIndex - 1];
          const prevStroke = parseInt(prevCircle.getAttribute('data-stroke') || '0');
          if (prevStroke === strokeNum) {
            // Find the line connecting these two segments
            const line = lines.find(l => {
              const lStroke = parseInt(l.getAttribute('data-stroke') || '0');
              const lSeg = parseInt(l.getAttribute('data-segment') || '0');
              return lStroke === strokeNum && lSeg === segment;
            });
            if (line) {
              line.setAttribute('opacity', '1');
              line.setAttribute('stroke-width', '4');
              line.setAttribute('stroke', '#ff0000');
            }
          }
        }
        
        currentIndex++;
      };
      
      animationInterval = setInterval(animateStep, 150);
    }
    
    function resetCombined() {
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      
      const svg = document.getElementById('svg-combined');
      if (!svg) return;
      
      const circles = svg.querySelectorAll('circle');
      const lines = svg.querySelectorAll('line');
      
      circles.forEach(c => {
        c.setAttribute('opacity', '0.8');
        c.setAttribute('r', '4');
        c.setAttribute('fill', '#000000');
      });
      
      lines.forEach(l => {
        l.setAttribute('opacity', '0.6');
        l.setAttribute('stroke-width', '3');
        l.setAttribute('stroke', '#000000');
      });
    }
    
    function animateStrokes() {
      resetHighlight();
      sortedStrokeNumbers.forEach((strokeNum, idx) => {
        setTimeout(() => {
          const svg = document.getElementById('svg-stroke-' + strokeNum);
          if (svg) {
            const circles = svg.querySelectorAll('circle');
            const lines = svg.querySelectorAll('line');
            circles.forEach(circle => {
              circle.setAttribute('r', '8');
              circle.setAttribute('opacity', '1');
              circle.setAttribute('fill', '#00ff00');
            });
            lines.forEach(line => {
              line.setAttribute('stroke-width', '5');
              line.setAttribute('opacity', '1');
              line.setAttribute('stroke', '#00ff00');
            });
          }
        }, idx * 1000);
      });
    }
    
    function highlightStrokes() {
      // Reset all
      resetHighlight();
      
      // Group by stroke number and highlight
      const strokeNumbers = [...new Set(frameGroups.flatMap(g => g.vectors.map(v => v.strokeNumber)))].sort((a, b) => a - b);
      
      strokeNumbers.forEach((strokeNum, idx) => {
        setTimeout(() => {
          frameGroups.forEach((group, groupIdx) => {
            const svg = document.getElementById('svg-group-' + groupIdx);
            if (svg) {
              // Highlight circles
              const circles = svg.querySelectorAll('circle');
              circles.forEach(circle => {
                const stroke = parseInt(circle.getAttribute('data-stroke') || '0');
                if (stroke === strokeNum) {
                  circle.setAttribute('r', '8');
                  circle.setAttribute('opacity', '1');
                  circle.setAttribute('fill', '#ff0000');
                } else {
                  circle.setAttribute('opacity', '0.2');
                }
              });
              
              // Highlight lines
              const lines = svg.querySelectorAll('line');
              lines.forEach(line => {
                const classes = line.getAttribute('class') || '';
                if (classes.includes('stroke-' + strokeNum)) {
                  line.setAttribute('stroke-width', '5');
                  line.setAttribute('opacity', '1');
                  line.setAttribute('stroke', '#ff0000');
                } else {
                  line.setAttribute('opacity', '0.1');
                }
              });
            }
          });
        }, idx * 800);
      });
    }
    
    function highlightFrames() {
      resetHighlight();
      frameGroups.forEach((group, idx) => {
        setTimeout(() => {
          const svg = document.getElementById('svg-group-' + idx);
          if (svg) {
            const circles = svg.querySelectorAll('circle');
            const lines = svg.querySelectorAll('line');
            circles.forEach(circle => {
              circle.setAttribute('r', '8');
              circle.setAttribute('opacity', '1');
              circle.setAttribute('fill', '#0066ff');
            });
            lines.forEach(line => {
              line.setAttribute('stroke-width', '5');
              line.setAttribute('opacity', '1');
              line.setAttribute('stroke', '#0066ff');
            });
          }
        }, idx * 800);
      });
    }
    
    function resetHighlight() {
      frameGroups.forEach((group, idx) => {
        const svg = document.getElementById('svg-group-' + idx);
        if (svg) {
          const circles = svg.querySelectorAll('circle');
          const lines = svg.querySelectorAll('line');
          circles.forEach(circle => {
            circle.setAttribute('r', '4');
            circle.setAttribute('opacity', '0.8');
            circle.setAttribute('fill', '#000000');
          });
          lines.forEach(line => {
            line.setAttribute('stroke-width', '3');
            line.setAttribute('opacity', '0.6');
            line.setAttribute('stroke', '#000000');
          });
        }
      });
    }
    
    console.log('Visualization loaded. Frame groups:', frameGroups);
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

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { StrokeVector } from "@/types/fullCharacter";
import Script from "next/script";

interface StrokeAnimationProps {
  strokeVectors?: StrokeVector[];
  character: string;
  size?: number;
  showAnimation?: boolean; // If true, start with animation mode
  onAnimationEnd?: () => void;
}

interface StrokeGroup {
  strokeNumber: number;
  segments: StrokeVector[];
}

declare global {
  interface Window {
    createjs: {
      Stage: new (canvas: HTMLCanvasElement) => {
        addChild: (child: unknown) => void;
        removeAllChildren: () => void;
        update: () => void;
        clear: () => void;
      };
      Shape: new () => {
        graphics: {
          f: (color: string) => unknown;
          s: (color: string, width?: number) => unknown;
          p: (pathData: string) => unknown;
        };
        x: number;
        y: number;
      };
    };
  }
}

// Global flag for CreateJS loaded state
let createJSLoadedGlobal = false;

/**
 * StrokeAnimation Component - uses CreateJS EaselJS for accurate path rendering
 */
export default function StrokeAnimation({
  strokeVectors,
  character,
  size = 220,
  showAnimation = false,
  onAnimationEnd,
}: StrokeAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<ReturnType<typeof window.createjs.Stage> | null>(null);
  const [createJSLoaded, setCreateJSLoaded] = useState(createJSLoadedGlobal);
  
  // Group strokes by strokeNumber
  const strokeGroups = useMemo((): StrokeGroup[] => {
    if (!strokeVectors || strokeVectors.length === 0) return [];
    
    const groups = new Map<number, StrokeVector[]>();
    strokeVectors.forEach(sv => {
      const existing = groups.get(sv.strokeNumber) || [];
      existing.push(sv);
      groups.set(sv.strokeNumber, existing);
    });
    
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([strokeNum, segments]) => ({
        strokeNumber: strokeNum,
        segments: segments.sort((a, b) => a.frame - b.frame),
      }));
  }, [strokeVectors]);

  const totalStrokes = strokeGroups.length;
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(-1);
  const [currentSegment, setCurrentSegment] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize stage when CreateJS loads
  useEffect(() => {
    if (!createJSLoaded || !canvasRef.current || typeof window === 'undefined' || !window.createjs) return;
    
    stageRef.current = new window.createjs.Stage(canvasRef.current);
  }, [createJSLoaded]);

  // Draw function using CreateJS EaselJS
  const drawStrokes = useCallback((strokeLimit: number = -1, segmentLimit: number = -1, showGuide: boolean = false) => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || !createJSLoaded || typeof window === 'undefined' || !window.createjs) return;
    
    // Clear stage
    stage.removeAllChildren();
    
    // Draw background and grid with raw canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1080, 1080);
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.strokeStyle = '#E8D5C4';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(540, 0);
      ctx.lineTo(540, 1080);
      ctx.moveTo(0, 540);
      ctx.lineTo(1080, 540);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw grey guide (complete character) as background during animation
    if (showGuide) {
      strokeGroups.forEach(group => {
        const seg = group.segments[group.segments.length - 1];
        const shape = new window.createjs.Shape();
        const g = shape.graphics;
        g.f('#CCCCCC'); // Light grey guide
        g.p(seg.pathData);
        shape.x = seg.transform.x;
        shape.y = seg.transform.y;
        stage.addChild(shape);
      });
    }
    
    // Determine which segments to draw
    const toDraw: { segment: StrokeVector }[] = [];
    
    if (strokeLimit < 0) {
      // Show all final segments (complete character)
      strokeGroups.forEach(group => {
        const seg = group.segments[group.segments.length - 1];
        toDraw.push({ segment: seg });
      });
    } else {
      // Show up to strokeLimit
      for (let i = 0; i <= strokeLimit && i < strokeGroups.length; i++) {
        const group = strokeGroups[i];
        const isCurrentStroke = i === strokeLimit;
        const segIdx = isCurrentStroke 
          ? Math.min(segmentLimit, group.segments.length - 1)
          : group.segments.length - 1;
        const seg = group.segments[segIdx];
        toDraw.push({ segment: seg });
      }
    }
    
    // Draw each segment using CreateJS Shape - black color
    toDraw.forEach(({ segment }) => {
      const shape = new window.createjs.Shape();
      const g = shape.graphics;
      g.f('#2D3436'); // Black stroke
      g.p(segment.pathData);
      shape.x = segment.transform.x;
      shape.y = segment.transform.y;
      stage.addChild(shape);
    });
    
    stage.update();
  }, [createJSLoaded, strokeGroups]);

  // Draw complete character when loaded or character changes
  useEffect(() => {
    if (createJSLoaded && stageRef.current && !isAnimating) {
      drawStrokes(-1, -1, false);
    }
  }, [createJSLoaded, character, drawStrokes, isAnimating]);

  // Animation effect - smooth animation with grey guide background
  useEffect(() => {
    if (!isAnimating || currentStroke < 0) return;
    
    const group = strokeGroups[currentStroke];
    if (!group) {
      setIsAnimating(false);
      setCurrentStroke(-1);
      onAnimationEnd?.();
      return;
    }
    
    // Draw current state with grey guide background
    drawStrokes(currentStroke, currentSegment, true);
    
    // Smoother framerate: 50ms per segment (20fps), min 800ms per stroke
    const segmentCount = group.segments.length;
    const msPerSegment = Math.max(50, Math.floor(800 / segmentCount));
    
    // Schedule next frame
    timerRef.current = setTimeout(() => {
      if (currentSegment < group.segments.length - 1) {
        // Next segment of current stroke
        setCurrentSegment(s => s + 1);
      } else if (currentStroke < totalStrokes - 1) {
        // Next stroke - small pause between strokes
        timerRef.current = setTimeout(() => {
          setCurrentStroke(s => s + 1);
          setCurrentSegment(0);
        }, 150);
      } else {
        // Animation complete - show full character (no guide)
        setIsAnimating(false);
        setCurrentStroke(-1);
        drawStrokes(-1, -1, false);
        onAnimationEnd?.();
      }
    }, msPerSegment);
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isAnimating, currentStroke, currentSegment, strokeGroups, totalStrokes, drawStrokes, onAnimationEnd]);

  // Start animation
  const startAnimation = useCallback(() => {
    setCurrentStroke(0);
    setCurrentSegment(0);
    setIsAnimating(true);
  }, []);

  // Stop and show complete
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    setCurrentStroke(-1);
    setCurrentSegment(0);
    drawStrokes(-1, -1, false);
  }, [drawStrokes]);

  // Handle showAnimation prop - start or stop based on prop
  useEffect(() => {
    if (showAnimation && createJSLoaded && stageRef.current && !isAnimating) {
      startAnimation();
    } else if (!showAnimation && isAnimating) {
      // Stop animation when showAnimation becomes false
      stopAnimation();
    }
  }, [showAnimation, createJSLoaded, startAnimation, stopAnimation, isAnimating]);

  // Reset animation when character changes
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsAnimating(false);
    setCurrentStroke(-1);
    setCurrentSegment(0);
  }, [character]);

  // Handle CreateJS load
  const handleCreateJSLoad = useCallback(() => {
    createJSLoadedGlobal = true;
    setCreateJSLoaded(true);
  }, []);

  if (!strokeVectors || strokeVectors.length === 0) {
    return (
      <div className="bg-[#FFFBF0] rounded-xl border-2 border-[#FFE5B4] flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center text-[#B2BEC3]">
          <div className="text-4xl mb-2">✏️</div>
          <div className="text-sm">暫無筆順資料</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Load CreateJS EaselJS */}
      <Script 
        src="https://code.createjs.com/1.0.0/easeljs.min.js"
        onLoad={handleCreateJSLoad}
        strategy="afterInteractive"
      />
      
      <div className="relative bg-[#FFFBF0] rounded-xl border-2 border-[#FFE5B4] overflow-hidden" style={{ width: size, height: size }}>
        {/* Canvas for stroke rendering */}
        <canvas 
          ref={canvasRef}
          width={1080}
          height={1080}
          style={{ width: size, height: size }}
          className="absolute inset-0"
        />

        {!createJSLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FFFBF0]/80">
            <div className="text-sm text-[#636E72]">載入中...</div>
          </div>
        )}

        {/* Stroke counter during animation */}
        {isAnimating && (
          <>
            <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#636E72]">
              {currentStroke + 1}/{totalStrokes}
            </div>
            <div className="absolute top-2 left-2 bg-[#FF6B6B] rounded-full px-2 py-0.5 text-xs text-white">
              播放中
            </div>
          </>
        )}
      </div>

      {/* Simple controls */}
      <div className="mt-3 flex items-center gap-2">
        <button 
          onClick={isAnimating ? stopAnimation : startAnimation} 
          className="px-4 py-2 rounded-lg bg-[#FF6B6B] text-white text-sm font-medium hover:bg-[#E55555] transition-colors"
        >
          {isAnimating ? "⏹ 停止" : "✏️ 顯示筆順"}
        </button>
      </div>
      <p className="text-xs text-[#7A8288] mt-1.5">共 {totalStrokes} 筆</p>
    </div>
  );
}

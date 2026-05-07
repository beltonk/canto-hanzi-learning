/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { StrokeVector } from '@/types/fullCharacter';
import Script from 'next/script';
import type { Point } from '@/lib/tracing/svgPathParse';
import {
  buildExpectedMask,
  computeDistanceField,
  computeStars,
  matchStrokeByMask,
  type ExpectedStrokeMask,
} from '@/lib/tracing/match';
import { useReducedMotion } from '@/lib/motion';
import { useAudio } from '@/lib/audio/context';
import CorrectBurst from '@/app/components/ui/CorrectBurst';

interface StrokeTracingProps {
  strokeVectors?: StrokeVector[];
  character: string;
  size?: number;
  onComplete?: (stars: 1 | 2 | 3) => void;
}

interface StrokeGroup {
  strokeNumber: number;
  segments: StrokeVector[];
}

interface CreateJSStage {
  addChild: (child: unknown) => void;
  removeAllChildren: () => void;
  update: () => void;
}
interface CreateJSShape {
  graphics: {
    f: (c: string) => unknown;
    s: (c: string, w?: number) => unknown;
    p: (d: string) => unknown;
  };
  x: number;
  y: number;
}

let createJSLoadedGlobal = false;

const PAUSE_AFTER_STROKE_MS = 500;

interface StrokeAttempt {
  similarity: number;
  retries: number;
  passed: boolean;
  /** Final accepted polyline for this stroke (in 1080-space). Used by the replay feature. */
  points: Point[];
}

export default function StrokeTracing({
  strokeVectors,
  character,
  size = 360,
  onComplete,
}: StrokeTracingProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<CreateJSStage | null>(null);
  const [createJSLoaded, setCreateJSLoaded] = useState(createJSLoadedGlobal);

  const strokeGroups = useMemo((): StrokeGroup[] => {
    if (!strokeVectors?.length) return [];
    const groups = new Map<number, StrokeVector[]>();
    strokeVectors.forEach(sv => {
      const arr = groups.get(sv.strokeNumber) ?? [];
      arr.push(sv);
      groups.set(sv.strokeNumber, arr);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sn, segs]) => ({ strokeNumber: sn, segments: segs.sort((a, b) => a.frame - b.frame) }));
  }, [strokeVectors]);

  const totalStrokes = strokeGroups.length;
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState(0);
  const [attempts, setAttempts] = useState<StrokeAttempt[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [replaying, setReplaying] = useState(false);
  // Last result components — for the hidden debug overlay (?debug=trace).
  const [lastDebug, setLastDebug] = useState<{
    coverage: number;
    similarity: number;
    reason: string;
    points: Point[];
  } | null>(null);

  const livePointsRef = useRef<Point[]>([]);
  const activePointerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Pixel mask + distance field for the *current* expected stroke. Rebuilt
  // every time the expected stroke index changes. This is the source of
  // truth for stroke matching — see matchStrokeByMask.
  const expectedMaskRef = useRef<ExpectedStrokeMask | null>(null);
  const distFieldRef = useRef<Uint16Array | null>(null);

  const reducedMotion = useReducedMotion();
  const audio = useAudio();
  const [showStrokeBurst, setShowStrokeBurst] = useState(false);
  const debugMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'trace';
  }, []);

  const handleCreateJSLoad = useCallback(() => {
    createJSLoadedGlobal = true;
    setCreateJSLoaded(true);
  }, []);

  useEffect(() => {
    if (!createJSLoaded || !baseCanvasRef.current || typeof window === 'undefined' || !window.createjs) return;
    stageRef.current = new window.createjs.Stage(baseCanvasRef.current);
  }, [createJSLoaded]);

  // Draw guide: previous strokes solid black, current stroke highlighted, future strokes light grey
  const drawGuide = useCallback((completedUpTo: number, highlightCurrent: boolean = true) => {
    const stage = stageRef.current;
    if (!stage || !createJSLoaded || typeof window === 'undefined' || !window.createjs) return;

    stage.removeAllChildren();
    const baseCanvas = baseCanvasRef.current;
    const ctx = baseCanvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1080, 1080);
      // Soft cream background
      ctx.fillStyle = '#FFFDF7';
      ctx.fillRect(0, 0, 1080, 1080);
      // Grid (米字格)
      ctx.strokeStyle = '#E8DDC8';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(540, 0); ctx.lineTo(540, 1080);
      ctx.moveTo(0, 540); ctx.lineTo(1080, 540);
      ctx.moveTo(0, 0); ctx.lineTo(1080, 1080);
      ctx.moveTo(1080, 0); ctx.lineTo(0, 1080);
      ctx.stroke();
      ctx.setLineDash([]);
      // Outer border
      ctx.strokeStyle = '#D4C5A8';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 1080, 1080);
    }

    for (let i = 0; i < strokeGroups.length; i++) {
      const seg = strokeGroups[i].segments[strokeGroups[i].segments.length - 1];
      const shape = new window.createjs.Shape();
      let color: string;
      if (i < completedUpTo) {
        // Completed strokes: dark black
        color = '#1F2937';
      } else if (i === completedUpTo && highlightCurrent) {
        // Current expected stroke: medium grey to guide user
        color = '#9CA3AF';
      } else {
        // Future strokes: very light grey
        color = '#E5E7EB';
      }
      shape.graphics.f(color);
      shape.graphics.p(seg.pathData);
      shape.x = seg.transform.x;
      shape.y = seg.transform.y;
      stage.addChild(shape);
    }
    stage.update();
  }, [createJSLoaded, strokeGroups]);

  useEffect(() => {
    if (createJSLoaded) drawGuide(currentStrokeIdx, !isPaused);
  }, [createJSLoaded, currentStrokeIdx, drawGuide, isPaused, character]);

  /**
   * Render JUST the current expected stroke to an offscreen canvas, then
   * derive a pixel mask + distance field used by matchStrokeByMask.
   *
   * This is rebuilt whenever the active stroke changes. Working from the
   * actual rendered pixels (not the encoded path data) is what makes the
   * matcher robust — the user is asked to trace the visible grey stroke,
   * so that's exactly what we compare against.
   */
  const rebuildExpectedMask = useCallback(() => {
    if (typeof window === 'undefined' || !window.createjs) return;
    const group = strokeGroups[currentStrokeIdx];
    if (!group) {
      expectedMaskRef.current = null;
      distFieldRef.current = null;
      return;
    }
    const off = document.createElement('canvas');
    off.width = 1080;
    off.height = 1080;
    const offStage = new window.createjs.Stage(off);
    // Render every segment of just the current stroke (handles compound strokes).
    for (const seg of group.segments) {
      const shape = new window.createjs.Shape();
      shape.graphics.f('#000000');
      shape.graphics.p(seg.pathData);
      shape.x = seg.transform.x;
      shape.y = seg.transform.y;
      offStage.addChild(shape);
    }
    offStage.update();
    const ctx = off.getContext('2d');
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, 1080, 1080);
    const mask = buildExpectedMask(img.data, 1080, 1080);
    expectedMaskRef.current = mask;
    // Cap the distance field at ~25% of canvas; anything farther is "definitely off".
    distFieldRef.current = computeDistanceField(mask, 270);
  }, [currentStrokeIdx, strokeGroups]);

  useEffect(() => {
    if (!createJSLoaded) return;
    rebuildExpectedMask();
  }, [createJSLoaded, currentStrokeIdx, character, rebuildExpectedMask]);

  // Reset on character change
  useEffect(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setCurrentStrokeIdx(0);
    setAttempts([]);
    setRetryCount(0);
    setIsCapturing(false);
    setFeedback('idle');
    setCompleted(false);
    setStars(null);
    setIsPaused(false);
    setReplaying(false);
    setLastDebug(null);
    livePointsRef.current = [];
    const ink = inkCanvasRef.current?.getContext('2d');
    ink?.clearRect(0, 0, 1080, 1080);
  }, [character]);

  const drawInk = useCallback((points: Point[], color: string = '#3B82F6') => {
    const ctx = inkCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1080, 1080);
    if (points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }, []);

  const clearInk = useCallback(() => {
    const ctx = inkCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, 1080, 1080);
  }, []);

  const canvasToInternal = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (1080 / rect.width),
      y: (e.clientY - rect.top) * (1080 / rect.height),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (completed || isPaused || activePointerRef.current !== null) return;
    activePointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = canvasToInternal(e);
    livePointsRef.current = [pt];
    setIsCapturing(true);
    drawInk([pt], '#3B82F6');
    setFeedback('idle');
  }, [completed, isPaused, canvasToInternal, drawInk]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isCapturing || activePointerRef.current !== e.pointerId) return;
    const pt = canvasToInternal(e);
    livePointsRef.current = [...livePointsRef.current, pt];
    drawInk(livePointsRef.current, '#3B82F6');
  }, [isCapturing, canvasToInternal, drawInk]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isCapturing || activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    setIsCapturing(false);

    const pts = livePointsRef.current;
    livePointsRef.current = [];
    if (pts.length < 3) {
      clearInk();
      return;
    }

    const group = strokeGroups[currentStrokeIdx];
    if (!group) return;

    const mask = expectedMaskRef.current;
    const distField = distFieldRef.current;
    // If the mask hasn't been built yet (e.g. createjs still warming up),
    // accept the trace optimistically rather than blocking the kid.
    const result = mask && distField
      ? matchStrokeByMask(pts, mask, distField)
      : { passed: true, reason: 'correct' as const, similarity: 0.6, endpointScore: 0.6 };

    setLastDebug({
      coverage: result.endpointScore,
      similarity: result.similarity,
      reason: result.reason,
      points: pts,
    });

    // Reduced-motion: skip the long ✓ pause / pulse and advance quickly,
    // but always keep audio cues + visible feedback colour.
    const passPause = reducedMotion ? 250 : PAUSE_AFTER_STROKE_MS;
    const failPause = reducedMotion ? 350 : PAUSE_AFTER_STROKE_MS;

    if (result.passed) {
      audio.playCorrect();
      setShowStrokeBurst(true);
      setTimeout(() => setShowStrokeBurst(false), 600);
      setFeedback('pass');
      drawInk(pts, '#10B981'); // green ink for success
      // Pause, then clear ink and advance
      setIsPaused(true);
      advanceTimerRef.current = setTimeout(() => {
        clearInk();
        const newAttempts = [
          ...attempts,
          { similarity: result.similarity, retries: retryCount, passed: true, points: pts },
        ];
        setAttempts(newAttempts);
        setRetryCount(0);
        setFeedback('idle');
        setIsPaused(false);

        const nextIdx = currentStrokeIdx + 1;
        if (nextIdx >= totalStrokes) {
          const finalStars = computeStars(newAttempts);
          setStars(finalStars);
          setCompleted(true);
          onComplete?.(finalStars);
          drawGuide(nextIdx, false);
        } else {
          setCurrentStrokeIdx(nextIdx);
        }
      }, passPause);
    } else {
      audio.playIncorrect();
      setFeedback('fail');
      drawInk(pts, '#EF4444'); // red ink for failure
      setRetryCount(c => c + 1);
      // Clear after pause, allow retry of same stroke
      advanceTimerRef.current = setTimeout(() => {
        clearInk();
        setFeedback('idle');
      }, failPause);
    }
  }, [isCapturing, strokeGroups, currentStrokeIdx, attempts, retryCount, totalStrokes, onComplete, drawGuide, drawInk, clearInk, reducedMotion]);

  const handleReset = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setCurrentStrokeIdx(0);
    setAttempts([]);
    setRetryCount(0);
    setCompleted(false);
    setStars(null);
    setFeedback('idle');
    setIsPaused(false);
    setReplaying(false);
    setLastDebug(null);
    livePointsRef.current = [];
    clearInk();
    drawGuide(0);
  }, [drawGuide, clearInk]);

  /**
   * Replay the user's captured strokes (in order) on top of the completed
   * character. Each stroke is played back at roughly real-time speed using
   * its captured polyline. Reduced-motion shortens the per-segment delay.
   */
  const handleReplay = useCallback(() => {
    if (replaying || attempts.length === 0) return;
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setReplaying(true);
    drawGuide(totalStrokes, false);
    clearInk();

    const stepDelay = reducedMotion ? 4 : 22;     // ms between sample points
    const pauseBetweenStrokes = reducedMotion ? 80 : 350;

    let strokeIdx = 0;
    let pointIdx = 0;
    let displayed: Point[] = [];

    const tick = () => {
      const stroke = attempts[strokeIdx];
      if (!stroke) {
        // Done — fall back to the static guide.
        setReplaying(false);
        return;
      }
      if (pointIdx === 0) displayed = [];
      displayed.push(stroke.points[pointIdx]);
      drawInk(displayed, '#6366F1'); // indigo replay ink
      pointIdx += 1;
      if (pointIdx >= stroke.points.length) {
        strokeIdx += 1;
        pointIdx = 0;
        replayTimerRef.current = setTimeout(() => {
          if (strokeIdx >= attempts.length) {
            setReplaying(false);
            // Leave the final ink up briefly, then clear so the static guide
            // is visible again.
            replayTimerRef.current = setTimeout(() => clearInk(), 800);
          } else {
            tick();
          }
        }, pauseBetweenStrokes);
        return;
      }
      replayTimerRef.current = setTimeout(tick, stepDelay);
    };
    tick();
  }, [replaying, attempts, totalStrokes, reducedMotion, drawGuide, drawInk, clearInk]);

  // Cleanup any in-flight replay timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, []);

  if (!strokeVectors?.length) {
    return (
      <div
        className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-300 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <div className="text-5xl mb-3">✍️</div>
          <div className="text-sm text-slate-600">這個字暫無筆順資料</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Script
        src="https://code.createjs.com/1.0.0/easeljs.min.js"
        onLoad={handleCreateJSLoad}
        strategy="afterInteractive"
      />

      {/* Status bar */}
      <div className="flex items-center gap-3 text-base min-h-7">
        {completed ? (
          <span className="font-semibold text-emerald-600 text-lg">
            {stars === 3 ? '⭐⭐⭐ 完美！' : stars === 2 ? '⭐⭐ 很好！' : '⭐ 繼續練習'}
          </span>
        ) : (
          <>
            <span className="text-slate-600 font-medium">
              第 <span className="text-indigo-600 font-bold">{currentStrokeIdx + 1}</span> / {totalStrokes} 筆
            </span>
            {feedback === 'fail' && (
              <span className="text-rose-600 font-medium">↻ 再試一次</span>
            )}
            {feedback === 'pass' && (
              <span className="text-emerald-600 font-medium">✓ 正確！</span>
            )}
          </>
        )}
      </div>

      {/* Canvas stack */}
      <div
        className="relative rounded-3xl overflow-hidden border-4 border-indigo-300 shadow-lg bg-indigo-50"
        style={{ width: size, height: size, touchAction: 'none' }}
      >
        <canvas
          ref={baseCanvasRef}
          width={1080}
          height={1080}
          style={{ width: size, height: size, position: 'absolute', inset: 0 }}
        />
        <canvas
          ref={inkCanvasRef}
          width={1080}
          height={1080}
          style={{ width: size, height: size, position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        <canvas
          width={1080}
          height={1080}
          style={{
            width: size,
            height: size,
            position: 'absolute',
            inset: 0,
            cursor: completed || isPaused ? 'default' : 'crosshair',
            background: 'transparent',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            activePointerRef.current = null;
            setIsCapturing(false);
            livePointsRef.current = [];
            clearInk();
          }}
        />

        {!createJSLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80">
            <span className="text-sm text-slate-500">載入中...</span>
          </div>
        )}

        <CorrectBurst show={showStrokeBurst} />

        {!completed && (
          <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md pointer-events-none">
            {currentStrokeIdx + 1}
          </div>
        )}

        {isPaused && feedback === 'pass' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-7xl ${reducedMotion ? '' : 'animate-pulse'}`}>✓</div>
          </div>
        )}

        {/* Hidden debug overlay — only visible when ?debug=trace is set in the URL. */}
        {debugMode && lastDebug && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 text-emerald-200 text-[10px] font-mono p-2 rounded-lg pointer-events-none leading-tight">
            <div>reason: {lastDebug.reason}</div>
            <div>coverage: {(lastDebug.coverage * 100).toFixed(1)}%</div>
            <div>similarity: {(lastDebug.similarity * 100).toFixed(1)}%</div>
            <div>stroke: {currentStrokeIdx + 1}/{totalStrokes} · retries: {retryCount}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
        >
          {completed ? '再練一次' : '重新開始'}
        </button>
        {completed && attempts.length > 0 && (
          <button
            onClick={handleReplay}
            disabled={replaying}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {replaying ? '播放中…' : '🎬 重睇我寫'}
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500 text-center max-w-xs">
        {completed
          ? '完成！可按「重睇我寫」重看你嘅筆順。'
          : '用手指或滑鼠依照灰色筆順寫一筆，系統會自動檢查並進入下一筆'}
      </p>
    </div>
  );
}

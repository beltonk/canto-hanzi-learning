'use client';

/**
 * HandwritingPane — a free-form handwriting capture canvas used by the
 * dictation exercise. Captures discrete strokes (each pointer-down /
 * pointer-up cycle is one stroke) and reports them through `onStrokesChange`.
 *
 * The pane is intentionally lenient: it does not try to score the writing
 * against a reference shape. It just exposes how many strokes were drawn
 * and a coarse "ink coverage" metric so the parent component can decide
 * whether the user has made a reasonable attempt.
 *
 * Usage:
 *   const ref = useRef<HandwritingPaneHandle>(null);
 *   <HandwritingPane ref={ref} size={280} onStrokesChange={setStrokes} />
 *   ref.current?.clear();
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface Stroke {
  points: { x: number; y: number }[];
}

export interface HandwritingPaneHandle {
  clear: () => void;
  /** Number of completed strokes currently drawn. */
  strokeCount: () => number;
  /** Coarse ink-coverage metric in the range 0..1. */
  inkCoverage: () => number;
  /** Returns a snapshot of all strokes (in canvas coordinates). */
  snapshot: () => Stroke[];
}

interface Props {
  /** Canvas size (square). Defaults to 280. */
  size?: number;
  /** Optional placeholder character drawn faintly behind the writing
   *  surface to anchor the writer's strokes. Pass an empty string for
   *  a fully blank pane. */
  guideChar?: string;
  /** Stroke colour for the user's ink. */
  inkColor?: string;
  /** Stroke width for the user's ink (canvas pixels). */
  inkWidth?: number;
  /** Disable interaction (e.g. while showing the answer). */
  disabled?: boolean;
  /** Notified whenever the stroke list changes (drawn / cleared). */
  onStrokesChange?: (strokes: Stroke[]) => void;
  className?: string;
}

const HandwritingPane = forwardRef<HandwritingPaneHandle, Props>(function HandwritingPane(
  {
    size = 280,
    guideChar = '',
    inkColor = '#0f172a',
    inkWidth = 6,
    disabled = false,
    onStrokesChange,
    className,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const [, forceTick] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = inkWidth;

    const drawStroke = (stroke: Stroke) => {
      const pts = stroke.points;
      if (pts.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) {
        // Tiny dot — draw a small filled circle so single taps are visible.
        ctx.arc(pts[0].x, pts[0].y, inkWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = inkColor;
        ctx.fill();
      } else {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    };

    strokesRef.current.forEach(drawStroke);
    if (currentStrokeRef.current) drawStroke(currentStrokeRef.current);
  }, [inkColor, inkWidth]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentStrokeRef.current = { points: [getPointerPos(e)] };
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    e.preventDefault();
    const stroke = currentStrokeRef.current;
    if (!stroke) return;
    stroke.points.push(getPointerPos(e));
    redraw();
  };

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (stroke && stroke.points.length > 0) {
      strokesRef.current = [...strokesRef.current, stroke];
      onStrokesChange?.(strokesRef.current);
      forceTick(t => t + 1);
    }
    redraw();
  }, [onStrokesChange, redraw]);

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    finishStroke();
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (drawingRef.current) {
      e.preventDefault();
      finishStroke();
    }
  };

  // Coarse ink-coverage metric. Counts the unique 16x16 cells touched by
  // any stroke and normalises by the total cells. This is intentionally
  // approximate; we just want to know "did the user actually write?".
  const inkCoverage = useCallback(() => {
    const cellSize = 16;
    const cellsPerSide = Math.max(1, Math.floor(size / cellSize));
    const totalCells = cellsPerSide * cellsPerSide;
    const touched = new Set<number>();
    strokesRef.current.forEach(s => {
      s.points.forEach(p => {
        const cx = Math.min(cellsPerSide - 1, Math.max(0, Math.floor((p.x / size) * cellsPerSide)));
        const cy = Math.min(cellsPerSide - 1, Math.max(0, Math.floor((p.y / size) * cellsPerSide)));
        touched.add(cy * cellsPerSide + cx);
      });
    });
    return touched.size / totalCells;
  }, [size]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokesRef.current = [];
      currentStrokeRef.current = null;
      drawingRef.current = false;
      onStrokesChange?.([]);
      forceTick(t => t + 1);
      redraw();
    },
    strokeCount: () => strokesRef.current.length,
    inkCoverage,
    snapshot: () => strokesRef.current.map(s => ({ points: [...s.points] })),
  }), [inkCoverage, onStrokesChange, redraw]);

  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      {/* Faint guide grid (米字格) so kids can position their strokes */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-slate-300"
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Cross-hair guide */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-200" />
          <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-slate-200" />
          {/* Diagonals */}
          <div
            className="absolute left-0 top-0 right-0 bottom-0"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent calc(50% - 0.5px), rgb(226 232 240) 50%, transparent calc(50% + 0.5px)),' +
                'linear-gradient(-45deg, transparent calc(50% - 0.5px), rgb(226 232 240) 50%, transparent calc(50% + 0.5px))',
              opacity: 0.6,
            }}
          />
        </div>
        {guideChar && (
          <div
            className="absolute inset-0 flex items-center justify-center font-chinese text-slate-200 select-none"
            style={{ fontSize: size * 0.7, lineHeight: 1 }}
          >
            {guideChar}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`relative rounded-2xl bg-white touch-none ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-crosshair'}`}
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
});

export default HandwritingPane;

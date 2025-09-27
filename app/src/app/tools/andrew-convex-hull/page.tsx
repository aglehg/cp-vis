"use client";

import React from "react";

type Stage = "lower" | "upper" | "final";
type Action = "start" | "consider" | "pop" | "push" | "complete";

interface Point {
  id: number;
  x: number;
  y: number;
}

interface HullState {
  stage: Stage;
  action: Action;
  point: Point | null;
  popped?: Point | null;
  lower: Point[];
  upper: Point[];
  sortedIndex: number;
}

interface HullComputation {
  states: HullState[];
  hull: Point[];
  sorted: Point[];
  duplicateCount: number;
}

const CANVAS_MIN = 5;
const CANVAS_MAX = 95;
const CANVAS_RANGE = CANVAS_MAX - CANVAS_MIN;
const VIEWBOX = 100;
const SNAP_STEP = 1; // snap to integer coordinates to avoid awkward decimals

function snap(value: number) {
  const snapped = Math.round(value / SNAP_STEP) * SNAP_STEP;
  return Math.max(0, Math.min(VIEWBOX, snapped));
}

function createInitialPoints(count: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      id: i + 1,
      x: snap(CANVAS_MIN + Math.random() * CANVAS_RANGE),
      y: snap(CANVAS_MIN + Math.random() * CANVAS_RANGE),
    });
  }
  return pts;
}

function cross(o: Point, a: Point, b: Point) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function formatPoint(pt: Point | null | undefined) {
  if (!pt) return "";
  return `(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`;
}

function computeHull(points: Point[]): HullComputation {
  if (points.length === 0) {
    return { states: [], hull: [], sorted: [], duplicateCount: 0 };
  }

  const seen = new Map<string, Point>();
  const unique: Point[] = [];
  for (const pt of points) {
    const key = `${pt.x}:${pt.y}`;
    if (!seen.has(key)) {
      seen.set(key, pt);
      unique.push(pt);
    }
  }
  const duplicateCount = points.length - unique.length;
  const sorted = [...unique].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const indexById = new Map<number, number>();
  sorted.forEach((pt, idx) => indexById.set(pt.id, idx));

  if (sorted.length === 1) {
    const soloState: HullState = {
      stage: "final",
      action: "complete",
      point: sorted[0],
      lower: [...sorted],
      upper: [...sorted],
      sortedIndex: 0,
    };
    return { states: [soloState], hull: [...sorted], sorted, duplicateCount };
  }

  const states: HullState[] = [];

  states.push({
    stage: "lower",
    action: "start",
    point: null,
    lower: [],
    upper: [],
    sortedIndex: -1,
  });

  const lower: Point[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    states.push({
      stage: "lower",
      action: "consider",
      point: pt,
      lower: [...lower],
      upper: [],
      sortedIndex: i,
    });
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) {
      const popped = lower.pop()!;
      states.push({
        stage: "lower",
        action: "pop",
        point: pt,
        popped,
        lower: [...lower],
        upper: [],
        sortedIndex: i,
      });
    }
    lower.push(pt);
    states.push({
      stage: "lower",
      action: "push",
      point: pt,
      lower: [...lower],
      upper: [],
      sortedIndex: i,
    });
  }

  const lowerResult = [...lower];

  states.push({
    stage: "upper",
    action: "start",
    point: null,
    lower: lowerResult,
    upper: [],
    sortedIndex: sorted.length,
  });

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const pt = sorted[i];
    const idx = indexById.get(pt.id) ?? i;
    states.push({
      stage: "upper",
      action: "consider",
      point: pt,
      lower: lowerResult,
      upper: [...upper],
      sortedIndex: idx,
    });
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) {
      const popped = upper.pop()!;
      states.push({
        stage: "upper",
        action: "pop",
        point: pt,
        popped,
        lower: lowerResult,
        upper: [...upper],
        sortedIndex: idx,
      });
    }
    upper.push(pt);
    states.push({
      stage: "upper",
      action: "push",
      point: pt,
      lower: lowerResult,
      upper: [...upper],
      sortedIndex: idx,
    });
  }

  const upperResult = [...upper];
  const hull = [...lowerResult];
  if (upperResult.length > 0) {
    hull.push(...upperResult.slice(1, upperResult.length - 1));
  }

  states.push({
    stage: "final",
    action: "complete",
    point: null,
    lower: lowerResult,
    upper: upperResult,
    sortedIndex: -1,
  });

  return { states, hull, sorted, duplicateCount };
}

function describeState(state: HullState | undefined) {
  if (!state) return "Add points to generate a convex hull.";
  const current = formatPoint(state.point);
  switch (state.action) {
    case "start":
      return state.stage === "lower"
        ? "Begin building the lower hull by scanning from left to right."
        : "Switch to the upper scan starting from the rightmost point.";
    case "consider":
      return `Consider ${current} and test whether it keeps the hull convex.`;
    case "pop":
      return `Right turn detected, remove ${formatPoint(state.popped)} before adding ${current}.`;
    case "push":
      return state.stage === "lower"
        ? `Append ${current} to the lower hull.`
        : `Append ${current} to the upper hull.`;
    case "complete":
      return "Combine lower and upper chains to form the convex hull.";
    default:
      return "Step through the algorithm to see how the hull evolves.";
  }
}

function pointListLabel(stage: Stage) {
  if (stage === "lower") return "Lower hull";
  if (stage === "upper") return "Upper hull";
  return "Final hull";
}

export default function AndrewConvexHullPage() {
  const [points, setPoints] = React.useState<Point[]>([]);
  const [randomCount, setRandomCount] = React.useState(9);
  const idRef = React.useRef(points.reduce((max, p) => Math.max(max, p.id), 0) + 1);

  React.useEffect(() => {
    idRef.current = points.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  }, [points]);

  const { states, hull, sorted, duplicateCount } = React.useMemo(() => computeHull(points), [points]);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [cursorPoint, setCursorPoint] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    setStepIndex(0);
  }, [points, states.length]);

  const currentState = states[stepIndex];
  const stageLabel = pointListLabel(currentState?.stage ?? "final");
  const description = describeState(currentState);

  const toBoardCoords = React.useCallback((event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const offsetX = (rect.width - size) / 2;
    const offsetY = (rect.height - size) / 2;
    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;

    if (localX < 0 || localX > size || localY < 0 || localY > size) {
      return null;
    }

    const relativeX = (localX / size) * VIEWBOX;
    const relativeY = (localY / size) * VIEWBOX;
    const x = snap(relativeX);
    const y = snap(VIEWBOX - relativeY);
    return { x, y };
  }, []);

  const handleCanvasClick = React.useCallback(
    (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const coords = toBoardCoords(event);
      if (!coords) return;
      const { x, y } = coords;

      if (event.altKey || event.metaKey || event.shiftKey) {
        setPoints((prev) => {
          if (!prev.length) return prev;
          let closestIdx = 0;
          let bestDist = Infinity;
          prev.forEach((pt, idx) => {
            const dx = pt.x - x;
            const dy = pt.y - y;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
              bestDist = dist;
              closestIdx = idx;
            }
          });
          return prev.filter((_, idx) => idx !== closestIdx);
        });
        return;
      }

      setPoints((prev) => [...prev, { id: idRef.current++, x, y }]);
    },
    [setPoints, toBoardCoords]
  );

  const handleMouseMove = React.useCallback((event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = toBoardCoords(event);
    if (!coords) {
      setCursorPoint(null);
      return;
    }
    setCursorPoint(coords);
  }, [toBoardCoords]);

  const handleMouseLeave = React.useCallback(() => {
    setCursorPoint(null);
  }, []);

  const handleRandomize = React.useCallback(() => {
    const count = Math.max(3, Math.min(60, randomCount));
    setPoints(createInitialPoints(count));
  }, [randomCount]);

  const removeLast = React.useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const clearPoints = React.useCallback(() => {
    setPoints([]);
  }, []);

  const stepTo = React.useCallback((idx: number) => {
    if (!states.length) return;
    setStepIndex(Math.max(0, Math.min(states.length - 1, idx)));
  }, [states.length]);

  const hullPath = React.useMemo(() => {
    if (!hull.length) return "";
    return hull.map((pt) => `${pt.x},${VIEWBOX - pt.y}`).join(" ");
  }, [hull]);

  const lowerPath = currentState?.lower?.length
    ? currentState.lower.map((pt) => `${pt.x},${VIEWBOX - pt.y}`).join(" ")
    : "";
  const upperPath = currentState?.upper?.length
    ? currentState.upper.map((pt) => `${pt.x},${VIEWBOX - pt.y}`).join(" ")
    : "";
  const lowerIds = React.useMemo(() => new Set((currentState?.lower ?? []).map((pt) => pt.id)), [currentState]);
  const upperIds = React.useMemo(() => new Set((currentState?.upper ?? []).map((pt) => pt.id)), [currentState]);
  const hullIds = React.useMemo(() => new Set(hull.map((pt) => pt.id)), [hull]);
  const showHullPolygon = !!(currentState?.stage === "final" && hullPath);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Andrew's Monotone Chain Convex Hull</h1>
          <p className="text-sm text-slate-600">
            Interactive walk-through of the monotone chain algorithm. Hover to preview where a point would land, click to place it on the snapped grid, and Alt/Shift-click to remove the nearest one.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <section className="bg-white border rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">Point set</div>
              <label className="flex items-center gap-2 text-sm">
                <span>Random points</span>
                <input
                  type="number"
                  value={randomCount}
                  onChange={(e) => setRandomCount(Number(e.target.value) || 0)}
                  className="w-20 rounded border px-2 py-1 text-sm"
                  min={3}
                  max={60}
                />
              </label>
              <div className="flex flex-wrap gap-2 text-sm">
                <button onClick={handleRandomize} className="px-3 py-1.5 rounded border bg-slate-900 text-white">New set</button>
                <button onClick={removeLast} className="px-3 py-1.5 rounded border" disabled={!points.length}>Undo last</button>
                <button onClick={clearPoints} className="px-3 py-1.5 rounded border" disabled={!points.length}>Clear all</button>
              </div>
              <div className="text-xs text-slate-500">
                Points: {points.length} • Unique considered by algorithm: {points.length ? `${points.length - duplicateCount}/${points.length}` : "0"}
              </div>
            </section>

            <section className="bg-white border rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">Algorithm steps</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => stepTo(0)}
                  className="px-2 py-1 rounded border"
                  disabled={!states.length || stepIndex === 0}
                >
                  «
                </button>
                <button
                  onClick={() => stepTo(stepIndex - 1)}
                  className="px-2 py-1 rounded border"
                  disabled={!states.length || stepIndex === 0}
                >
                  Prev
                </button>
                <button
                  onClick={() => stepTo(stepIndex + 1)}
                  className="px-2 py-1 rounded border"
                  disabled={!states.length || stepIndex === states.length - 1}
                >
                  Next
                </button>
                <button
                  onClick={() => stepTo(states.length - 1)}
                  className="px-2 py-1 rounded border"
                  disabled={!states.length || stepIndex === states.length - 1}
                >
                  »
                </button>
              </div>
              <div className="text-xs text-slate-500">Step {states.length ? stepIndex + 1 : 0} / {states.length}</div>
              <div className="text-sm text-slate-700 leading-relaxed">{description}</div>
            </section>

            <section className="bg-white border rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">Sorted points (x ↑, y ↑)</div>
              <ol className="grid gap-1 text-xs font-mono text-slate-600">
                {sorted.map((pt, idx) => (
                  <li
                    key={pt.id}
                    className={`flex items-center gap-2 p-1 rounded ${currentState?.sortedIndex === idx ? "bg-amber-100 text-amber-900" : ""}`}
                  >
                    <span className="w-6 text-right">{idx + 1}.</span>
                    <span>{formatPoint(pt)}</span>
                  </li>
                ))}
                {!sorted.length && <span className="text-slate-400">Add points to see ordering.</span>}
              </ol>
            </section>
          </aside>

          <main className="space-y-4">
            <section className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Interactive board</div>
                <div className="text-xs text-slate-500">Click to add near the cursor (coordinates snap to integers) • Alt/Shift-click removes the nearest point</div>
              </div>
              <div className="mt-3">
                <svg
                  width="100%"
                  height="420"
                  viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                  className="w-full border rounded-lg bg-slate-100 cursor-crosshair"
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width={VIEWBOX} height={VIEWBOX} fill="url(#grid)" />

                  {cursorPoint && (
                    <circle
                      cx={cursorPoint.x}
                      cy={VIEWBOX - cursorPoint.y}
                      r={3.2}
                      fill="rgba(249, 115, 22, 0.35)"
                      stroke="rgba(249, 115, 22, 0.65)"
                      strokeWidth={0.9}
                      strokeDasharray="3 2"
                    />
                  )}

                  {showHullPolygon && (
                    <polygon
                      points={hullPath}
                      fill="rgba(96, 165, 250, 0.18)"
                      stroke="rgba(37, 99, 235, 0.5)"
                      strokeWidth="1"
                    />
                  )}

                  {lowerPath && (
                    <polyline
                      points={lowerPath}
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.9)"
                      strokeWidth="1.6"
                    />
                  )}

                  {upperPath && (
                    <polyline
                      points={upperPath}
                      fill="none"
                      stroke="rgba(244, 114, 182, 0.9)"
                      strokeWidth="1.6"
                    />
                  )}

                  {points.map((pt) => {
                    const screenY = VIEWBOX - pt.y;
                    const isHull = currentState?.stage === "final"
                      ? hullIds.has(pt.id)
                      : lowerIds.has(pt.id) || upperIds.has(pt.id);
                    const isActive = currentState?.point?.id === pt.id;
                    const wasPopped = currentState?.popped?.id === pt.id;
                    const radius = isActive ? 2.8 : wasPopped ? 2.2 : 2.4;
                    return (
                      <g key={pt.id}>
                        <circle
                          cx={pt.x}
                          cy={screenY}
                          r={radius + (isHull ? 0.6 : 0)}
                          fill={isHull ? "#0f172a" : "#1e293b"}
                          fillOpacity={isActive ? 0.9 : isHull ? 0.8 : 0.65}
                        />
                        {isActive && (
                          <circle
                            cx={pt.x}
                            cy={screenY}
                            r={radius + 2}
                            stroke="#f97316"
                            strokeWidth={1.2}
                            fill="none"
                          />
                        )}
                        {wasPopped && (
                          <circle
                            cx={pt.x}
                            cy={screenY}
                            r={radius + 1.6}
                            stroke="#ef4444"
                            strokeDasharray="3 2"
                            strokeWidth={1}
                            fill="none"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            <section className="bg-white border rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">{stageLabel}</div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-600">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Lower chain</div>
                  <div className="flex flex-col gap-1">
                    {currentState?.lower?.length
                      ? currentState.lower.map((pt) => (
                          <span key={`lower-${pt.id}`}>{formatPoint(pt)}</span>
                        ))
                      : <span className="text-slate-400">–</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Upper chain</div>
                  <div className="flex flex-col gap-1">
                    {currentState?.upper?.length
                      ? currentState.upper.map((pt) => (
                          <span key={`upper-${pt.id}`}>{formatPoint(pt)}</span>
                        ))
                      : <span className="text-slate-400">–</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Final hull</div>
                  <div className="flex flex-col gap-1">
                    {hull.length
                      ? hull.map((pt) => (
                          <span key={`hull-${pt.id}`}>{formatPoint(pt)}</span>
                        ))
                      : <span className="text-slate-400">–</span>}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

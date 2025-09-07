'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Fenwick (BIT) ---------------------------------------------------------
class Fenwick {
  tree: number[];
  touches: number[] = [];
  constructor(n: number) {
    this.tree = Array(n + 2).fill(0); // 1-indexed
  }
  resetTouches() { this.touches = []; }
  add(i: number, delta: number) {
    this.resetTouches();
    for (; i < this.tree.length; i += i & -i) {
      this.touches.push(i);
      this.tree[i] += delta;
    }
  }
  sum(i: number) {
    this.resetTouches();
    let s = 0;
    for (; i > 0; i -= i & -i) {
      this.touches.push(i);
      s += this.tree[i];
    }
    return s;
  }
}

// --- Types -----------------------------------------------------------------
interface Point { id: number; x: number; y: number; yComp: number }

type Event =
  | { kind: "query"; x: number; pointId: number; yComp: number }
  | { kind: "add"; x: number; pointId: number; yComp: number };

// --- Helpers ---------------------------------------------------------------
function compressY(points: { y: number }[]): Map<number, number> {
  const ys = Array.from(new Set(points.map(p => p.y))).sort((a,b)=>a-b);
  const m = new Map<number, number>();
  ys.forEach((v, i) => m.set(v, i + 1)); // 1-indexed
  return m;
}

function parsePoints(input: string): { ok: true, points: {x:number,y:number}[] } | { ok:false, error: string } {
  try {
    const data = JSON.parse(input);
    if (!Array.isArray(data)) return { ok:false, error: "Input must be a JSON array like [[1,1],[2,2]]" };
    const pts = data.map((pair: any, idx: number) => {
      if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Item ${idx} is not a [x,y] pair`);
      const [x, y] = pair;
      if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) throw new Error(`Item ${idx} must contain finite numbers`);
      return { x, y };
    });
    return { ok:true, points: pts };
  } catch (e: any) { return { ok:false, error: e.message }; }
}

// Generate events for dominance counting: for each point, do query(≤y) then add(y)
function buildEvents(points: Point[]): Event[] {
  // Sort by x increasing; for equal x, process queries BEFORE adds so points at same x don't dominate each other
  const groups = new Map<number, Point[]>();
  points.forEach(p => {
    const arr = groups.get(p.x) ?? [];
    arr.push(p);
    groups.set(p.x, arr);
  });
  const xs = Array.from(groups.keys()).sort((a,b)=>a-b);
  const events: Event[] = [];
  for (const x of xs) {
    const bucket = groups.get(x)!;
    // stable order within same x by y asc for nicer visualization
    bucket.sort((a,b)=>a.y-b.y);
    for (const p of bucket) events.push({ kind: "query", x, pointId: p.id, yComp: p.yComp });
    for (const p of bucket) events.push({ kind: "add", x, pointId: p.id, yComp: p.yComp });
  }
  return events;
}

// --- Visualization Component ----------------------------------------------
export default function SweepBitVisualizer() {
  const [pointsText, setPointsText] = useState<string>("[[1,1],[2,2],[3,3],[3,1],[4,2]]");
  const [error, setError] = useState<string>("");

  const { points, ymap } = useMemo(() => {
    const parsed = parsePoints(pointsText);
    if (!parsed.ok) return { points: [] as Point[], ymap: new Map<number, number>() };
    const ymap = compressY(parsed.points);
    const pts: Point[] = parsed.points.map((p, i) => ({ id: i, x: p.x, y: p.y, yComp: ymap.get(p.y) || 1 }));
    // Sort by x for stable display
    pts.sort((a,b)=> a.x === b.x ? a.y - b.y : a.x - b.x);
    return { points: pts, ymap };
  }, [pointsText]);

  const maxYComp = useMemo(() => {
    let m = 0; points.forEach(p => { if (p.yComp > m) m = p.yComp; }); return Math.max(m,1);
  }, [points]);

  const [bit] = useState(() => new Fenwick(Math.max(1, 2048))); // oversize; we’ll cap with maxYComp
  const [events, setEvents] = useState<Event[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [dominanceCounts, setDominanceCounts] = useState<Record<number, number>>({});

  // Build events when points change
  useEffect(() => {
    const evs = buildEvents(points);
    setEvents(evs);
    setIdx(0);
    bit.tree.fill(0);
    setDominanceCounts({});
  }, [points]);

  const currEvent = events[idx];

  const step = useCallback(() => {
    if (!currEvent) return;
    if (currEvent.kind === "query") {
      // number of earlier points with y' <= y
      const val = bit.sum(currEvent.yComp);
      setDominanceCounts(prev => ({ ...prev, [currEvent.pointId]: val }));
    } else if (currEvent.kind === "add") {
      bit.add(currEvent.yComp, 1);
    }
    setIdx(i => Math.min(i + 1, events.length));
  }, [currEvent, bit, events.length]);

  const stepBack = useCallback(() => {
    // Simple rebuild by replaying until idx-1
    bit.tree.fill(0);
    const counts: Record<number, number> = {};
    for (let i = 0; i < idx - 1; i++) {
      const e = events[i];
      if (e.kind === "query") {
        counts[e.pointId] = bit.sum(e.yComp);
      } else {
        bit.add(e.yComp, 1);
      }
    }
    setDominanceCounts(counts);
    setIdx(i => Math.max(0, i - 1));
  }, [idx, events, bit]);

  const reset = useCallback(() => {
    setIdx(0);
    bit.tree.fill(0);
    setDominanceCounts({});
  }, [bit]);

  // --- Plane rendering (SVG) ------------------------------------------------
  const padding = 24;
  const width = 520, height = 360;

  const xMin = Math.min(...points.map(p=>p.x), 0);
  const xMax = Math.max(...points.map(p=>p.x), 5);
  const yMin = Math.min(...points.map(p=>p.y), 0);
  const yMax = Math.max(...points.map(p=>p.y), 5);

  const xScale = (x:number) => padding + (x - xMin) * (width - 2*padding) / Math.max(1, (xMax - xMin));
  const yScale = (y:number) => height - padding - (y - yMin) * (height - 2*padding) / Math.max(1, (yMax - yMin));

  const sweepX = useMemo(() => {
    // sweep at current event x; before any event => left of first x
    if (!currEvent) return Number.POSITIVE_INFINITY;
    return currEvent.x;
  }, [currEvent]);

  // --- UI -------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Input + Controls */}
        <div className="col-span-1 space-y-4">
          <h1 className="text-2xl font-semibold">Sweep + BIT Visualizer</h1>
          <p className="text-sm text-slate-600">Dominance counting via sweeping X and maintaining a 1D Fenwick Tree over compressed Y.</p>

          <label className="text-sm font-medium">Points JSON</label>
          <textarea
            className="w-full h-32 p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={pointsText}
            onChange={(e)=>setPointsText(e.target.value)}
            spellCheck={false}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex items-center gap-2">
            <button onClick={reset} className="px-3 py-2 rounded-xl shadow bg-white border hover:bg-slate-50">Reset</button>
            <button onClick={stepBack} className="px-3 py-2 rounded-xl shadow bg-white border hover:bg-slate-50">Step ◀</button>
            <button onClick={step} className="px-3 py-2 rounded-xl shadow bg-indigo-600 text-white hover:bg-indigo-700">Step ▶</button>
            <div className="ml-auto text-sm text-slate-600">Event {Math.min(idx+1, events.length)} / {events.length}</div>
          </div>

          <div className="p-3 rounded-xl bg-white border">
            <div className="font-medium mb-2">Current Event</div>
            {currEvent ? (
              <div className="text-sm">
                {currEvent.kind === 'query' ? (
                  <div>query ≤ y comp <span className="font-mono">{currEvent.yComp}</span> for point #{currEvent.pointId} at x=<span className="font-mono">{currEvent.x}</span></div>
                ) : (
                  <div>add y comp <span className="font-mono">{currEvent.yComp}</span> (insert point #{currEvent.pointId}) at x=<span className="font-mono">{currEvent.x}</span></div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No event (finished).</div>
            )}
          </div>
        </div>

        {/* Middle column: Plane */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Plane (X/Y)</div>
              <div className="text-xs text-slate-500">Sweep line at x = {isFinite(sweepX) ? sweepX : '∞'}</div>
            </div>
            <svg width={width} height={height} className="w-full h-auto">
              {/* Axes */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E1" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#CBD5E1" />
              {/* Sweep line */}
              {isFinite(sweepX) && (
                <line x1={xScale(sweepX)} y1={padding} x2={xScale(sweepX)} y2={height - padding} stroke="#6366F1" strokeDasharray="4 4" />
              )}
              {/* Points */}
              {points.map(p => {
                const active = !isFinite(sweepX) ? false : (p.x < sweepX || (p.x === sweepX && events[idx]?.kind === 'add'));
                const color = active ? "#0EA5E9" : "#94A3B8";
                const r = 5;
                return (
                  <g key={p.id}>
                    <circle cx={xScale(p.x)} cy={yScale(p.y)} r={r} fill={color} />
                    <text x={xScale(p.x)+8} y={yScale(p.y)-8} fontSize={10} fill="#475569" className="font-mono">{p.yComp}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* BIT View */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="font-medium mb-2">Fenwick Tree (compressed Y indices)</div>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: maxYComp }).map((_, i) => {
                const idx1 = i + 1;
                const val = bit.tree[idx1] ?? 0;
                const touched = bit.touches.includes(idx1);
                return (
                  <div key={idx1} className={`text-center p-2 rounded-xl border ${touched ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-xs text-slate-500">{idx1}</div>
                    <div className="text-base font-semibold">{val}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 mt-2">Highlighted cells show the indices touched by the <span className="font-medium">last</span> operation (add or sum).</div>
          </div>

          {/* Results */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="font-medium mb-2">Dominance counts per point (earlier points with y′ ≤ y)</div>
            <div className="flex flex-wrap gap-2">
              {points.map(p => (
                <div key={p.id} className="px-3 py-2 rounded-xl border bg-white text-sm">
                  <span className="font-mono">#{p.id}</span> (x:{p.x}, y:{p.y}, yc:{p.yComp}) → <span className="font-semibold">{dominanceCounts[p.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events list */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="font-medium mb-2">Events</div>
            <div className="flex flex-wrap gap-2">
              {events.map((e, i) => (
                <div key={i} className={`px-2 py-1 rounded-lg border text-xs font-mono ${i === idx ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-50 border-slate-200'}`}>
                  {i < idx ? '✔ ' : ''}{e.kind}{' @x='}{e.x}{' yC='}{e.yComp}{' p#'}{(e as any).pointId}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="max-w-6xl mx-auto mt-6 text-xs text-slate-500">
        Tip: Paste points like <code>[[1,1],[2,2],[3,3]]</code>. We compress Y to 1..N and do a query then add per point at each x. For equal x, queries happen before adds.
      </div>
    </div>
  );
}
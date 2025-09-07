"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

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
interface Point { id: number; x: number; y: number }
interface Rect { id: number; x1: number; y1: number; x2: number; y2: number }

interface Filters {
  minW: number; maxW: number | null;
  minH: number; maxH: number | null;
  minArea: number; maxArea: number | null;
  minPts: number; maxPts: number | null;
  maxRects: number; // cap to keep UI responsive
}

type Event =
  | { kind: "add"; x: number; y: number; pid: number }
  | { kind: "query"; x: number; yBoundary: number; rid: number; sign: 1 | -1 };

// --- Helpers ---------------------------------------------------------------
function parsePoints(input: string): { ok:true; points: Point[] } | { ok:false; error: string } {
  try {
    const raw = JSON.parse(input);
    if (!Array.isArray(raw)) return { ok:false, error: "Points must be an array like [[1,1],[2,2]]" };
    const pts: Point[] = raw.map((p: any, i: number) => {
      if (!Array.isArray(p) || p.length !== 2) throw new Error(`Point ${i} is not [x,y]`);
      const [x, y] = p;
      if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) throw new Error(`Point ${i} must have finite numbers`);
      return { id: i, x, y };
    });
    return { ok:true, points: pts };
  } catch (e: any) { return { ok:false, error: e.message }; }
}

function uniqSorted(nums: number[]): number[] { return Array.from(new Set(nums)).sort((a,b)=>a-b); }

function generateRectangles(points: Point[], filters: Filters): Rect[] {
  const xs = uniqSorted(points.map(p=>p.x));
  const ys = uniqSorted(points.map(p=>p.y));
  const rects: Rect[] = [];
  let id = 0;

  for (let i = 0; i < xs.length; i++) {
    for (let j = i; j < xs.length; j++) {
      const x1 = xs[i], x2 = xs[j];
      const w = x2 - x1; // geometric width
      if (w < filters.minW) continue;
      if (filters.maxW !== null && w > filters.maxW) continue;

      for (let a = 0; a < ys.length; a++) {
        for (let b = a; b < ys.length; b++) {
          const y1 = ys[a], y2 = ys[b];
          const h = y2 - y1;
          if (h < filters.minH) continue;
          if (filters.maxH !== null && h > filters.maxH) continue;

          const area = w * h;
          if (area < filters.minArea) continue;
          if (filters.maxArea !== null && area > filters.maxArea) continue;

          const rect: Rect = { id: id++, x1, y1, x2, y2 };
          rects.push(rect);
          if (rects.length >= filters.maxRects) return rects;
        }
      }
    }
  }
  return rects;
}

function upperBound(arr: number[], x: number): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid + 1; else hi = mid;
  }
  return lo; // count of <= x
}

function buildEvents(points: Point[], rects: Rect[]): { events: Event[]; ys: number[] } {
  // Y compression from points only
  const ys = uniqSorted(points.map(p=>p.y));

  const addEvents: Event[] = points.map(p => ({ kind: "add", x: p.x, y: p.y, pid: p.id }));

  const queryEvents: Event[] = [];
  for (const r of rects) {
    queryEvents.push({ kind: "query", x: r.x2,   yBoundary: r.y2,   rid: r.id, sign: +1 });
    queryEvents.push({ kind: "query", x: r.x1-1, yBoundary: r.y2,   rid: r.id, sign: -1 });
    queryEvents.push({ kind: "query", x: r.x2,   yBoundary: r.y1-1, rid: r.id, sign: -1 });
    queryEvents.push({ kind: "query", x: r.x1-1, yBoundary: r.y1-1, rid: r.id, sign: +1 });
  }

  // Order: increasing x; at same x, process adds before queries so F(X,·) counts points with x <= X
  const events = [...addEvents, ...queryEvents].sort((a,b) => a.x === b.x ? (a.kind === "add" && b.kind === "query" ? -1 : a.kind === "query" && b.kind === "add" ? 1 : 0) : a.x - b.x);

  return { events, ys };
}

export default function RectCountInclusionExclusion() {
  // Inputs
  const [pointsText, setPointsText] = useState("[[1,1],[2,2],[3,3],[3,1],[4,2]]");
  const [filters, setFilters] = useState<Filters>({
    minW: 0, maxW: null,
    minH: 0, maxH: null,
    minArea: 0, maxArea: null,
    minPts: 0, maxPts: null,
    maxRects: 200,
  });

  const parsedPts = useMemo(() => parsePoints(pointsText), [pointsText]);
  const points = parsedPts.ok ? parsedPts.points : [];

  const rects = useMemo(() => generateRectangles(points, filters), [points, filters]);
  const built = useMemo(() => buildEvents(points, rects), [points, rects]);
  const ys = built.ys;
  const minPointX = useMemo(() => points.length ? Math.min(...points.map(p=>p.x)) : Number.POSITIVE_INFINITY, [points]);
  const pointSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of points) s.add(`${p.x},${p.y}`);
    return s;
  }, [points]);

  const [bit] = useState(() => new Fenwick(Math.max(1, 8192)));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, setPending] = useState<Record<number, number>>({});
  const [pairs, setPairs] = useState<Array<{ rid:number; x1:number; y2:number; x2:number; y1:number; val:number }>>([]);
  // no hover tooltips in edge-pair view
  const events = built.events;
  const curr = events[idx];

  useEffect(() => {
    // Reset simulation when inputs change
    bit.tree.fill(0);
    setIdx(0);
    setAnswers({});
    const p: Record<number, number> = {};
    for (const r of rects) p[r.id] = 4;
    setPending(p);
    setPairs([]);
  }, [pointsText, filters]);

  // If the very first events are queries left of the first point (x1-1),
  // it may look like “nothing happens”. Keep a tiny hint by exposing the current event below.

  const yToComp = useCallback((yBoundary: number) => upperBound(ys, yBoundary), [ys]);

  const step = useCallback(() => {
    if (idx >= events.length) return;
    let next = idx;
    // Skip leading no-op queries: (a) y′ maps to index 0, or (b) x is before the first point
    while (next < events.length) {
      const e = events[next];
      if (e.kind === 'query') {
        const i = yToComp(e.yBoundary);
        const beforeAnyAdd = e.x < minPointX; // BIT empty ⇒ prefix is 0
        if (i <= 0 || beforeAnyAdd) {
          // Treat as processed no-op: decrement pending and finalize if needed
          const newRem = Math.max(0, (pending[e.rid] ?? 0) - 1);
          setPending(prev => ({ ...prev, [e.rid]: newRem }));
          if (newRem === 0) {
            const rect = rects.find(r => r.id === e.rid);
            if (rect) {
              const val = answers[e.rid] ?? 0; // unchanged by this no-op
              const withinMin = val >= (filters.minPts ?? 0);
              const withinMax = filters.maxPts == null || val <= filters.maxPts;
              const tlOk = pointSet.has(`${rect.x1},${rect.y2}`);
              const brOk = pointSet.has(`${rect.x2},${rect.y1}`);
              if (withinMin && withinMax && tlOk && brOk) {
                setPairs(prev => prev.concat([{ rid: rect.id, x1: rect.x1, y2: rect.y2, x2: rect.x2, y1: rect.y1, val }]));
              }
            }
          }
          next++;
          continue;
        }
      }
      break;
    }

    if (next >= events.length) { setIdx(events.length); return; }

    const e = events[next];
    if (e.kind === 'add') {
      const i = yToComp(e.y);
      if (i > 0) bit.add(i, 1);
    } else {
      const i = yToComp(e.yBoundary);
      const val = i <= 0 ? 0 : bit.sum(i);
      const nextVal = (answers[e.rid] ?? 0) + e.sign * val;
      setAnswers(prev => ({ ...prev, [e.rid]: nextVal }));
      const newRem = Math.max(0, (pending[e.rid] ?? 0) - 1);
      setPending(prev => ({ ...prev, [e.rid]: newRem }));
      if (newRem === 0) {
        const rect = rects.find(r => r.id === e.rid);
        if (rect) {
          const withinMin = nextVal >= (filters.minPts ?? 0);
          const withinMax = filters.maxPts == null || nextVal <= filters.maxPts;
          const tlOk = pointSet.has(`${rect.x1},${rect.y2}`);
          const brOk = pointSet.has(`${rect.x2},${rect.y1}`);
          if (withinMin && withinMax && tlOk && brOk) {
            setPairs(prev => prev.concat([{ rid: rect.id, x1: rect.x1, y2: rect.y2, x2: rect.x2, y1: rect.y1, val: nextVal }]));
          }
        }
      }
    }
    setIdx(Math.min(next + 1, events.length));
  }, [idx, events, bit, yToComp, minPointX, rects, answers, filters, pending, pointSet]);

  const stepBack = useCallback(() => {
    // rebuild to idx-1
    bit.tree.fill(0);
    const ans: Record<number, number> = {};
    const qCount: Record<number, number> = {};
    for (let i = 0; i < idx - 1; i++) {
      const e = events[i];
      if (e.kind === "add") {
        const j = yToComp(e.y);
        if (j > 0) bit.add(j, 1);
      } else {
        const j = yToComp(e.yBoundary);
        const val = j <= 0 ? 0 : bit.sum(j);
        ans[e.rid] = (ans[e.rid] ?? 0) + e.sign * val;
        qCount[e.rid] = (qCount[e.rid] ?? 0) + 1;
      }
    }
    setAnswers(ans);
    // restore pending and pairs
    const pend: Record<number, number> = {};
    const ps: Array<{ rid:number; x1:number; y2:number; x2:number; y1:number; val:number }> = [];
    for (const r of rects) {
      const processed = qCount[r.id] ?? 0;
      pend[r.id] = Math.max(0, 4 - processed);
      if (pend[r.id] === 0) {
        const val = ans[r.id] ?? 0;
        const withinMin = val >= (filters.minPts ?? 0);
        const withinMax = filters.maxPts == null || val <= filters.maxPts;
        const tlOk = pointSet.has(`${r.x1},${r.y2}`);
        const brOk = pointSet.has(`${r.x2},${r.y1}`);
        if (withinMin && withinMax && tlOk && brOk) {
          ps.push({ rid: r.id, x1: r.x1, y2: r.y2, x2: r.x2, y1: r.y1, val });
        }
      }
    }
    setPending(pend);
    setPairs(ps);
    setIdx(i => Math.max(0, i - 1));
  }, [idx, events, bit, yToComp, rects, filters, pointSet]);

  const reset = useCallback(() => {
    bit.tree.fill(0);
    setIdx(0);
    setAnswers({});
    const p: Record<number, number> = {};
    for (const r of rects) p[r.id] = 4;
    setPending(p);
    setPairs([]);
  }, [bit, rects]);

  // --- Plane scales ---------------------------------------------------------
  const padding = 24;
  const width = 560, height = 380;
  const xMin = Math.min(...points.map(p=>p.x).concat(rects.flatMap(r=>[r.x1,r.x2, r.x1-1])), 0);
  const xMax = Math.max(...points.map(p=>p.x).concat(rects.flatMap(r=>[r.x1,r.x2])), 5);
  const yMin = Math.min(...points.map(p=>p.y).concat(rects.flatMap(r=>[r.y1,r.y2, r.y1-1])), 0);
  const yMax = Math.max(...points.map(p=>p.y).concat(rects.flatMap(r=>[r.y1,r.y2])), 5);
  const xScale = (x:number) => padding + (x - xMin) * (width - 2*padding) / Math.max(1, (xMax - xMin));
  const yScale = (y:number) => height - padding - (y - yMin) * (height - 2*padding) / Math.max(1, (yMax - yMin));

  const sweepX = curr ? curr.x : Number.POSITIVE_INFINITY;

  // --- UI -------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Rectangle Counting via Offline Inclusion–Exclusion</h1>
          <p className="text-sm text-slate-600">Rectangles are auto-generated from unique X/Y of the points and filtered by the predicate below.</p>

          <label className="text-sm font-medium">Points JSON</label>
          <textarea className="w-full h-28 p-3 rounded-xl border bg-white"
            value={pointsText} onChange={e=>setPointsText(e.target.value)} spellCheck={false} />
          {!parsedPts.ok && <div className="text-sm text-red-600">{parsedPts.error}</div>}

          <div className="p-3 rounded-xl bg-white border space-y-3">
            <div className="font-medium">Rectangle Filter</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2">min width <input type="number" className="w-24 border rounded px-2 py-1" value={filters.minW} onChange={e=>setFilters(f=>({...f, minW: Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">max width <input type="number" className="w-24 border rounded px-2 py-1" value={filters.maxW ?? ''} placeholder="∞" onChange={e=>setFilters(f=>({...f, maxW: e.target.value===''? null : Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">min height <input type="number" className="w-24 border rounded px-2 py-1" value={filters.minH} onChange={e=>setFilters(f=>({...f, minH: Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">max height <input type="number" className="w-24 border rounded px-2 py-1" value={filters.maxH ?? ''} placeholder="∞" onChange={e=>setFilters(f=>({...f, maxH: e.target.value===''? null : Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">min area <input type="number" className="w-24 border rounded px-2 py-1" value={filters.minArea} onChange={e=>setFilters(f=>({...f, minArea: Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">max area <input type="number" className="w-24 border rounded px-2 py-1" value={filters.maxArea ?? ''} placeholder="∞" onChange={e=>setFilters(f=>({...f, maxArea: e.target.value===''? null : Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">min points <input type="number" className="w-24 border rounded px-2 py-1" value={filters.minPts} onChange={e=>setFilters(f=>({...f, minPts: Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">max points <input type="number" className="w-24 border rounded px-2 py-1" value={filters.maxPts ?? ''} placeholder="∞" onChange={e=>setFilters(f=>({...f, maxPts: e.target.value===''? null : Number(e.target.value)}))} /></label>
              <label className="flex items-center gap-2">cap rectangles <input type="number" className="w-24 border rounded px-2 py-1" value={filters.maxRects} onChange={e=>setFilters(f=>({...f, maxRects: Math.max(1, Number(e.target.value))}))} /></label>
              <div className="text-xs text-slate-500 col-span-2">Rectangles are formed only from the unique x and y values present in the points (axis-aligned grid).</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={reset} className="px-3 py-2 rounded-xl shadow bg-white border">Reset</button>
            <button onClick={stepBack} className="px-3 py-2 rounded-xl shadow bg-white border">Step ◀</button>
            <button onClick={step} className="px-3 py-2 rounded-xl shadow bg-indigo-600 text-white">Step ▶</button>
            <div className="ml-auto text-sm text-slate-600">Event {Math.min(idx+1, events.length)} / {events.length}</div>
          </div>

          {/* Current event summary */}
          <div className="text-xs text-slate-600">
            {curr ? (
              curr.kind === 'add' ? (
                <span>add point y={curr.y} at x={curr.x}</span>
              ) : (
                <span>query F(x={curr.x}, y′={curr.yBoundary})</span>
              )
            ) : (
              <span>Finished</span>
            )}
          </div>

          <div className="text-xs text-slate-500">ans = F(x2,y2) − F(x1−1,y2) − F(x2,y1−1) + F(x1−1,y1−1)</div>
        </div>

        {/* Visuals */}
        <div className="lg:col-span-2 space-y-4">
          {/* Plane */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Plane (points & detected edge pairs)</div>
              <div className="text-xs text-slate-500">Sweep at x = {isFinite(sweepX) ? sweepX : '∞'} · Pairs {pairs.length}</div>
            </div>
            <svg width={width} height={height} className="w-full h-auto">
              {/* axes */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E1" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#CBD5E1" />
              {/* sweep line */}
              {isFinite(sweepX) && <line x1={xScale(sweepX)} y1={padding} x2={xScale(sweepX)} y2={height - padding} stroke="#6366F1" strokeDasharray="4 4" />}

              {/* detected edge pairs (top-left ↔ bottom-right) */}
              {pairs.map(p => (
                <g key={p.rid}>
                  {/* Diagonal line from TL(x1,y2) to BR(x2,y1) */}
                  <line x1={xScale(p.x1)} y1={yScale(p.y2)} x2={xScale(p.x2)} y2={yScale(p.y1)} stroke="#059669" strokeWidth={2} />
                  {/* End caps */}
                  <circle cx={xScale(p.x1)} cy={yScale(p.y2)} r={3} fill="#059669" />
                  <circle cx={xScale(p.x2)} cy={yScale(p.y1)} r={3} fill="#059669" />
                </g>
              ))}

              {/* points */}
              {points.map(p => {
                const active = isFinite(sweepX) ? p.x <= sweepX : false;
                const color = active ? "#0EA5E9" : "#94A3B8";
                return (
                  <g key={p.id}>
                    <circle cx={xScale(p.x)} cy={yScale(p.y)} r={5} fill={color} />
                    <text x={xScale(p.x)+6} y={yScale(p.y)-6} fontSize={10} fill="#475569" className="font-mono">({p.x},{p.y})</text>
                  </g>
                );
              })}

              {/* current query point marker */}
              {curr && curr.kind === 'query' && isFinite(curr.x) && isFinite(curr.yBoundary) && (
                <g>
                  <circle cx={xScale(curr.x)} cy={yScale(curr.yBoundary)} r={6} fill="#2563EB" stroke="#FFFFFF" strokeWidth={1.5} />
                </g>
              )}
            </svg>
          </div>

          {/* BIT view */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="font-medium mb-2">Fenwick Tree over sorted unique Y</div>
            <div className="grid grid-cols-12 gap-2">
              {ys.length === 0 ? (
                <div className="text-sm text-slate-500">No Y values</div>
              ) : (
                ys.map((y, i) => {
                  const touched = bit.touches.includes(i+1);
                  return (
                  <div key={y} className={`text-center p-2 rounded-xl border ${touched ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-xs text-slate-500">idx {i+1}</div>
                    <div className="text-xs text-slate-500">y={y}</div>
                    <div className="text-base font-semibold">{bit.tree[i+1] ?? 0}</div>
                  </div>
                  );
                })
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">Query boundary Y′ maps to index upperBound(ys, Y′).</div>
          </div>

          {/* Detected pairs (in step order) */}
          <div className="p-3 rounded-2xl bg-white border shadow-sm">
            <div className="font-medium mb-2">Detected Edge Pairs</div>
            {pairs.length === 0 ? (
              <div className="text-sm text-slate-500">No pairs yet — step to detect.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pairs.map(p => (
                  <div key={p.rid} className="px-3 py-2 rounded-xl border bg-white text-sm">
                    <span className="font-mono">TL({p.x1},{p.y2}) ↔ BR({p.x2},{p.y1})</span>
                    {' '}→ <span className="font-semibold">{p.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pt, Pair, PlaneOverlays } from "@/lib/leetcode/3027/types";

export function useSweepPairs(points: Pt[]) {
  const sorted = useMemo(() => [...points].sort((p, q) => (p.x === q.x ? q.y - p.y : p.x - q.x)), [points]);

  const [iIdx, setIIdx] = useState(0);
  const [jIdx, setJIdx] = useState(1);
  const [maxY, setMaxY] = useState<number>(-Infinity);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [steps, setSteps] = useState(0);
  const [lastVerdict, setLastVerdict] = useState<{ i:number; j:number; verdict:'accept'|'reject_y'|'reject_pos'|'done'; yj?:number }|null>(null);
  const [acceptedFlash, setAcceptedFlash] = useState<{ y:number; at:number }|null>(null);

  useEffect(() => { reset(); }, [sorted.length]);

  function reset() {
    setIIdx(0); setJIdx(1); setMaxY(-Infinity); setPairs([]); setSteps(0);
  }

  function step() {
    const n = sorted.length;
    let i = iIdx, j = jIdx, my = maxY; const acc = [...pairs];
    if (i >= n) return;
    if (j >= n) { setLastVerdict({ i, j, verdict:'done' }); i++; my = -Infinity; j = i + 1; if (i >= n) { setIIdx(i); setJIdx(j); setMaxY(my); return; } }
    if (j < n) {
      const L = sorted[i], R = sorted[j];
      if (R.y <= L.y && R.y > my) {
        const kind = L.x === R.x ? "vertical" : L.y === R.y ? "horizontal" : "other" as const;
        acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind });
        my = R.y;
        setLastVerdict({ i, j, verdict:'accept', yj:R.y });
        setAcceptedFlash({ y: R.y, at: Date.now() });
      }
      else {
        setLastVerdict({ i, j, verdict: (R.y <= my ? 'reject_y' : 'reject_pos'), yj:R.y });
      }
      j++;
    }
    setIIdx(i); setJIdx(j); setMaxY(my); setPairs(acc); setSteps(s => s + 1);
  }

  function back() {
    // Replay steps-1 from scratch for simplicity
    const n = sorted.length;
    let i = 0, j = 1, my = -Infinity; const acc: Pair[] = [];
    const total = Math.max(0, steps - 1);
    let s = 0;
    while (s < total && i < n) {
      if (j >= n) { i++; my = -Infinity; j = i + 1; continue; }
      const L = sorted[i], R = sorted[j];
      if (R.y <= L.y && R.y > my) { acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind: (L.x === R.x ? "vertical" : L.y === R.y ? "horizontal" : "other") }); my = R.y; }
      j++; s++;
    }
    setIIdx(i); setJIdx(j); setMaxY(my); setPairs(acc); setSteps(total); setLastVerdict(null); setAcceptedFlash(null);
  }

  function runAll() {
    const n = sorted.length;
    let i = iIdx, j = jIdx, my = maxY; const acc = [...pairs];
    let processed = 0;
    while (i < n) {
      if (j >= n) { i++; my = -Infinity; j = i + 1; continue; }
      const L = sorted[i], R = sorted[j];
      if (R.y <= L.y && R.y > my) {
        const kind = L.x === R.x ? "vertical" : L.y === R.y ? "horizontal" : "other" as const;
        acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind });
        my = R.y;
        setAcceptedFlash({ y: R.y, at: Date.now() });
      }
      j++; processed++;
    }
    setIIdx(i); setJIdx(j); setMaxY(my); setPairs(acc); setSteps(s => s + processed); setLastVerdict({ i, j, verdict:'done' });
  }

  function runI() {
    const n = sorted.length;
    let i = iIdx, j = jIdx, my = maxY; const acc = [...pairs];
    if (i >= n) return;
    while (j < n) {
      const L = sorted[i], R = sorted[j];
      if (R.y <= L.y && R.y > my) {
        const kind = L.x === R.x ? "vertical" : L.y === R.y ? "horizontal" : "other" as const;
        acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind });
        my = R.y; setAcceptedFlash({ y: R.y, at: Date.now() });
      }
      j++;
    }
    i++; const nextJ = i + 1; const nextMy = -Infinity;
    setIIdx(i); setJIdx(nextJ); setMaxY(nextMy); setPairs(acc); setSteps(s => s + Math.max(0, n - (iIdx + 1))); setLastVerdict({ i:i-1, j:n, verdict:'done' });
  }

  // Build stateless overlays in data coordinates for the current state
  function buildOverlays(points: Pt[]): PlaneOverlays {
    const xs = points.map(p=>p.x);
    const xMax = xs.length ? Math.max(5, Math.max(...xs)) : 5;
    const overlays: PlaneOverlays = { lines: [], rects: [], labels: [] };
    if (sorted.length === 0) return overlays;
    const i = Math.min(iIdx, sorted.length-1);
    const L = sorted[i];
    const yTop = L.y;
    const yBottom = Number.isFinite(maxY) ? Math.min(yTop, Math.max(0, maxY)) : 0;
    if (xMax > L.x && yTop >= yBottom) {
      overlays.rects.push({ x1: L.x, y1: yBottom, x2: xMax, y2: yTop, fill: '#10B98133' });
      overlays.lines.push({ x1:L.x, y1:yTop, x2:xMax, y2:yTop, stroke:'#10B981' });
      overlays.lines.push({ x1:L.x, y1:yBottom, x2:L.x, y2:yTop, stroke:'#10B981' });
      overlays.lines.push({ x1:xMax, y1:yBottom, x2:xMax, y2:yTop, stroke:'#10B981' });
    }
    if (Number.isFinite(maxY)) {
      overlays.lines.push({ x1: L.x, y1: maxY, x2: xMax, y2: maxY, stroke: '#10B981', width: (acceptedFlash && acceptedFlash.y===maxY && Date.now()-acceptedFlash.at<600) ? 2.5 : 1 });
      overlays.lines.push({ x1: 0, y1: maxY, x2: xMax, y2: maxY, stroke:'#94A3B8', dash:'4 3', opacity:0.6 });
      overlays.labels.push({ x: 0.2, y: maxY - 0.2, lines: [`maxY = ${maxY}`, '(exclusive)'], anchor:'start', fill:'#475569', fontSize:10 });
    }
    const useLast = lastVerdict && lastVerdict.verdict !== 'done' && lastVerdict.i < sorted.length && lastVerdict.j < sorted.length;
    const ci = useLast ? (lastVerdict as any).i as number : iIdx;
    const cj = useLast ? (lastVerdict as any).j as number : jIdx;
    if (ci < sorted.length && cj < sorted.length) {
      const A = sorted[ci], B = sorted[cj];
      overlays.lines.push({ x1:A.x, y1:A.y, x2:B.x, y2:B.y, stroke:'#F59E0B', dash:'4 3' });
    }
    return overlays;
  }

  return { sorted, iIdx, jIdx, maxY, pairs, steps, lastVerdict, acceptedFlash, reset, step, back, runAll, runI, buildOverlays };
}

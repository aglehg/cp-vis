"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pt, Pair, PlaneOverlays } from "@/lib/leetcode/3027/types";

// Stepping visualization for the inclusive 2D prefix-sum based check.
export function usePrefixPairs2D(points: Pt[], pref: number[][]) {
  const sorted = useMemo(() => [...points].sort((a,b)=> a.x === b.x ? b.y - a.y : a.x - b.x), [points]);
  const maxX = pref.length > 0 ? pref.length - 1 : 0;
  const maxY = pref.length > 0 ? (pref[0]?.length ?? 0) - 1 : 0;

  const [iIdx, setI] = useState(0);
  const [jIdx, setJ] = useState(1);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [steps, setSteps] = useState(0);
  const [lastVerdict, setLastVerdict] = useState<string>("");

  useEffect(()=>{ setI(0); setJ(1); setPairs([]); setSteps(0); setLastVerdict(""); }, [sorted.length, pref]);

  const sumRect = (x1:number,y1:number,x2:number,y2:number) => {
    if (x1 > x2 || y1 > y2) return 0;
    const A = pref[x2]?.[y2] ?? 0;
    const B = x1>0 ? (pref[x1-1]?.[y2] ?? 0) : 0;
    const C = y1>0 ? (pref[x2]?.[y1-1] ?? 0) : 0;
    const D = (x1>0 && y1>0) ? (pref[x1-1]?.[y1-1] ?? 0) : 0;
    return A - B - C + D;
  };

  function step() {
    const n = sorted.length; if (n === 0) return;
    let i = iIdx, j = jIdx;
    if (i >= n) return;
    if (j >= n) { i++; j = i + 1; setI(i); setJ(j); return; }
    const L = sorted[i]; const R = sorted[j];
    if (R.x >= L.x && R.y <= L.y) {
      const x1 = Math.max(0, Math.min(L.x, R.x));
      const x2 = Math.min(maxX, Math.max(L.x, R.x));
      const y1 = Math.max(0, Math.min(L.y, R.y));
      const y2 = Math.min(maxY, Math.max(L.y, R.y));
      const cnt = sumRect(x1,y1,x2,y2);
      if (cnt === 2) {
        const kind = L.x === R.x ? 'vertical' : L.y === R.y ? 'horizontal' : 'other' as const;
        setPairs(prev => prev.concat([{ id: `${L.id}-${R.id}`, a: L, b: R, kind }]));
        setLastVerdict(`(${R.x},${R.y}) accepted: count=2`);
      } else {
        setLastVerdict(`(${R.x},${R.y}) rejected: count=${cnt}`);
      }
    } else {
      setLastVerdict(`(${R.x},${R.y}) rejected: order`);
    }
    setJ(j+1); setSteps(s=>s+1);
  }

  function back() {
    const target = Math.max(0, steps-1);
    const n = sorted.length; const acc: Pair[] = [];
    let cnt = 0; let i=0, j=1; let last = "";
    while (cnt < target && i < n) {
      if (j >= n) { i++; j = i + 1; continue; }
      const L = sorted[i], R = sorted[j];
      if (R.x >= L.x && R.y <= L.y) {
        const x1 = Math.max(0, Math.min(L.x, R.x));
        const x2 = Math.min(maxX, Math.max(L.x, R.x));
        const y1 = Math.max(0, Math.min(L.y, R.y));
        const y2 = Math.min(maxY, Math.max(L.y, R.y));
        const c = sumRect(x1,y1,x2,y2);
        if (c === 2) acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind: (L.x===R.x?'vertical': L.y===R.y?'horizontal':'other') });
        last = `(${R.x},${R.y}) ${c===2?'accepted':'rejected'}: count=${c}`;
      }
      j++; cnt++;
    }
    setPairs(acc); setI(i); setJ(j); setSteps(target); setLastVerdict(last);
  }

  function reset() { setI(0); setJ(1); setPairs([]); setSteps(0); setLastVerdict(""); }

  function runAll() {
    const n = sorted.length; const acc: Pair[] = [];
    let i=0, j=1; let last = "";
    while (i < n) {
      if (j >= n) { i++; j = i + 1; continue; }
      const L = sorted[i], R = sorted[j];
      if (R.x >= L.x && R.y <= L.y) {
        const x1 = Math.max(0, Math.min(L.x, R.x));
        const x2 = Math.min(maxX, Math.max(L.x, R.x));
        const y1 = Math.max(0, Math.min(L.y, R.y));
        const y2 = Math.min(maxY, Math.max(L.y, R.y));
        const c = sumRect(x1,y1,x2,y2);
        if (c === 2) acc.push({ id: `${L.id}-${R.id}`, a: L, b: R, kind: (L.x===R.x?'vertical': L.y===R.y?'horizontal':'other') });
        last = `(${R.x},${R.y}) ${c===2?'accepted':'rejected'}: count=${c}`;
      }
      j++;
    }
    setPairs(acc); setI(i); setJ(j); setSteps(n*(n-1)/2); setLastVerdict(last);
  }

  const buildOverlays = (): PlaneOverlays => {
    const overlays: PlaneOverlays = { lines: [], rects: [], labels: [] };
    const n = sorted.length; if (n===0) return overlays;
    const i = Math.min(iIdx, n-1); const j = Math.min(jIdx, n-1);
    const L = sorted[i]; const R = sorted[j] ?? null;
    if (R) overlays.lines.push({ x1:L.x, y1:L.y, x2:R.x, y2:R.y, stroke:'#F59E0B', dash:'4 3' });
    return overlays;
  };

  const highlightRect = useMemo(() => {
    const n = sorted.length; if (n===0) return null as null | { x1:number;y1:number;x2:number;y2:number };
    const i = Math.min(iIdx, n-1); const j = Math.min(jIdx, n-1);
    const L = sorted[i]; const R = sorted[j] ?? null; if (!R) return null;
    if (!(R.x >= L.x && R.y <= L.y)) return null;
    return { x1: Math.min(L.x,R.x), y1: Math.min(L.y,R.y), x2: Math.max(L.x,R.x), y2: Math.max(L.y,R.y) };
  }, [sorted, iIdx, jIdx]);

  return { sorted, iIdx, jIdx, pairs, steps, lastVerdict, reset, step, back, runAll, buildOverlays, highlightRect };
}


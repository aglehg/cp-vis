"use client";

import React from "react";
import { parsePoints } from "@/hooks/leetcode/3027/usePointsModel";
import { usePrefixSum2D } from "@/hooks/leetcode/3027/usePrefixSum2D";
import { usePrefixPairs2D } from "@/hooks/leetcode/3027/usePrefixPairs2D";
import { PrefixSumMatrix } from "@/components/tools/PrefixSumMatrix";
import { GraphPanel } from "@/components/leetcode/3027/GraphPanel";
import { StepControls } from "@/components/leetcode/3027/StepControls";

export default function SolutionPrefixsum() {
  const [psText, setPsText] = React.useState(
    "[[1,7],[2,4],[4,3],[4,2],[5,5],[7,3],[9,1],[10,6],[11,3],[11,6],[14,3]]"
  );
  const psParsed = React.useMemo(() => parsePoints(psText), [psText]);
  const psPoints = psParsed.ok ? psParsed.points : [];

  // Inclusive prefix over 0..max (no compression)
  const { size: psN, prefix: psPref } = usePrefixSum2D(psPoints);

  // 2D pair discovery using prefix queries
  const psPairs = usePrefixPairs2D(psPoints, psPref);
  const psOverlays = React.useMemo(
    () => psPairs.buildOverlays(),
    [psPairs.buildOverlays, psPairs.iIdx, psPairs.jIdx, psPairs.pairs]
  );

  // Build explanatory label using current i,j and prefix matrix (A, B, C, D)
  const psLabel = React.useMemo<React.ReactNode>(() => {
    const n = psPairs.sorted.length;
    if (n === 0) return `Matrix size: ${psN} × ${psN}`;
    const i = Math.min(psPairs.iIdx, n - 1);
    const j = Math.min(psPairs.jIdx, n - 1);
    const L = psPairs.sorted[i];
    const R = psPairs.sorted[j];
    if (!R) return `Matrix size: ${psN} × ${psN}`;
    if (!(R.x >= L.x && R.y <= L.y)) return `pi=(${L.x},${L.y}), pj=(${R.x},${R.y}) rejected: order. We don't need to count points between`;

    const max = psN - 1;
    const x1 = Math.max(0, Math.min(L.x, R.x));
    const x2 = Math.min(max, Math.max(L.x, R.x));
    const y1 = Math.max(0, Math.min(L.y, R.y));
    const y2 = Math.min(max, Math.max(L.y, R.y));

    const A = psPref[x2]?.[y2] ?? 0;
    const B = x1 > 0 ? (psPref[x1 - 1]?.[y2] ?? 0) : 0;
    const C = y1 > 0 ? (psPref[x2]?.[y1 - 1] ?? 0) : 0;
    const D = x1 > 0 && y1 > 0 ? (psPref[x1 - 1]?.[y1 - 1] ?? 0) : 0;
 
    return (
      <div className="space-y-1"> 
        <div> 
          Points between  pi=({L.x},{L.y}), pj=({R.x},{R.y}), rect=[{x1}..{x2}]×[{y1}..{y2}]
        </div> 
        <div>
          M<sub>({x2},{y2})</sub>
          - M<sub> {x1 > 0 ? `(${x1 - 1},${y2})` : "0"}</sub>
          - M<sub>({x2},{y1 - 1})</sub>
          + M<sub>({x1 - 1},{y1 - 1})</sub>
        </div>
        <div>
          {A} - {B} - {C} + {D} = {A - B - C + D}
        </div>
      </div>
    );
  }, [psPairs.sorted, psPairs.iIdx, psPairs.jIdx, psN, psPref]);

  return (
    <div className="w-full space-y-3">
      <h2 className="text-2xl font-medium">Prefix Sum 2D O(n<sup>2</sup>)</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: instructions + input + step controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Steps</h3>
          <ol className="list-[upper-roman] list-inside text-sm text-slate-600 space-y-2">
            <li>Declare a helper matrix of length (max+1 × max+1) initialized to 0</li>
            <li><b>Sort</b> points by <b>x ascending, y descending</b></li>
            <li>Fill the prefix such that F(x,y) = count of points with x' ≤ x and y' ≤ y</li>
            <li>For each i, scan j ≥ i; accept if xj ≥ xi, yj ≤ yi and F([xi..xj]×[yj..yi]) = 2</li>
          </ol>

          <label className="text-sm font-medium">Points JSON</label>
          <textarea
            className="w-full h-28 p-3 rounded-xl border bg-white"
            value={psText}
            onChange={(e) => setPsText(e.target.value)}
            spellCheck={false}
          />
          {!psParsed.ok && (
            <div className="text-sm text-red-600">{psParsed.error}</div>
          )}

          <StepControls
            onReset={psPairs.reset}
            onBack={psPairs.back}
            onStep={psPairs.step}
            onRunAll={psPairs.runAll}
            label={`Step ${psPairs.steps}${psPairs.lastVerdict ? ' — ' + psPairs.lastVerdict : ''}`}
          />
        </div>

        {/* Right: graph + matrix */}
        <div className="lg:col-span-2 space-y-4"> 
            <GraphPanel
              points={psPoints}
              pairs={psPairs.pairs}
              sorted={psPairs.sorted}
              iIdx={psPairs.iIdx}
              jIdx={psPairs.jIdx}
              maxY={0}
              showSortedIdx={true}
              overlays={psOverlays}
            /> 

          <div className="space-y-2">
            <div className="text-sm text-slate-600">{psLabel}</div>
            <PrefixSumMatrix
              size={psN}
              matrix={psPref}
              highlightRect={psPairs.highlightRect || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

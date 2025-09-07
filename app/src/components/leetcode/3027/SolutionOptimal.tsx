"use client";

import React from "react";
import { usePointsModel } from "@/hooks/leetcode/3027/usePointsModel";
import { useSweepPairs } from "@/hooks/leetcode/3027/useSweepPairs";
import { GraphPanel } from "@/components/leetcode/3027/GraphPanel";
import { StepControls } from "@/components/leetcode/3027/StepControls";
import { PairsList } from "@/components/leetcode/3027/PairsList";

export default function SolutionOptimal() {
  const { text, setText, parsed, points } = usePointsModel();
  const {
    sorted,
    iIdx,
    jIdx,
    maxY,
    pairs,
    steps,
    lastVerdict,
    acceptedFlash,
    reset,
    step,
    back,
    runAll,
    buildOverlays,
  } = useSweepPairs(points);
  const overlays = React.useMemo(
    () => buildOverlays(points),
    [buildOverlays, points, iIdx, jIdx, maxY, pairs, lastVerdict, acceptedFlash]
  );

  const verdictLabel = React.useMemo(() => {
    if (!lastVerdict) return "";
    const pj =
      lastVerdict.j >= 0 && lastVerdict.j < sorted.length ? sorted[lastVerdict.j] : null;
    const pt = pj ? `(${pj.x},${pj.y}) ` : "";
    if (lastVerdict.verdict === "accept") return `${pt}accepted: maxY ← ${lastVerdict.yj}`;
    if (lastVerdict.verdict === "reject_y")
      return `${pt}rejected: yj ≤ maxY (${lastVerdict.yj} ≤ ${maxY})`;
    if (lastVerdict.verdict === "reject_pos") return `${pt}rejected: yj > yi`;
    return "";
  }, [lastVerdict, maxY, sorted]);

  return (
    <div className="w-full space-y-3">
      <h2 className="text-2xl font-medium">Optimal O(n<sup>2</sup>)</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Steps</h3>
          <ol className="list-[upper-roman] list-inside text-sm text-slate-600 space-y-2">
            <li>
              <b>Sort</b> points by <b>x ascending, y descending.</b>
            </li>
            <li>
              At <b>each point p<sub>i</sub>, scan</b> points to the <b>right</b> of i.
              <br />Keep <b>track</b> of the <b>maximum</b> y-coordinate <b>maxY</b> seen to the right of p<sub>i</sub>.
              <br />
              <small>For each step we connect the pair (p<sub>i</sub>,p<sub>j</sub>) with a yellow dotted line.</small>
            </li>
            <li>
              Valid pairs are <b>below p<sub>i</sub></b>, and <b>strictly above</b> the maxY seen since we started scanning for p<sub>i</sub>.
              <br />
              <small>
                In the interface we connect valid pairs with a full green line. Hover over the line to see the corresponding rectangle
              </small>
            </li>
          </ol>

          <label className="text-sm font-medium">Points JSON</label>
          <textarea
            className="w-full h-28 p-3 rounded-xl border bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          {!parsed.ok && (
            <div className="text-sm text-red-600">{parsed.error}</div>
          )}

          <StepControls
            onReset={reset}
            onBack={back}
            onStep={step}
            onRunAll={runAll}
            label={`Step ${steps}${verdictLabel ? " — " + verdictLabel : ""}`}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <GraphPanel
            points={points}
            pairs={pairs}
            sorted={sorted}
            iIdx={iIdx}
            jIdx={jIdx}
            maxY={maxY}
            showSortedIdx={true}
            overlays={overlays}
          />
          <PairsList pairs={pairs} />
        </div>
      </div>
    </div>
  );
}


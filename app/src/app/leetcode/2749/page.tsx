"use client";

import React from "react";
import MinOpsProof from "./proof.mdx";

export default function Page2749() {
  const [num1, setNum1] = React.useState<string>("5");
  const [num2, setNum2] = React.useState<string>("-21");
  const [k, setK] = React.useState<number>(1); // step count

  const N1 = React.useMemo(() => BigInt(Number(num1 || 0)), [num1]);
  const N2 = React.useMemo(() => BigInt(Number(num2 || 0)), [num2]);
  const S = React.useMemo(() => N1 - BigInt(k) * N2, [N1, N2, k]);

  // Bits ribbon helpers for S
  const absS = React.useMemo(() => (S < 0n ? -S : S), [S]);
  const popcount = React.useCallback((x: bigint) => {
    let n = x < 0n ? -x : x;
    let c = 0;
    while (n > 0n) {
      if (n & 1n) c++;
      n >>= 1n;
    }
    return c;
  }, []);
  const popS = React.useMemo(() => popcount(S), [S, popcount]);
  const [showFullBits, setShowFullBits] = React.useState(false);
  const bitRangeMaxFull = 60; // problem constraint i ∈ [0,60]
  const msbIndex = React.useMemo(() => {
    if (absS === 0n) return 0;
    let n = absS;
    let idx = -1;
    while (n > 0n) { idx++; n >>= 1n; }
    return idx;
  }, [absS]);
  const bitRangeMax = React.useMemo(() => {
    if (showFullBits) return bitRangeMaxFull;
    const margin = 2; // show a little headroom for splits
    const cap = Math.min(bitRangeMaxFull, Math.max(4, msbIndex + margin));
    return cap;
  }, [showFullBits, msbIndex]);
  const ribbon = React.useMemo(() => {
    const arr: boolean[] = [];
    for (let i = 0; i <= bitRangeMax; i++) {
      const on = ((absS >> BigInt(i)) & 1n) === 1n;
      arr.push(on);
    }
    return arr;
  }, [absS, bitRangeMax]);

  // Feasibility and canonical i-multiset for current k
  const kNum = k;
  const feasSNonNeg = S >= 0n;
  const feasKLeS = feasSNonNeg && BigInt(kNum) <= S;
  const feasPcLeK = React.useMemo(() => popS <= kNum, [popS, kNum]);
  const feasible = feasSNonNeg && feasKLeS && feasPcLeK;

  const canonicalISet = React.useMemo(() => {
    if (!feasible) return null as null | number[];
    const exps: number[] = [];
    let t = S;
    let i = 0;
    while (t > 0n) {
      if (t & 1n) exps.push(i);
      t >>= 1n;
      i++;
    }
    while (exps.length < kNum) {
      exps.sort((a, b) => b - a);
      const j = exps.shift() as number;
      exps.push(j - 1, j - 1);
    }
    exps.sort((a, b) => a - b);
    return exps;
  }, [S, feasible, kNum]);

  // k controls
  function incK() { setK((x) => Math.min(60, x + 1)); }
  function decK() { setK((x) => Math.max(1, x - 1)); }
  function resetK() { setK(1); }
  function findMinimalK() {
    for (let kk = 1; kk <= 60; kk++) {
      const SK = N1 - BigInt(kk) * N2;
      const ok = SK >= 0n && popcount(SK) <= kk && BigInt(kk) <= SK;
      if (ok) { setK(kk); return; }
    }
  }

  const fmt = (x: bigint) => x.toString();
  const sign = (x: bigint) => (x < 0n ? "−" : "+");
  const abs = (x: bigint) => (x < 0n ? -x : x);
  const fmtBin = (x: bigint) => (x < 0n ? "-0b" + (-x).toString(2) : "0b" + x.toString(2));

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900 space-y-6">
      <h1 className="text-2xl font-semibold">2749. Minimum Operations to Make the Integer Zero</h1>

          <div className="p-4 rounded-xl bg-white border space-y-2">
            <div className="text-sm font-medium">Why this works</div>
            <div className="text-sm text-slate-900 dark:text-slate-100">
              <MinOpsProof />
            </div>
          </div> 

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
           
          <div className="p-4 rounded-xl bg-white border space-y-3">
            <div className="text-sm font-medium">Inputs</div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-16">num1</label>
              <input
                className="w-40 px-2 py-1 rounded border"
                value={num1}
                onChange={(e) => setNum1(e.target.value)}
                type="number"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-16">num2</label>
              <input
                className="w-40 px-2 py-1 rounded border"
                value={num2}
                onChange={(e) => setNum2(e.target.value)}
                type="number"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border space-y-3">
            <div className="text-sm font-medium">k Controls</div>
            <div className="flex items-center gap-2">
              <button onClick={decK} className="h-9 px-3 inline-flex items-center rounded border">Prev</button>
              <button onClick={incK} className="h-9 px-3 inline-flex items-center rounded bg-slate-900 text-white">Next</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetK} className="h-9 px-3 inline-flex items-center rounded border">Reset: k=1</button>
              <button onClick={findMinimalK} className="h-9 px-3 inline-flex items-center rounded border">Find minimum k</button>
              <span className="ml-2 text-xs text-slate-600">k = {k}</span>
            </div>
            <div className="mt-2 font-mono text-xs">
              S(k) = num1 − k·num2 = {fmt(S)} ({fmtBin(S)})
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl bg-white border space-y-3">
            <div className="text-sm font-medium">Bits Ribbon for S(k)</div>
            <div className="font-mono text-sm">
              S = {S < 0n ? "-" : ""}{absS.toString()} (dec) = {S < 0n ? "-" : ""}0b{absS.toString(2)}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>popcount(S) = {popS}, k = {k}</span>
              <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border"
                  checked={showFullBits}
                  onChange={(e) => setShowFullBits(e.target.checked)}
                />
                <span>Show full 0..60</span>
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-1 overflow-x-auto py-1">
                {ribbon.map((on, i) => (
                  <div
                    key={i}
                    title={`bit ${i} (2^${i})`}
                    className={`shrink-0 w-10 h-14 border rounded-md flex flex-col items-center justify-between px-1 ${on ? "bg-emerald-500/90 text-white border-emerald-600" : "bg-white text-slate-700"}`}
                  >
                    <div className="text-[10px] leading-none text-slate-600/90 w-full text-left">i={i}</div>
                    <div className={`text-base font-semibold leading-none ${on ? "text-white" : "text-slate-900"}`}>{on ? 1 : 0}</div>
                    <div className="text-[10px] leading-none text-slate-500">2^{i}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-500">Swipe/scroll horizontally • Range: bits 0..{bitRangeMax}{showFullBits ? " (full)" : " (auto)"}</div>
            </div>
          </div>
          
          
    
          <div className="p-4 rounded-xl bg-white border space-y-2">
            <div className="text-sm font-medium">Feasibility for current k</div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${feasSNonNeg ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>S(k) ≥ 0</span>
              <span className={`px-2 py-0.5 rounded ${feasPcLeK ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>popcount(S(k)) ≤ k</span>
              <span className={`px-2 py-0.5 rounded ${feasKLeS ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>k ≤ S(k)</span>
            </div>
            {!feasible && (
              <div className="text-sm text-rose-700">
                {!feasSNonNeg && <div>Invalid: S(k) is negative.</div>}
                {feasSNonNeg && !feasPcLeK && <div>Invalid: need at least popcount(S) = {popS} terms.</div>}
                {feasSNonNeg && feasPcLeK && !feasKLeS && <div>Invalid: k must be ≤ S(k).</div>}
              </div>
            )}
            <div className="font-mono text-xs text-slate-600">S(k) = num1 − k·num2 = {fmt(S)} ({fmtBin(S)}).</div>
          </div>

          <div className="p-4 rounded-xl bg-white border space-y-2">
            <div className="text-sm font-medium">Goal Summary</div>
            <div className="font-mono text-sm">S(k) = {fmt(S)} ({fmtBin(S)}), k = {k}</div>
            {feasible ? (
              <div className="text-sm text-emerald-700">Feasible: S(k) can be written as a sum of exactly k powers of two.</div>
            ) : (
              <div className="text-sm text-rose-700">Not feasible for this k. Try Next k or Find minimal k.</div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white border space-y-3">
            <div className="text-sm font-medium">Canonical i Multiset (for current k)</div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${feasSNonNeg ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>S ≥ 0</span>
              <span className={`px-2 py-0.5 rounded ${feasPcLeK ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>popcount(S) ≤ k</span>
              <span className={`px-2 py-0.5 rounded ${feasKLeS ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>k ≤ S</span>
            </div>
            <div className="font-mono text-sm">S = {fmt(S)} ({fmtBin(S)}), k = {kNum}</div>
            {!feasible && (
              <div className="text-sm text-rose-700">
                {!feasSNonNeg && <div>Invalid for this k: S is negative.</div>}
                {feasSNonNeg && !feasPcLeK && <div>Invalid: need at least popcount(S) = {popS} terms.</div>}
                {feasSNonNeg && feasPcLeK && !feasKLeS && <div>Invalid: k must be ≤ S.</div>}
              </div>
            )}
            {feasible && canonicalISet && (
              <div className="space-y-2">
                <div className="text-sm text-slate-700">One valid multiset of i’s of size k that sums to S:</div>
                <div className="flex flex-wrap gap-2">
                  {canonicalISet.map((i, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono">
                      i={i}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-600">Built from S’s set bits, then splitting the largest 2^j → 2^(j−1)+2^(j−1) until there are k terms.</div>
              </div>
            )}
          </div>

        
        </div>
      </div>
    </div>
  );
}

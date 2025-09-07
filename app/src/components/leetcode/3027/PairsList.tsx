"use client";

import React, { useMemo } from "react";
import type { Pair } from "@/lib/leetcode/3027/types";

export function PairsList({ pairs }: { pairs: Pair[] }) {
  const groups = useMemo(() => ({
    horizontal: pairs.filter(p => p.kind === "horizontal"),
    vertical: pairs.filter(p => p.kind === "vertical"),
    other: pairs.filter(p => p.kind === "other"),
  }), [pairs]);

  return (
    <div className="p-3 rounded-2xl bg-white border shadow-sm">
      <div className="font-medium mb-2">Pairs ({pairs.length})</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="font-medium mb-1">Horizontal (x equal)</div>
          {groups.horizontal.length === 0 ? (
            <div className="text-slate-500">None</div>
          ) : (
            <ul className="space-y-1">
              {groups.horizontal.map(p => (
                <li key={p.id} className="font-mono">({p.a.x},{p.a.y}) ↔ ({p.b.x},{p.b.y})</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="font-medium mb-1">Vertical (y equal)</div>
          {groups.vertical.length === 0 ? (
            <div className="text-slate-500">None</div>
          ) : (
            <ul className="space-y-1">
              {groups.vertical.map(p => (
                <li key={p.id} className="font-mono">({p.a.x},{p.a.y}) ↔ ({p.b.x},{p.b.y})</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="font-medium mb-1">Others</div>
          {groups.other.length === 0 ? (
            <div className="text-slate-500">None</div>
          ) : (
            <ul className="space-y-1">
              {groups.other.map(p => (
                <li key={p.id} className="font-mono">({p.a.x},{p.a.y}) ↔ ({p.b.x},{p.b.y})</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-2">Sorted by x asc, y desc; stepping scans j & updates when y increases toward left.y.</div>
    </div>
  );
}


"use client";

import React from "react";

export interface PrefixSumMatrixProps {
  size: number; // n (renders n x n)
  matrix: number[][]; // controlled values [n][n]
  highlight?: { i: number; j: number } | null;
  highlightRect?: { x1:number; y1:number; x2:number; y2:number } | null;
  onCellClick?: (i: number, j: number) => void;
}

export function PrefixSumMatrix({ size, matrix, highlight, highlightRect, onCellClick }: PrefixSumMatrixProps) {
  const n = size;
  const getVal = (i: number, j: number) => (matrix[i]?.[j] ?? 0);

  return (
    <div className="inline-block overflow-auto rounded-xl border bg-white">
      <table className="border-collapse">
        <tbody>
          {Array.from({ length: n }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: n }).map((__, j) => {
                const v = getVal(i, j);
                const isHL = highlight && highlight.i === i && highlight.j === j;
                const inRect = !!(highlightRect && i >= highlightRect.x1 && i <= highlightRect.x2 && j >= highlightRect.y1 && j <= highlightRect.y2);
                return (
                  <td
                    key={j}
                    onClick={() => onCellClick?.(i, j)}
                    className={`text-center select-none align-middle border ${isHL ? 'bg-amber-50 border-amber-300' : inRect ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'}`}
                    style={{ width: 34, height: 28 }}
                  >
                    <span className="text-sm font-mono text-slate-700">{v}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

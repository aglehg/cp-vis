"use client";

import { useMemo } from "react";
import type { Pt } from "@/lib/leetcode/3027/types";

// Builds an inclusive 2D prefix-sum grid over 0..max range (no compression).
// size = max(maxX, maxY) + 1 so indices map directly to coordinates.
export function usePrefixSum2D(points: Pt[]) {
  const { size, prefix } = useMemo(() => {
    if (!points || points.length === 0) {
      return { size: 1, prefix: [[0]] as number[][] };
    }
    const maxX = Math.max(0, ...points.map(p => p.x));
    const maxY = Math.max(0, ...points.map(p => p.y));
    const n = Math.max(maxX, maxY) + 1; // 0..max inclusive
    const M: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    // Place points (inclusive grid)
    for (const p of points) {
      if (p.x >= 0 && p.x < n && p.y >= 0 && p.y < n) M[p.x][p.y] += 1;
    }
    // Inclusive prefix
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        const a = M[x][y];
        const b = x > 0 ? M[x - 1][y] : 0;
        const c = y > 0 ? M[x][y - 1] : 0;
        const d = x > 0 && y > 0 ? M[x - 1][y - 1] : 0;
        M[x][y] = a + b + c - d;
      }
    }
    return { size: n, prefix: M };
  }, [points]);

  return { size, prefix };
}


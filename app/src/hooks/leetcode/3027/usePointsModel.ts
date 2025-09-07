"use client";

import { useMemo, useState } from "react";
import type { Pt } from "@/lib/leetcode/3027/types";

export function parsePoints(input: string): { ok: true; points: Pt[] } | { ok: false; error: string } {
  try {
    const raw = JSON.parse(input);
    if (!Array.isArray(raw)) return { ok: false, error: "Points must be an array like [[1,1],[2,2]]" };
    const pts: Pt[] = raw.map((p: any, i: number) => {
      if (!Array.isArray(p) || p.length !== 2) throw new Error(`Point ${i} is not [x,y]`);
      const [x, y] = p;
      if (typeof x !== "number" || typeof y !== "number" || !isFinite(x) || !isFinite(y)) throw new Error(`Point ${i} must have finite numbers`);
      return { id: i, x, y };
    });
    return { ok: true, points: pts };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function usePointsModel(initial: string = "[[1,7],[2,4],[4,3],[4,2],[5,5],[7,3],[9,1],[10,6],[11,3],[11,6],[14,3]]") {
  const [text, setText] = useState(initial);
  const parsed = useMemo(() => parsePoints(text), [text]);
  const points: Pt[] = parsed.ok ? parsed.points : [];
  return { text, setText, parsed, points };
}


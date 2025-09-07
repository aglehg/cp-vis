"use client";

import { useMemo } from "react";
import type { Pt } from "@/lib/leetcode/3027/types";
import { scaleLinear } from "d3-scale";
import { ticks as d3ticks } from "d3-array";

export function usePlaneScales(points: Pt[], opts?: { width?: number; height?: number; padding?: number }) {
  const width = opts?.width ?? 560;
  const height = opts?.height ?? 380;
  const padding = opts?.padding ?? 24;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = 0, yMin = 0;
  const xMax = xs.length ? Math.max(5, Math.max(...xs)) : 5;
  const yMax = ys.length ? Math.max(5, Math.max(...ys)) : 5;

  const xScaleObj = useMemo(() => scaleLinear()
    .domain([xMin, xMax])
    .range([padding, width - padding])
    .nice(), [xMin, xMax, width, padding]);
  const yScaleObj = useMemo(() => scaleLinear()
    .domain([yMin, yMax])
    .range([height - padding, padding])
    .nice(), [yMin, yMax, height, padding]);

  const xScale = (x: number) => xScaleObj(x);
  const yScale = (y: number) => yScaleObj(y);
  const xUnscale = (px: number) => xScaleObj.invert(px);
  const yUnscale = (py: number) => yScaleObj.invert(py);

  const ticks = useMemo(() => {
    const desired = 12; // reasonable default
    const xTicks = d3ticks(xMin, xMax, desired).filter(v => Number.isInteger(v));
    const yTicks = d3ticks(yMin, yMax, desired).filter(v => Number.isInteger(v));
    return { xTicks, yTicks };
  }, [xMin, xMax, yMin, yMax]);

  return { width, height, padding, xMin, xMax, yMin, yMax, xScale, yScale, xUnscale, yUnscale, ticks };
}

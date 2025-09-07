"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Pt, Pair } from "@/lib/leetcode/3027/types";
import { usePlaneScales } from "@/hooks/leetcode/3027/usePlaneScales";

export function GraphPanel(props: {
  points: Pt[];
  pairs: Pair[];
  sorted: Pt[];
  iIdx: number;
  jIdx: number;
  maxY: number;
  showSortedIdx?: boolean;
  overlays?: { lines: {x1:number;y1:number;x2:number;y2:number;stroke?:string;dash?:string;width?:number;opacity?:number}[]; rects: {x1:number;y1:number;x2:number;y2:number;fill?:string;stroke?:string;opacity?:number}[]; labels: {x:number;y:number;lines:string[];anchor?:'start'|'middle'|'end';fill?:string;fontSize?:number}[] };
}) {
  const { points, pairs, sorted, iIdx, jIdx, maxY, showSortedIdx, overlays } = props;
  const { width, height, padding, xScale, yScale, xUnscale, yUnscale, xMax, yMax, yMin, ticks } = usePlaneScales(points);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ x:number; y:number }|null>(null);

  const hoverRect = useMemo(() => {
    if (!hover || points.length === 0) return null;
    const set = new Set(pairs.map(p=>`${p.a.id}-${p.b.id}`));
    const mx = hover.x, my = hover.y;
    let tl: Pt | null = null, br: Pt | null = null;
    for (const p of points) {
      if (p.x <= mx && p.y >= my) { if (!tl || p.x > tl.x || (p.x === tl.x && p.y < tl.y)) tl = p; }
      if (p.x >= mx && p.y <= my) { if (!br || p.x < br.x || (p.x === br.x && p.y > br.y)) br = p; }
    }
    if (!tl || !br) return null;
    if (!set.has(`${tl.id}-${br.id}`)) return null;
    return { x1: tl.x, y1: br.y, x2: br.x, y2: tl.y };
  }, [hover, points, pairs]);

  // Only show the hovered valid rectangle; no gray touching rectangles

  return (
    <div className="p-3 rounded-2xl bg-white border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Plane (points & valid pairs)</div>
        <div className="text-xs text-slate-500">Pairs {pairs.length} · i={iIdx < sorted.length ? iIdx : '–'} j={jIdx < sorted.length ? jIdx : '–'} maxY={Number.isFinite(maxY) ? maxY : '-∞'}</div>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-auto"
        onMouseMove={(e)=>{
          if(!svgRef.current) return; const rect = svgRef.current.getBoundingClientRect();
          setHover({ x: xUnscale(e.clientX-rect.left), y: yUnscale(e.clientY-rect.top) });
        }}
        onMouseLeave={()=>setHover(null)}
      >
        {/* axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#CBD5E1" />
        {/* ticks */}
        {ticks.xTicks.map(tx => (
          <g key={`xt-${tx}`}>
            <line x1={xScale(tx)} y1={height - padding} x2={xScale(tx)} y2={height - padding + 4} stroke="#94A3B8" />
            <text x={xScale(tx)} y={height - padding + 14} fontSize={10} textAnchor="middle" fill="#64748B" className="font-mono">{tx}</text>
          </g>
        ))}
        {ticks.yTicks.map(ty => (
          <g key={`yt-${ty}`}>
            <line x1={padding - 4} y1={yScale(ty)} x2={padding} y2={yScale(ty)} stroke="#94A3B8" />
            <text x={padding - 6} y={yScale(ty)+3} fontSize={10} textAnchor="end" fill="#64748B" className="font-mono">{ty}</text>
          </g>
        ))}

        {/* overlays (rects/lines/labels) supplied by the hook */}
        {overlays && overlays.rects.map((r,idx)=>{
          const x = Math.min(xScale(r.x1), xScale(r.x2));
          const y = Math.min(yScale(r.y1), yScale(r.y2));
          const w = Math.abs(xScale(r.x2)-xScale(r.x1));
          const h = Math.abs(yScale(r.y2)-yScale(r.y1));
          return <rect key={`or-${idx}`} x={x} y={y} width={w} height={h} fill={r.fill || 'none'} stroke={r.stroke} opacity={r.opacity} />;
        })}
        {overlays && overlays.lines.map((l,idx)=> (
          <line key={`ol-${idx}`} x1={xScale(l.x1)} y1={yScale(l.y1)} x2={xScale(l.x2)} y2={yScale(l.y2)} stroke={l.stroke || '#000'} strokeDasharray={l.dash} strokeWidth={l.width || 1} opacity={l.opacity} />
        ))}
        {overlays && overlays.labels.map((lb,idx)=> (
          <text key={`olb-${idx}`} x={xScale(lb.x)} y={yScale(lb.y)} fontSize={lb.fontSize ?? 10} fill={lb.fill || '#475569'} textAnchor={lb.anchor || 'start'} className="font-mono">
            <tspan x={xScale(lb.x)} dy={0}>{lb.lines[0]}</tspan>
            {lb.lines.slice(1).map((ln,i)=> (
              <tspan key={i} x={xScale(lb.x)} dy={12}>{ln}</tspan>
            ))}
          </text>
        ))}

        {/* discovered pairs */}
        {pairs.map(p=> (
          <g key={p.id}>
            <line x1={xScale(p.a.x)} y1={yScale(p.a.y)} x2={xScale(p.b.x)} y2={yScale(p.b.y)} stroke="#16A34A" strokeWidth={2} />
            <circle cx={xScale(p.a.x)} cy={yScale(p.a.y)} r={3} fill="#16A34A" />
            <circle cx={xScale(p.b.x)} cy={yScale(p.b.y)} r={3} fill="#16A34A" />
          </g>
        ))}

        {/* candidate line is part of overlays now */}

        {/* hover rectangle */}
        {hoverRect && (
          <rect
            x={Math.min(xScale(hoverRect.x1), xScale(hoverRect.x2))}
            y={Math.min(yScale(hoverRect.y1), yScale(hoverRect.y2))}
            width={Math.abs(xScale(hoverRect.x2) - xScale(hoverRect.x1))}
            height={Math.abs(yScale(hoverRect.y2) - yScale(hoverRect.y1))}
            fill="#3B82F680"
            stroke="#2563EB"
          />
        )}

        {/* points */}
        {points.map(p => (
          <g key={p.id}>
            <circle cx={xScale(p.x)} cy={yScale(p.y)} r={5} fill="#0EA5E9" />
            <text x={xScale(p.x)+6} y={yScale(p.y)-6} fontSize={10} fill="#475569" className="font-mono">({p.x},{p.y})</text>
            {showSortedIdx && (()=>{
              const idx = sorted.findIndex(q => q.id === p.id);
              return idx >= 0 ? <text x={xScale(p.x)+6} y={yScale(p.y)+12} fontSize={9} fill="#64748B" className="font-mono">#{idx}</text> : null;
            })()}
          </g>
        ))}
      </svg>
    </div>
  );
}

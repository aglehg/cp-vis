"use client";

import React from "react";

export function StepControls(props: {
  onReset: () => void;
  onBack: () => void;
  onStep: () => void;
  onRunAll?: () => void;
  label?: string;
}) {
  const { onReset, onBack, onStep, onRunAll, label } = props;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="px-3 py-2 rounded-xl shadow bg-white border">Reset</button>
        <button onClick={onBack} className="px-3 py-2 rounded-xl shadow bg-white border">Step ◀</button>
        <button onClick={onStep} className="px-3 py-2 rounded-xl shadow bg-indigo-600 text-white">Step ▶</button>
        {onRunAll && (
          <button onClick={onRunAll} className="px-3 py-2 rounded-xl shadow bg-emerald-600 text-white">Run All</button>
        )}
      </div>
      {label && <div className="text-xs text-slate-600">{label}</div>}
    </div>
  );
}

"use client";

import React from "react";
import SolutionPrefixsum from "@/components/leetcode/3027/SolutionPrefixsum";
import SolutionOptimal from "@/components/leetcode/3027/SolutionOptimal";

export default function Page3027() {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900 space-y-6">
      <h1 className="text-3xl font-semibold">3027. Find the Number of Ways to Place People II</h1>
      <SolutionPrefixsum />
      <SolutionOptimal />
    </div>
  );
}


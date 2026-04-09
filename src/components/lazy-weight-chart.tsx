"use client";

import dynamic from "next/dynamic";

export const LazyWeightChart = dynamic(
  () => import("./weight-chart").then((m) => m.WeightChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] animate-pulse items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    ),
  },
);

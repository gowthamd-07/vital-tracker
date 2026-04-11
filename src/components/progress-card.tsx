"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Share2, Download, Check, Copy } from "lucide-react";

interface ProgressData {
  name: string;
  currentWeight: number | null;
  startWeight: number | null;
  bmi: number | null;
  bmiLabel: string;
  streakDays: number;
  habitsCount: number;
  daysTracking: number;
  weightChange: number | null;
  goalWeight: number | null;
}

export function ProgressCard({ data }: { data: ProgressData }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const weightLost = data.weightChange != null ? Math.abs(data.weightChange) : null;
  const isLoss = data.weightChange != null && data.weightChange < 0;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "My VitalTrack Progress",
      text: `${data.name} has been tracking health for ${data.daysTracking} days on VitalTrack!${weightLost != null ? ` ${isLoss ? "Lost" : "Gained"} ${weightLost.toFixed(1)} kg so far.` : ""}`,
      url: window.location.origin,
    };

    if (canShare) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data.name, data.daysTracking, weightLost, isLoss, canShare]);

  const handleDownload = useCallback(() => {
    const params = new URLSearchParams({
      name: data.name,
      days: String(data.daysTracking),
      ...(data.currentWeight != null && { cw: String(data.currentWeight) }),
      ...(data.bmi != null && { bmi: data.bmi.toFixed(1) }),
      ...(weightLost != null && { wc: weightLost.toFixed(1) }),
      ...(isLoss != null && { dir: isLoss ? "lost" : "gained" }),
      ...(data.streakDays > 0 && { streak: String(data.streakDays) }),
      ...(data.goalWeight != null && { goal: String(data.goalWeight) }),
    });
    window.open(`/api/og/progress?${params.toString()}`, "_blank");
  }, [data, weightLost, isLoss]);

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-lg"
      >
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="h-6 w-6 shrink-0" aria-hidden>
              <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)" />
              <path
                d="M4 17H10L13 9L16 25L19 13L21 17H28"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold text-white/80">VitalTrack</span>
          </div>

          <h3 className="mt-4 text-lg font-bold">
            {data.name}&apos;s Progress
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.daysTracking > 0 && (
              <MetricBox label="Days tracking" value={`${data.daysTracking}`} />
            )}
            {weightLost != null && (
              <MetricBox
                label={isLoss ? "Weight lost" : "Weight gained"}
                value={`${weightLost.toFixed(1)} kg`}
              />
            )}
            {data.bmi != null && (
              <MetricBox label="BMI" value={`${data.bmi.toFixed(1)}`} sub={data.bmiLabel} />
            )}
            {data.streakDays > 0 && (
              <MetricBox label="Best streak" value={`${data.streakDays} days`} />
            )}
          </div>

          {data.goalWeight != null && data.currentWeight != null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Goal: {data.goalWeight} kg</span>
                <span>Current: {data.currentWeight.toFixed(1)} kg</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white/80"
                  style={{
                    width: `${Math.min(100, Math.max(0, data.startWeight != null
                      ? ((data.startWeight - data.currentWeight) / (data.startWeight - data.goalWeight)) * 100
                      : 0
                    ))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              {canShare ? (
                <Share2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Share progress
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          <Download className="h-4 w-4" />
          Download card
        </button>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-white/60">{sub}</p>}
    </div>
  );
}

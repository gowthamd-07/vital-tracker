"use client";

import { useState, useTransition } from "react";
import { cleanupData, type CleanupResult } from "@/app/actions/cleanup";
import { Trash2, AlertTriangle } from "lucide-react";

const presets = [
  { label: "Last 1 month", months: 1 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last 1 year", months: 12 },
] as const;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function subtractMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return isoDate(d);
}

export function CleanupForm() {
  const today = isoDate(new Date());

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(today);
  const [deleteWeights, setDeleteWeights] = useState(true);
  const [deleteHabits, setDeleteHabits] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyPreset(months: number) {
    setFromDate(subtractMonths(months));
    setToDate(today);
    setResult(null);
  }

  function handleSubmit() {
    if (!fromDate || !toDate) return;
    if (!deleteWeights && !deleteHabits) return;
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    const targets: ("weights" | "habits")[] = [];
    if (deleteWeights) targets.push("weights");
    if (deleteHabits) targets.push("habits");

    startTransition(async () => {
      const res = await cleanupData(fromDate, toDate, targets);
      setResult(res);
    });
  }

  const rangeLabel =
    fromDate && toDate ? `${fromDate} → ${toDate}` : "Select a range";

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Quick range
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.months}
              type="button"
              onClick={() => applyPreset(p.months)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setResult(null);
            }}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setResult(null);
            }}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </div>

      {/* What to delete */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Delete
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={deleteWeights}
              onChange={(e) => setDeleteWeights(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-red-600 accent-red-600"
            />
            Weight entries
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={deleteHabits}
              onChange={(e) => setDeleteHabits(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-red-600 accent-red-600"
            />
            Habit completions
          </label>
        </div>
      </fieldset>

      {/* Action button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!fromDate || !toDate || (!deleteWeights && !deleteHabits) || isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Deleting…" : "Delete data in range"}
      </button>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                This cannot be undone
              </p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                Permanently delete{" "}
                {deleteWeights && deleteHabits
                  ? "weight entries and habit completions"
                  : deleteWeights
                    ? "weight entries"
                    : "habit completions"}{" "}
                from <strong>{rangeLabel}</strong>?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">Cleanup complete</p>
          <ul className="mt-1 list-inside list-disc text-zinc-700 dark:text-zinc-300">
            {result.weightsDeleted > 0 && (
              <li>{result.weightsDeleted} weight {result.weightsDeleted === 1 ? "entry" : "entries"} deleted</li>
            )}
            {result.completionsDeleted > 0 && (
              <li>{result.completionsDeleted} habit {result.completionsDeleted === 1 ? "completion" : "completions"} deleted</li>
            )}
            {result.weightsDeleted === 0 && result.completionsDeleted === 0 && (
              <li>No matching data found in the selected range.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

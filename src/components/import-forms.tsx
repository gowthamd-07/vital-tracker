"use client";

import { useState } from "react";

export function ImportCsvForms() {
  const [weightsMsg, setWeightsMsg] = useState<string | null>(null);
  const [habitsMsg, setHabitsMsg] = useState<string | null>(null);
  const [loadingW, setLoadingW] = useState(false);
  const [loadingH, setLoadingH] = useState(false);

  async function submitWeights(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWeightsMsg(null);
    setLoadingW(true);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", "weights");
    try {
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; imported?: number };
      if (!res.ok) {
        setWeightsMsg(data.error ?? "Import failed.");
      } else {
        setWeightsMsg(`Imported ${data.imported ?? 0} weight row(s).`);
        e.currentTarget.reset();
      }
    } catch {
      setWeightsMsg("Network error.");
    } finally {
      setLoadingW(false);
    }
  }

  async function submitHabits(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHabitsMsg(null);
    setLoadingH(true);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", "habits");
    try {
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; imported?: number };
      if (!res.ok) {
        setHabitsMsg(data.error ?? "Import failed.");
      } else {
        setHabitsMsg(`Recorded ${data.imported ?? 0} habit completion(s).`);
        e.currentTarget.reset();
      }
    } catch {
      setHabitsMsg("Network error.");
    } finally {
      setLoadingH(false);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
          Import weights
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          CSV with columns: date, weight_kg, optional body_fat_percent, notes.
          Rows are merged by date.
        </p>
        <form onSubmit={submitWeights} className="mt-4 space-y-3">
          <input type="hidden" name="kind" value="weights" />
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 dark:file:bg-emerald-950 dark:file:text-emerald-200"
          />
          <button
            type="submit"
            disabled={loadingW}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadingW ? "Importing…" : "Import weights"}
          </button>
          {weightsMsg && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{weightsMsg}</p>
          )}
        </form>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
          Import habits
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          CSV with habit_name, date, and optional completed (yes/no). Unknown
          habits are created automatically.
        </p>
        <form onSubmit={submitHabits} className="mt-4 space-y-3">
          <input type="hidden" name="kind" value="habits" />
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 dark:file:bg-emerald-950 dark:file:text-emerald-200"
          />
          <button
            type="submit"
            disabled={loadingH}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadingH ? "Importing…" : "Import habits"}
          </button>
          {habitsMsg && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{habitsMsg}</p>
          )}
        </form>
      </div>
    </div>
  );
}

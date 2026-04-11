"use client";

import { useState, useTransition } from "react";
import { Scale, Check } from "lucide-react";

export function QuickLog({
  today,
  action,
  hasToday,
}: {
  today: string;
  action: (formData: FormData) => Promise<void>;
  hasToday: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [logged, setLogged] = useState(hasToday);

  if (logged) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
          <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Today&apos;s weight logged
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Update it anytime from the Weight page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await action(fd);
          setLogged(true);
        });
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="entryDate" value={today} />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <Scale className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Quick log today&apos;s weight
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              name="weightKg"
              required
              min={20}
              max={400}
              step="0.1"
              placeholder="e.g. 72.5"
              className="w-full max-w-[10rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="submit"
              disabled={isPending}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Log"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

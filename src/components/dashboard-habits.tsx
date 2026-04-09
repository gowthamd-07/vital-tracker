"use client";

import { useOptimistic, useTransition, useCallback, useMemo } from "react";
import { toggleHabitCompletion } from "@/app/actions/habits";
import type { HabitWithStreak } from "@/app/actions/habits";
import { Flame } from "lucide-react";
import Link from "next/link";

type Props = {
  habits: HabitWithStreak[];
  completions: { habitId: string; completedDate: string }[];
  today: string;
};

export function DashboardHabits({ habits, completions, today }: Props) {
  const [, startTransition] = useTransition();

  const doneSet = useMemo(
    () =>
      new Set(
        completions
          .filter((c) => c.completedDate === today)
          .map((c) => c.habitId),
      ),
    [completions, today],
  );

  const [optimisticDone, addOptimistic] = useOptimistic(
    doneSet,
    (state: Set<string>, habitId: string) => {
      const next = new Set(state);
      if (next.has(habitId)) next.delete(habitId);
      else next.add(habitId);
      return next;
    },
  );

  const handleToggle = useCallback(
    (habitId: string) => {
      startTransition(async () => {
        addOptimistic(habitId);
        await toggleHabitCompletion(habitId, today);
      });
    },
    [addOptimistic, startTransition, today],
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Today&apos;s habits
        </h2>
        <Link
          href="/habits"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Manage &rarr;
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No habits yet.{" "}
          <Link
            href="/habits"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Create one
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {habits.map((h) => {
            const done = optimisticDone.has(h.id);
            return (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(h.id)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                      done
                        ? "bg-emerald-500 text-white shadow-inner"
                        : "border border-zinc-300 bg-white text-zinc-400 hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-950"
                    }`}
                    aria-label={`Toggle ${h.name}`}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <span
                    className="truncate font-medium text-zinc-800 dark:text-zinc-200"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: h.color,
                      paddingLeft: 8,
                    }}
                  >
                    {h.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {h.currentStreak > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      <Flame className="h-3.5 w-3.5" />
                      {h.currentStreak}d
                    </span>
                  )}
                  <span
                    className={
                      done
                        ? "font-medium text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400"
                    }
                  >
                    {done ? "Done" : "—"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

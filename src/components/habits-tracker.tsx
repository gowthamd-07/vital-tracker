"use client";

import {
  useOptimistic,
  useState,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import {
  toggleHabitCompletion,
  deleteHabit,
} from "@/app/actions/habits";
import type { HabitWithStreak } from "@/app/actions/habits";
import { shortDateLabel } from "@/lib/dates";
import { Flame, Star, Trash2, ChevronRight } from "lucide-react";

type Completion = { habitId: string; completedDate: string };

type Props = {
  habits: HabitWithStreak[];
  completions: Completion[];
  days: string[];
};

export function HabitsTracker({ habits, completions, days }: Props) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const completionSet = useMemo(
    () => new Set(completions.map((c) => `${c.habitId}|${c.completedDate}`)),
    [completions],
  );

  const [optimisticDone, addOptimistic] = useOptimistic(
    completionSet,
    (state: Set<string>, key: string) => {
      const next = new Set(state);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    },
  );

  const handleToggle = useCallback(
    (habitId: string, date: string) => {
      const key = `${habitId}|${date}`;
      startTransition(async () => {
        addOptimistic(key);
        await toggleHabitCompletion(habitId, date);
      });
    },
    [addOptimistic, startTransition],
  );

  const handleDelete = useCallback(
    (habitId: string) => {
      if (!confirm("Delete this habit and all its data?")) return;
      startTransition(async () => {
        await deleteHabit(habitId);
      });
    },
    [startTransition],
  );

  const today = days[days.length - 1]!;
  const doneToday = habits.filter((h) =>
    optimisticDone.has(`${h.id}|${today}`),
  ).length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Habits
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {habits.length > 0
            ? `${doneToday} of ${habits.length} completed today. Tap to toggle.`
            : "Create your first habit below."}
        </p>
      </div>

      {habits.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {habits.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() =>
                setExpandedHabit(expandedHabit === h.id ? null : h.id)
              }
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: h.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {h.name}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    {h.currentStreak}d streak
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    best {h.bestStreak}d
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${expandedHabit === h.id ? "rotate-90" : ""}`}
              />
            </button>
          ))}
        </div>
      )}

      {expandedHabit && (
        <YearHeatmap
          habit={habits.find((h) => h.id === expandedHabit)!}
          completionSet={optimisticDone}
        />
      )}

      {habits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
          No habits yet. Create one below.
        </p>
      ) : (
        <section className="overflow-x-auto">
          <div className="min-w-[36rem] rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    Habit
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="px-1 py-2 text-center font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="block text-xs">
                        {shortDateLabel(d)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {d.slice(5)}
                      </span>
                    </th>
                  ))}
                  <th className="px-1 py-2 text-center text-xs font-medium text-zinc-500">
                    Streak
                  </th>
                  <th className="w-10 px-1" />
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHabit(
                            expandedHabit === h.id ? null : h.id,
                          )
                        }
                        className="inline-flex items-center text-left hover:underline"
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: h.color,
                          paddingLeft: 8,
                        }}
                      >
                        {h.name}
                      </button>
                    </td>
                    {days.map((d) => {
                      const isOn = optimisticDone.has(`${h.id}|${d}`);
                      return (
                        <td key={d} className="px-0.5 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(h.id, d)}
                            className={`h-10 w-full min-w-[2.25rem] rounded-lg text-xs font-medium transition ${
                              isOn
                                ? "bg-emerald-500 text-white shadow-inner hover:bg-emerald-600"
                                : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            }`}
                            aria-label={`Toggle ${h.name} on ${d}`}
                          >
                            {isOn ? "✓" : ""}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center">
                      {h.currentStreak > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          <Flame className="h-3 w-3" />
                          {h.currentStreak}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">0</span>
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(h.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        aria-label={`Delete ${h.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function YearHeatmap({
  habit,
  completionSet,
}: {
  habit: HabitWithStreak;
  completionSet: Set<string>;
}) {
  const { weeks, months, totalDays, completedDays } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() + 1);

    while (start.getDay() !== 1) {
      start.setDate(start.getDate() - 1);
    }

    const ws: (string | null)[][] = [];
    const current = new Date(start);
    let total = 0;
    let completed = 0;

    while (current <= today) {
      const week: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        if (current > today) {
          week.push(null);
        } else {
          const iso = current.toISOString().slice(0, 10);
          week.push(iso);
          total++;
          if (completionSet.has(`${habit.id}|${iso}`)) completed++;
        }
        current.setDate(current.getDate() + 1);
      }
      ws.push(week);
    }

    const ms: { label: string; col: number }[] = [];
    let lastMonth = -1;
    ws.forEach((week, i) => {
      const firstDay = week.find((d) => d != null);
      if (firstDay) {
        const month = new Date(firstDay).getMonth();
        if (month !== lastMonth) {
          ms.push({
            label: new Date(firstDay).toLocaleDateString(undefined, {
              month: "short",
            }),
            col: i,
          });
          lastMonth = month;
        }
      }
    });

    return { weeks: ws, months: ms, totalDays: total, completedDays: completed };
  }, [habit.id, completionSet]);

  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const dayLabels = ["M", "", "W", "", "F", "", "S"];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-medium text-zinc-900 sm:text-lg dark:text-zinc-50">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: habit.color }}
          />
          {habit.name} — Year in review
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 sm:gap-4">
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100">
              {completedDays}
            </strong>{" "}
            / {totalDays} days ({pct}%)
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            {habit.currentStreak}d
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            {habit.bestStreak}d best
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5">
          <div className="flex flex-col gap-0.5 pr-1 pt-5">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="flex h-[13px] items-center text-[10px] leading-none text-zinc-400"
              >
                {label}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-0.5 flex gap-0.5">
              {months.map((m, i) => {
                const nextCol = months[i + 1]?.col ?? weeks.length;
                const span = nextCol - m.col;
                return (
                  <div
                    key={`${m.label}-${m.col}`}
                    className="text-[10px] leading-none text-zinc-400"
                    style={{ width: span * 13.5 }}
                  >
                    {m.label}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => {
                    if (day == null) {
                      return (
                        <div key={di} className="h-[13px] w-[13px]" />
                      );
                    }
                    const isCompleted = completionSet.has(
                      `${habit.id}|${day}`,
                    );
                    return (
                      <div
                        key={day}
                        className="h-[13px] w-[13px] rounded-[2px] transition-colors"
                        style={{
                          backgroundColor: isCompleted
                            ? habit.color
                            : undefined,
                        }}
                        data-empty={!isCompleted ? "" : undefined}
                        title={`${day}${isCompleted ? " ✓" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="h-[13px] w-[13px] rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
          <div
            className="h-[13px] w-[13px] rounded-[2px]"
            style={{ backgroundColor: habit.color, opacity: 0.4 }}
          />
          <div
            className="h-[13px] w-[13px] rounded-[2px]"
            style={{ backgroundColor: habit.color, opacity: 0.7 }}
          />
          <div
            className="h-[13px] w-[13px] rounded-[2px]"
            style={{ backgroundColor: habit.color }}
          />
        </div>
        <span>More</span>
      </div>
    </section>
  );
}

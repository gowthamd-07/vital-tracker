import {
  createHabit,
  deleteHabit,
  getHabitsWithCompletions,
  toggleHabitFormAction,
} from "@/app/actions/habits";
import { recentDays, shortDateLabel } from "@/lib/dates";
import { Flame, Star, Trash2 } from "lucide-react";

const COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Green", value: "#22c55e" },
  { label: "Sky", value: "#0ea5e9" },
  { label: "Red", value: "#ef4444" },
  { label: "Cyan", value: "#06b6d4" },
];

export default async function HabitsPage() {
  const days = recentDays(7);
  const { habits, completions } = await getHabitsWithCompletions(6);

  const done = new Set(
    completions.map((c) => `${c.habitId}|${c.completedDate}`),
  );

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = habits.filter((h) => done.has(`${h.id}|${today}`)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Habits
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {habits.length > 0
            ? `${doneToday} of ${habits.length} completed today. Tap a cell to toggle.`
            : "Create your first habit below."}
        </p>
      </div>

      {/* ── Streak summary cards ───────────────────────── */}
      {habits.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className="h-8 w-1 rounded-full"
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
            </div>
          ))}
        </div>
      )}

      {/* ── New habit form ─────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          New habit
        </h2>
        <form
          action={createHabit}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
            <input
              type="text"
              name="name"
              required
              placeholder="Morning walk"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Color
            <select
              name="color"
              defaultValue={COLORS[0]!.value}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 sm:w-40"
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Add habit
          </button>
        </form>
      </section>

      {/* ── 7-day grid ─────────────────────────────────── */}
      <section className="overflow-x-auto">
        {habits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
            No habits yet. Add one above.
          </p>
        ) : (
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
                      <span
                        className="inline-flex items-center"
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: h.color,
                          paddingLeft: 8,
                        }}
                      >
                        {h.name}
                      </span>
                    </td>
                    {days.map((d) => {
                      const isOn = done.has(`${h.id}|${d}`);
                      return (
                        <td key={d} className="px-0.5 py-1 text-center">
                          <form action={toggleHabitFormAction}>
                            <input
                              type="hidden"
                              name="habitId"
                              value={h.id}
                            />
                            <input
                              type="hidden"
                              name="completedDate"
                              value={d}
                            />
                            <button
                              type="submit"
                              className={`h-9 w-full min-w-[2rem] rounded-lg text-xs font-medium transition ${
                                isOn
                                  ? "bg-emerald-500 text-white shadow-inner hover:bg-emerald-600"
                                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                              }`}
                              aria-label={`Toggle ${h.name} on ${d}`}
                            >
                              {isOn ? "✓" : ""}
                            </button>
                          </form>
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
                      <form action={deleteHabit.bind(null, h.id)}>
                        <button
                          type="submit"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label={`Delete ${h.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

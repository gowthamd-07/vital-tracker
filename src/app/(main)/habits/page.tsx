import {
  createHabit,
  getHabitsWithCompletions,
} from "@/app/actions/habits";
import { recentDays } from "@/lib/dates";
import { HabitsTracker } from "@/components/habits-tracker";

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
  const { habits, completions } = await getHabitsWithCompletions();

  return (
    <div className="space-y-8">
      <HabitsTracker habits={habits} completions={completions} days={days} />

      {/* ── New habit form ─────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
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
    </div>
  );
}

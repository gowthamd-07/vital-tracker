import { auth } from "@/auth";
import { getProfile } from "@/app/actions/profile";
import { getWeightEntries } from "@/app/actions/weight";
import { getHabitsWithCompletions } from "@/app/actions/habits";
import { computeBmi, formatBmi, bmiLabel } from "@/lib/bmi";
import { WeightChart } from "@/components/weight-chart";
import { toggleHabitFormAction } from "@/app/actions/habits";
import Link from "next/link";
import { Flame, TrendingDown, TrendingUp, Minus, Scale, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const profile = await getProfile();
  const weights = await getWeightEntries();
  const { habits, completions } = await getHabitsWithCompletions();

  const latest = weights[0];
  const height = profile?.heightCm ?? 0;
  const bmi = latest && height > 0 ? computeBmi(latest.weightKg, height) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = new Set(
    completions.filter((c) => c.completedDate === today).map((c) => c.habitId),
  );

  // Weight trends
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const d7Str = d7.toISOString().slice(0, 10);
  const d30Str = d30.toISOString().slice(0, 10);

  const weight7 = weights.find((w) => w.entryDate <= d7Str);
  const weight30 = weights.find((w) => w.entryDate <= d30Str);

  const change7 = latest && weight7 ? latest.weightKg - weight7.weightKg : null;
  const change30 = latest && weight30 ? latest.weightKg - weight30.weightKg : null;

  const chartData = weights
    .slice(0, 30)
    .map((w) => ({
      date: w.entryDate,
      weight: w.weightKg,
      bodyFat: w.bodyFatPercent,
    }))
    .reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hello, {session?.user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your health snapshot for today.
        </p>
      </div>

      {/* ── Stats cards ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current weight"
          value={latest ? `${latest.weightKg.toFixed(1)} kg` : "—"}
          sub={latest ? `Logged ${latest.entryDate}` : "No entries yet"}
          icon={<Scale className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="BMI"
          value={bmi > 0 ? formatBmi(bmi) : "—"}
          sub={bmi > 0 ? bmiLabel(bmi) : height <= 0 ? "Set height in Settings" : "Log a weight first"}
          icon={<Activity className="h-5 w-5 text-violet-600" />}
        />
        <StatCard
          label="7-day change"
          value={change7 != null ? `${change7 > 0 ? "+" : ""}${change7.toFixed(1)} kg` : "—"}
          sub={change7 != null ? (change7 < 0 ? "Losing weight" : change7 > 0 ? "Gaining weight" : "Stable") : "Need more data"}
          icon={change7 != null && change7 < 0
            ? <TrendingDown className="h-5 w-5 text-green-600" />
            : change7 != null && change7 > 0
              ? <TrendingUp className="h-5 w-5 text-red-500" />
              : <Minus className="h-5 w-5 text-zinc-400" />
          }
        />
        <StatCard
          label="30-day change"
          value={change30 != null ? `${change30 > 0 ? "+" : ""}${change30.toFixed(1)} kg` : "—"}
          sub={change30 != null ? (change30 < 0 ? "Losing weight" : change30 > 0 ? "Gaining weight" : "Stable") : "Need more data"}
          icon={change30 != null && change30 < 0
            ? <TrendingDown className="h-5 w-5 text-green-600" />
            : change30 != null && change30 > 0
              ? <TrendingUp className="h-5 w-5 text-red-500" />
              : <Minus className="h-5 w-5 text-zinc-400" />
          }
        />
      </div>

      {/* ── Weight chart ────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Weight trend</h2>
          <Link href="/weight" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            View all &rarr;
          </Link>
        </div>
        <WeightChart data={chartData} showBodyFat />
      </section>

      {/* ── Today's habits ──────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Today&apos;s habits</h2>
          <Link href="/habits" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Manage &rarr;
          </Link>
        </div>
        {habits.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No habits yet.{" "}
            <Link href="/habits" className="font-medium text-emerald-700 underline dark:text-emerald-400">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {habits.map((h) => {
              const done = doneToday.has(h.id);
              return (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <form action={toggleHabitFormAction}>
                      <input type="hidden" name="habitId" value={h.id} />
                      <input type="hidden" name="completedDate" value={today} />
                      <button
                        type="submit"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                          done
                            ? "bg-emerald-500 text-white shadow-inner"
                            : "border border-zinc-300 bg-white text-zinc-400 hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-950"
                        }`}
                        aria-label={`Toggle ${h.name}`}
                      >
                        {done ? "✓" : ""}
                      </button>
                    </form>
                    <span
                      className="truncate font-medium text-zinc-800 dark:text-zinc-200"
                      style={{ borderLeftWidth: 3, borderLeftColor: h.color, paddingLeft: 8 }}
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
                    <span className={done ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}>
                      {done ? "Done" : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

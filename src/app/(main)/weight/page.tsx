import { getProfile } from "@/app/actions/profile";
import { getHabitsWithCompletions } from "@/app/actions/habits";
import { updateGymCalorieBurn } from "@/app/actions/profile";
import { deleteWeightEntry, getWeightEntries, upsertWeightEntry } from "@/app/actions/weight";
import { computeBmi, formatBmi, bmiLabel } from "@/lib/bmi";
import { computeAge, computeBmr, computeTdee, computeHealthMetrics } from "@/lib/health";
import type { Gender, ActivityLevel } from "@/lib/health";
import { LazyWeightChart } from "@/components/lazy-weight-chart";
import { todayIST, nowIST, daysBetween } from "@/lib/dates";
import { findGymHabit } from "@/lib/gym-detect";
import { Trash2, TrendingDown, TrendingUp, Minus, Target, Dumbbell, Zap } from "lucide-react";
import Link from "next/link";

export default async function WeightPage() {
  const [profile, entries, { habits, completions }] = await Promise.all([
    getProfile(),
    getWeightEntries(),
    getHabitsWithCompletions(),
  ]);
  const height = profile?.heightCm ?? 0;
  const today = todayIST();

  const chartData = entries
    .map((w) => ({
      date: w.entryDate,
      weight: w.weightKg,
      bodyFat: w.bodyFatPercent,
    }))
    .reverse();

  const latest = entries[0];
  const ist = nowIST();
  const d7 = new Date(ist); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(ist); d30.setDate(d30.getDate() - 30);
  const weight7 = entries.find((w) => w.entryDate <= d7.toISOString().slice(0, 10));
  const weight30 = entries.find((w) => w.entryDate <= d30.toISOString().slice(0, 10));
  const change7 = latest && weight7 ? latest.weightKg - weight7.weightKg : null;
  const change30 = latest && weight30 ? latest.weightKg - weight30.weightKg : null;

  const targetWeightKg = profile?.targetWeightKg ?? null;
  const targetDate = profile?.targetDate ?? null;

  const gymHabit = findGymHabit(habits);
  const gymDatesSet = new Set(
    gymHabit
      ? completions
          .filter((c) => c.habitId === gymHabit.id)
          .map((c) => c.completedDate)
      : [],
  );
  const isGymToday = gymDatesSet.has(today);

  const gymCalorieBurn = profile?.gymCalorieBurn ?? 0;
  const hasFullProfile =
    !!profile?.dateOfBirth && !!profile?.gender && !!profile?.activityLevel;
  const healthMetrics =
    hasFullProfile && latest && height > 0
      ? computeHealthMetrics({
          weightKg: latest.weightKg,
          heightCm: height,
          dateOfBirth: profile.dateOfBirth!,
          gender: profile.gender as Gender,
          activityLevel: profile.activityLevel as ActivityLevel,
          targetWeightKg,
          daysLeft: targetDate ? daysBetween(today, targetDate) : null,
          gymCalorieBurn,
          isGymDay: isGymToday,
        })
      : null;

  // Per-row calorie computation helper
  const canComputeCalories = hasFullProfile && height > 0;
  const age = canComputeCalories ? computeAge(profile.dateOfBirth!) : 0;
  function rowTdee(weightKg: number, isGym: boolean): number | null {
    if (!canComputeCalories) return null;
    const bmr = computeBmr(weightKg, height, age, profile!.gender as Gender);
    const base = computeTdee(bmr, profile!.activityLevel as ActivityLevel);
    return isGym ? base + gymCalorieBurn : base;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Weight log
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Track weight, body fat, and BMI.{" "}
          {height <= 0 && (
            <>
              <Link href="/settings" className="text-emerald-700 underline dark:text-emerald-400">
                Set your height
              </Link>{" "}
              to enable BMI.
            </>
          )}
        </p>
      </div>

      {/* ── Goal summary ──────────────────────────────── */}
      {targetWeightKg != null && latest && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <Target className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold">{Math.abs(latest.weightKg - targetWeightKg).toFixed(1)} kg</span>
            {" "}away from your goal of{" "}
            <span className="font-semibold">{targetWeightKg} kg</span>
            {targetDate && <> by <span className="font-semibold">{targetDate}</span></>}
          </p>
        </div>
      )}

      {/* ── Today's calorie plan ─────────────────────── */}
      {healthMetrics && (
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3 ${
          isGymToday
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }`}>
          <div className="flex items-center gap-2">
            {isGymToday
              ? <Dumbbell className="h-4 w-4 text-emerald-600" />
              : <Zap className="h-4 w-4 text-yellow-500" />}
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Today ({isGymToday ? "Gym" : "Rest"})
            </span>
          </div>
          <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
            TDEE <strong>{Math.round(healthMetrics.tdee)}</strong> kcal
          </span>
          {healthMetrics.targetCalories != null && (
            <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
              Target <strong>{Math.round(healthMetrics.targetCalories)}</strong> kcal
            </span>
          )}
          {gymCalorieBurn > 0 && (
            <span className="text-sm tabular-nums text-zinc-500">
              Gym burn +{gymCalorieBurn} kcal
            </span>
          )}
        </div>
      )}

      {/* ── Gym day bonus ──────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Gym day bonus
          </h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Extra calories burned during a typical workout. On days you
          check a &ldquo;Gym&rdquo; habit, your TDEE and calorie targets
          adjust automatically.
        </p>
        <form action={updateGymCalorieBurn} className="mt-3 flex items-end gap-3">
          <label className="block max-w-xs text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Workout calorie burn (kcal)
            <input
              type="number"
              name="gymCalorieBurn"
              min={0}
              max={2000}
              step={50}
              placeholder="e.g. 400"
              defaultValue={gymCalorieBurn > 0 ? String(gymCalorieBurn) : ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Save
          </button>
        </form>
        <span className="mt-1.5 block text-xs text-zinc-500">
          Leave empty or 0 if you don&apos;t want gym-day adjustments.
        </span>
      </section>

      {/* ── Trend summary ─────────────────────────────── */}
      {latest && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <TrendCard
            label="Latest"
            value={`${latest.weightKg.toFixed(1)} kg`}
            sub={latest.entryDate}
          />
          <TrendCard
            label="7-day"
            value={change7 != null ? `${change7 > 0 ? "+" : ""}${change7.toFixed(1)} kg` : "—"}
            sub={change7 != null ? (change7 < 0 ? "Down" : change7 > 0 ? "Up" : "Stable") : "Not enough data"}
            icon={change7 != null && change7 !== 0 ? (change7 < 0 ? <TrendingDown className="h-4 w-4 text-green-500" /> : <TrendingUp className="h-4 w-4 text-red-500" />) : <Minus className="h-4 w-4 text-zinc-400" />}
          />
          <TrendCard
            label="30-day"
            value={change30 != null ? `${change30 > 0 ? "+" : ""}${change30.toFixed(1)} kg` : "—"}
            sub={change30 != null ? (change30 < 0 ? "Down" : change30 > 0 ? "Up" : "Stable") : "Not enough data"}
            icon={change30 != null && change30 !== 0 ? (change30 < 0 ? <TrendingDown className="h-4 w-4 text-green-500" /> : <TrendingUp className="h-4 w-4 text-red-500" />) : <Minus className="h-4 w-4 text-zinc-400" />}
          />
        </div>
      )}

      {/* ── Chart ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Weight over time
        </h2>
        <LazyWeightChart data={chartData} height={300} showBodyFat targetWeight={targetWeightKg ?? undefined} />
      </section>

      {/* ── Add form ──────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Add or update entry
        </h2>
        <form action={upsertWeightEntry} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date
            <input
              type="date"
              name="entryDate"
              required
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Weight (kg)
            <input
              type="number"
              name="weightKg"
              required
              min={20}
              max={400}
              step="0.1"
              placeholder="72.5"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Body fat (%)
            <input
              type="number"
              name="bodyFatPercent"
              min={0}
              max={100}
              step="0.1"
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
            Notes
            <input
              type="text"
              name="notes"
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Save entry
            </button>
          </div>
        </form>
      </section>

      {/* ── History table ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          History ({entries.length} entries)
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100/80 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4 dark:text-zinc-300">Date</th>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4 dark:text-zinc-300">Weight</th>
                <th className="hidden px-4 py-3 font-medium text-zinc-700 sm:table-cell dark:text-zinc-300">Body fat</th>
                <th className="hidden px-4 py-3 font-medium text-zinc-700 sm:table-cell dark:text-zinc-300">BMI</th>
                {canComputeCalories && (
                  <th className="hidden px-4 py-3 font-medium text-zinc-700 sm:table-cell dark:text-zinc-300">Calories</th>
                )}
                <th className="hidden px-4 py-3 font-medium text-zinc-700 md:table-cell dark:text-zinc-300">Notes</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={canComputeCalories ? 7 : 6} className="px-4 py-8 text-center text-zinc-500">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((row) => {
                  const b = height > 0 ? computeBmi(row.weightKg, height) : 0;
                  const isGymRow = gymDatesSet.has(row.entryDate);
                  const tdeeVal = rowTdee(row.weightKg, isGymRow);
                  return (
                    <tr key={row.id} className={isGymRow ? "bg-emerald-50/40 dark:bg-emerald-950/10" : ""}>
                      <td className="px-3 py-3 tabular-nums text-zinc-800 sm:px-4 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5">
                          {row.entryDate}
                          {isGymRow && <Dumbbell className="h-3.5 w-3.5 text-emerald-500" />}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums sm:px-4">
                        {row.weightKg.toFixed(1)} kg
                        <span className="mt-0.5 block text-[11px] text-zinc-500 sm:hidden">
                          {row.bodyFatPercent != null && `${row.bodyFatPercent.toFixed(1)}% BF`}
                          {height > 0 && row.bodyFatPercent != null && " · "}
                          {height > 0 && `BMI ${formatBmi(b)}`}
                          {tdeeVal != null && ` · ${Math.round(tdeeVal)} kcal`}
                          {isGymRow && gymCalorieBurn > 0 && ` (+${gymCalorieBurn})`}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums text-zinc-600 sm:table-cell dark:text-zinc-400">
                        {row.bodyFatPercent != null ? `${row.bodyFatPercent.toFixed(1)}%` : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-700 sm:table-cell dark:text-zinc-300">
                        {height > 0 ? (
                          <>
                            {formatBmi(b)}
                            <span className="ml-1 text-xs text-zinc-500">({bmiLabel(b)})</span>
                          </>
                        ) : "—"}
                      </td>
                      {canComputeCalories && (
                        <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                          {tdeeVal != null ? (
                            <span className="flex items-center gap-1.5">
                              <span className={isGymRow ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}>
                                {Math.round(tdeeVal)}
                              </span>
                              <span className="text-xs text-zinc-500">kcal</span>
                              {isGymRow && gymCalorieBurn > 0 && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                  +{gymCalorieBurn}
                                </span>
                              )}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      <td className="hidden max-w-[12rem] truncate px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">
                        {row.notes ?? "—"}
                      </td>
                      <td className="px-2 py-3">
                        <form action={deleteWeightEntry.bind(null, row.id)}>
                          <button
                            type="submit"
                            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TrendCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">{label}</span>
      <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
        <span className="text-base font-semibold tabular-nums text-zinc-900 sm:text-xl dark:text-zinc-50">{value}</span>
        {icon}
      </div>
      <span className="text-[10px] text-zinc-500 sm:text-xs">{sub}</span>
    </div>
  );
}

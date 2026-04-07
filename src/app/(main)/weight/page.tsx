import { getProfile } from "@/app/actions/profile";
import { deleteWeightEntry, getWeightEntries, upsertWeightEntry } from "@/app/actions/weight";
import { computeBmi, formatBmi, bmiLabel } from "@/lib/bmi";
import { WeightChart } from "@/components/weight-chart";
import { Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default async function WeightPage() {
  const profile = await getProfile();
  const entries = await getWeightEntries();
  const height = profile?.heightCm ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  const chartData = entries
    .map((w) => ({
      date: w.entryDate,
      weight: w.weightKg,
      bodyFat: w.bodyFatPercent,
    }))
    .reverse();

  // Trends
  const latest = entries[0];
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const weight7 = entries.find((w) => w.entryDate <= d7.toISOString().slice(0, 10));
  const weight30 = entries.find((w) => w.entryDate <= d30.toISOString().slice(0, 10));
  const change7 = latest && weight7 ? latest.weightKg - weight7.weightKg : null;
  const change30 = latest && weight30 ? latest.weightKg - weight30.weightKg : null;

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
              <a href="/settings" className="text-emerald-700 underline dark:text-emerald-400">
                Set your height
              </a>{" "}
              to enable BMI.
            </>
          )}
        </p>
      </div>

      {/* ── Trend summary ─────────────────────────────── */}
      {latest && (
        <div className="grid gap-4 sm:grid-cols-3">
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
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Weight over time
        </h2>
        <WeightChart data={chartData} height={300} showBodyFat />
      </section>

      {/* ── Add form ──────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-zinc-100/80 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Weight</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Body fat</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">BMI</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Notes</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((row) => {
                  const b = height > 0 ? computeBmi(row.weightKg, height) : 0;
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {row.entryDate}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{row.weightKg.toFixed(1)} kg</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {row.bodyFatPercent != null ? `${row.bodyFatPercent.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {height > 0 ? (
                          <>
                            {formatBmi(b)}
                            <span className="ml-1 text-xs text-zinc-500">({bmiLabel(b)})</span>
                          </>
                        ) : "—"}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</span>
        {icon}
      </div>
      <span className="text-xs text-zinc-500">{sub}</span>
    </div>
  );
}

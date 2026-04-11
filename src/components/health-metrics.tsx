import type { HealthMetrics } from "@/lib/health";
import {
  Flame as Fire,
  Droplets,
  Zap,
  Heart,
  TrendingDown,
  Utensils,
} from "lucide-react";
import Link from "next/link";

export function HealthMetricsPanel({ metrics }: { metrics: HealthMetrics }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Health insights
        </h2>
        <Link
          href="/settings"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Edit profile &rarr;
        </Link>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <MetricTile
          icon={<Fire className="h-5 w-5 text-orange-500" />}
          label="BMR"
          value={`${Math.round(metrics.bmr)}`}
          unit="kcal/day"
          description="Base calories your body burns at rest"
        />
        <MetricTile
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          label="TDEE"
          value={`${Math.round(metrics.tdee)}`}
          unit="kcal/day"
          description="Total daily energy expenditure"
        />
        <MetricTile
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          label="Ideal weight"
          value={`${metrics.idealWeight.min.toFixed(0)}–${metrics.idealWeight.max.toFixed(0)}`}
          unit="kg"
          description="Healthy BMI range (18.5–24.9)"
        />
        <MetricTile
          icon={<Droplets className="h-5 w-5 text-blue-500" />}
          label="Water intake"
          value={metrics.waterLiters.toFixed(1)}
          unit="L/day"
          description="Recommended daily water"
        />
        {metrics.targetCalories != null && (
          <MetricTile
            icon={<Utensils className="h-5 w-5 text-violet-500" />}
            label="Target calories"
            value={`${Math.round(metrics.targetCalories)}`}
            unit="kcal/day"
            description="To reach your weight goal"
          />
        )}
        {metrics.dailyDeficit != null && (
          <MetricTile
            icon={<TrendingDown className="h-5 w-5 text-emerald-500" />}
            label="Daily deficit"
            value={`${Math.round(metrics.dailyDeficit)}`}
            unit="kcal"
            description="Calorie reduction needed"
          />
        )}
      </div>
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
        <span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>
    </div>
  );
}

export function HealthMetricsEmpty() {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-zinc-400" />
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Unlock health insights
          </p>
          <p className="text-xs text-zinc-500">
            <Link
              href="/settings"
              className="font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              Complete your profile
            </Link>{" "}
            (height, date of birth, gender, activity level) to see BMR, TDEE, ideal weight, and more.
          </p>
        </div>
      </div>
    </section>
  );
}

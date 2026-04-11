import { auth } from "@/auth";
import { getProfile } from "@/app/actions/profile";
import { getWeightEntries, upsertWeightEntry } from "@/app/actions/weight";
import { getHabitsWithCompletions } from "@/app/actions/habits";
import { computeBmi, formatBmi, bmiLabel } from "@/lib/bmi";
import { computeHealthMetrics } from "@/lib/health";
import type { Gender, ActivityLevel } from "@/lib/health";
import { LazyWeightChart } from "@/components/lazy-weight-chart";
import { DashboardHabits } from "@/components/dashboard-habits";
import { QuickLog } from "@/components/quick-log";
import { OnboardingChecklist } from "@/components/onboarding";
import { HealthMetricsPanel, HealthMetricsEmpty } from "@/components/health-metrics";
import { ProgressCard } from "@/components/progress-card";
import Link from "next/link";
import { todayIST, nowIST, daysBetween } from "@/lib/dates";
import { analyzeGoal } from "@/lib/motivation";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Scale,
  Activity,
  Target,
  Zap,
} from "lucide-react";

export default async function DashboardPage() {
  const [session, profile, weights, { habits, completions }] =
    await Promise.all([
      auth(),
      getProfile(),
      getWeightEntries(),
      getHabitsWithCompletions(),
    ]);

  const latest = weights[0];
  const height = profile?.heightCm ?? 0;
  const bmi = latest && height > 0 ? computeBmi(latest.weightKg, height) : 0;

  const today = todayIST();
  const hasLoggedToday = latest?.entryDate === today;

  const ist = nowIST();
  const d7 = new Date(ist);
  d7.setDate(d7.getDate() - 7);
  const d30 = new Date(ist);
  d30.setDate(d30.getDate() - 30);
  const d7Str = d7.toISOString().slice(0, 10);
  const d30Str = d30.toISOString().slice(0, 10);

  const weight7 = weights.find((w) => w.entryDate <= d7Str);
  const weight30 = weights.find((w) => w.entryDate <= d30Str);

  const change7 =
    latest && weight7 ? latest.weightKg - weight7.weightKg : null;
  const change30 =
    latest && weight30 ? latest.weightKg - weight30.weightKg : null;

  const chartData = weights
    .slice(0, 30)
    .map((w) => ({
      date: w.entryDate,
      weight: w.weightKg,
      bodyFat: w.bodyFatPercent,
    }))
    .reverse();

  const targetWeightKg = profile?.targetWeightKg ?? null;
  const targetDate = profile?.targetDate ?? null;
  const hasGoal = targetWeightKg != null && targetDate != null;

  const oldestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const goal = hasGoal
    ? analyzeGoal({
        currentWeight: latest?.weightKg ?? null,
        startWeight: oldestWeight?.weightKg ?? null,
        targetWeight: targetWeightKg,
        targetDate,
        today,
      })
    : null;

  const statusColor =
    goal?.status === "reached"
      ? "emerald"
      : goal?.status === "on_track"
        ? "emerald"
        : goal?.status === "behind"
          ? "amber"
          : goal?.status === "far_behind"
            ? "red"
            : "zinc";

  // Health metrics
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
          daysLeft:
            targetDate ? daysBetween(today, targetDate) : null,
        })
      : null;

  // Onboarding state
  const hasHeight = height > 0;
  const hasWeight = weights.length > 0;
  const hasHabits = habits.length > 0;
  const showOnboarding = !hasHeight || !hasWeight || !hasGoal || !hasHabits || !hasFullProfile;

  // Progress card data
  const daysTracking = profile?.createdAt
    ? Math.max(1, daysBetween(profile.createdAt.toISOString().slice(0, 10), today))
    : 0;
  const totalChange =
    oldestWeight && latest && weights.length > 1
      ? latest.weightKg - oldestWeight.weightKg
      : null;
  const bestStreak = Math.max(0, ...habits.map((h) => h.bestStreak));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hello, {session?.user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {new Date(today + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Onboarding checklist ──────────────────────── */}
      {showOnboarding && (
        <OnboardingChecklist
          hasHeight={hasHeight}
          hasWeight={hasWeight}
          hasGoal={hasGoal}
          hasHabits={hasHabits}
          hasProfile={hasFullProfile}
        />
      )}

      {/* ── Quick log today's weight ─────────────────── */}
      <QuickLog today={today} action={upsertWeightEntry} hasToday={hasLoggedToday} />

      {/* ── Weight goal motivation ────────────────────── */}
      {hasGoal && goal ? (
        <section
          className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
            statusColor === "emerald"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
              : statusColor === "amber"
                ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                : statusColor === "red"
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-full p-2 ${
                statusColor === "emerald"
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : statusColor === "amber"
                    ? "bg-amber-100 dark:bg-amber-900/50"
                    : statusColor === "red"
                      ? "bg-red-100 dark:bg-red-900/50"
                      : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {goal.status === "reached" ? (
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Target className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {goal.message}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {goal.sub}
              </p>
              {goal.progressPct > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Progress</span>
                    <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {goal.progressPct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        statusColor === "emerald"
                          ? "bg-emerald-500"
                          : statusColor === "amber"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${goal.progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : !hasGoal ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No weight goal set
              </p>
              <p className="text-xs text-zinc-500">
                <Link
                  href="/settings"
                  className="font-medium text-emerald-700 underline dark:text-emerald-400"
                >
                  Set a target weight &amp; date
                </Link>{" "}
                to get motivational tracking here.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Stats cards ─────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current weight"
          value={latest ? `${latest.weightKg.toFixed(1)} kg` : "—"}
          sub={latest ? `Logged ${latest.entryDate}` : "No entries yet"}
          icon={<Scale className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="BMI"
          value={bmi > 0 ? formatBmi(bmi) : "—"}
          sub={
            bmi > 0
              ? bmiLabel(bmi)
              : height <= 0
                ? "Set height in Settings"
                : "Log a weight first"
          }
          icon={<Activity className="h-5 w-5 text-violet-600" />}
        />
        <StatCard
          label="7-day change"
          value={
            change7 != null
              ? `${change7 > 0 ? "+" : ""}${change7.toFixed(1)} kg`
              : "—"
          }
          sub={
            change7 != null
              ? change7 < 0
                ? "Losing weight"
                : change7 > 0
                  ? "Gaining weight"
                  : "Stable"
              : "Need more data"
          }
          icon={
            change7 != null && change7 < 0 ? (
              <TrendingDown className="h-5 w-5 text-green-600" />
            ) : change7 != null && change7 > 0 ? (
              <TrendingUp className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-zinc-400" />
            )
          }
        />
        <StatCard
          label="30-day change"
          value={
            change30 != null
              ? `${change30 > 0 ? "+" : ""}${change30.toFixed(1)} kg`
              : "—"
          }
          sub={
            change30 != null
              ? change30 < 0
                ? "Losing weight"
                : change30 > 0
                  ? "Gaining weight"
                  : "Stable"
              : "Need more data"
          }
          icon={
            change30 != null && change30 < 0 ? (
              <TrendingDown className="h-5 w-5 text-green-600" />
            ) : change30 != null && change30 > 0 ? (
              <TrendingUp className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-zinc-400" />
            )
          }
        />
      </div>

      {/* ── Health insights ─────────────────────────── */}
      {healthMetrics ? (
        <HealthMetricsPanel metrics={healthMetrics} />
      ) : (
        <HealthMetricsEmpty />
      )}

      {/* ── Weight chart ────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Weight trend
          </h2>
          <Link
            href="/weight"
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            View all &rarr;
          </Link>
        </div>
        <LazyWeightChart
          data={chartData}
          showBodyFat
          targetWeight={targetWeightKg ?? undefined}
        />
      </section>

      {/* ── Today's habits ──────────────────────────── */}
      <DashboardHabits habits={habits} completions={completions} today={today} />

      {/* ── Shareable progress card ─────────────────── */}
      {hasWeight && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Share your progress
          </h2>
          <ProgressCard
            data={{
              name: session?.user?.name?.split(" ")[0] ?? "User",
              currentWeight: latest?.weightKg ?? null,
              startWeight: oldestWeight?.weightKg ?? null,
              bmi: bmi > 0 ? bmi : null,
              bmiLabel: bmi > 0 ? bmiLabel(bmi) : "",
              streakDays: bestStreak,
              habitsCount: habits.length,
              daysTracking,
              weightChange: totalChange,
              goalWeight: targetWeightKg,
            }}
          />
        </section>
      )}
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs dark:text-zinc-400">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-zinc-900 sm:mt-2 sm:text-2xl dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{sub}</p>
    </div>
  );
}

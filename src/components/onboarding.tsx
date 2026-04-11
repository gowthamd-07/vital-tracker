import Link from "next/link";
import {
  Scale,
  Ruler,
  Target,
  CheckSquare,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Step {
  done: boolean;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

export function OnboardingChecklist({
  hasHeight,
  hasWeight,
  hasGoal,
  hasHabits,
  hasProfile,
}: {
  hasHeight: boolean;
  hasWeight: boolean;
  hasGoal: boolean;
  hasHabits: boolean;
  hasProfile: boolean;
}) {
  const steps: Step[] = [
    {
      done: hasProfile,
      label: "Complete your profile",
      description: "Add date of birth, gender, and activity level for health insights.",
      href: "/settings",
      icon: <User className="h-5 w-5" />,
    },
    {
      done: hasHeight,
      label: "Set your height",
      description: "Required for BMI and ideal weight calculations.",
      href: "/settings",
      icon: <Ruler className="h-5 w-5" />,
    },
    {
      done: hasWeight,
      label: "Log your first weight",
      description: "Start tracking your progress today.",
      href: "/weight",
      icon: <Scale className="h-5 w-5" />,
    },
    {
      done: hasGoal,
      label: "Set a weight goal",
      description: "Get motivational tracking and calorie guidance.",
      href: "/settings",
      icon: <Target className="h-5 w-5" />,
    },
    {
      done: hasHabits,
      label: "Create your first habit",
      description: "Build consistency with daily habit tracking.",
      href: "/habits",
      icon: <CheckSquare className="h-5 w-5" />,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (allDone) return null;

  const pct = Math.round((completed / steps.length) * 100);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:to-zinc-900">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Get started with VitalTrack
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {completed} of {steps.length} steps complete
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                step.done
                  ? "bg-emerald-100/50 dark:bg-emerald-950/20"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-zinc-300 text-zinc-400 dark:border-zinc-600"
                }`}
              >
                {step.done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.done
                      ? "text-zinc-500 line-through dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-zinc-500">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
